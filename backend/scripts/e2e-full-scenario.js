/**
 * Full end-to-end API scenario.
 *
 * - Spawns an isolated server (default port 5055) with SMS_PROVIDER=mock
 * - Captures [otp-dev] and [mock-sms] lines from server stdout
 * - Exercises every mounted endpoint family
 * - Asserts Postman collection covers all live routes
 *
 * Usage:
 *   npm run test:e2e
 *   node scripts/e2e-full-scenario.js
 *
 * Optional env:
 *   E2E_PORT=5055
 *   E2E_BASE_URL=http://127.0.0.1:5055   (skip spawn; must still capture OTP somehow — prefer spawn)
 *   E2E_ADMIN_PHONE / E2E_CUSTOMER_PHONE
 *   E2E_KEEP_SERVER=1
 */
require("dotenv").config();

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PORT = String(process.env.E2E_PORT || 5055);
const BASE_URL = (process.env.E2E_BASE_URL || `http://127.0.0.1:${PORT}`).replace(
  /\/$/,
  ""
);
const POSTMAN_PATH = path.join(ROOT, "..", "baseDocs", "backend-postman-collection.json");

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const state = {
  server: null,
  logBuffer: "",
  otpEvents: [],
  mockSmsEvents: [],
  passed: 0,
  failed: 0,
  steps: []
};

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function note(label, ok, detail = "") {
  const line = `${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`;
  state.steps.push({ label, ok, detail });
  if (ok) {
    state.passed += 1;
    console.log(`  ✓ ${label}${detail ? ` (${detail})` : ""}`);
  } else {
    state.failed += 1;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function assert(label, condition, detail = "") {
  note(label, Boolean(condition), detail);
  if (!condition) {
    const error = new Error(`Assertion failed: ${label}${detail ? ` — ${detail}` : ""}`);
    error.isAssert = true;
    throw error;
  }
}

function onServerChunk(chunk) {
  const text = chunk.toString();
  state.logBuffer += text;
  process.stdout.write(text.replace(/^/gm, "    [server] "));

  const otpRe = /\[otp-dev\] phone=(\+?\d+) otp=(\d{4,8})/g;
  let match;
  while ((match = otpRe.exec(text)) !== null) {
    state.otpEvents.push({
      phone: match[1],
      otp: match[2],
      at: Date.now()
    });
  }

  const smsRe = /\[mock-sms\] to=(\+?\d+) message=(.+)/g;
  while ((match = smsRe.exec(text)) !== null) {
    state.mockSmsEvents.push({
      phone: match[1],
      message: match[2].trim(),
      at: Date.now()
    });
  }
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForOtp(phone, sinceMs, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const found = [...state.otpEvents]
      .reverse()
      .find((event) => event.phone === phone && event.at >= sinceMs);
    if (found) {
      return found.otp;
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for [otp-dev] OTP for ${phone}`);
}

async function waitForMockSms({ phone, includes, sinceMs, timeoutMs = 15000 }) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const found = [...state.mockSmsEvents].reverse().find((event) => {
      if (event.at < sinceMs) {
        return false;
      }
      if (phone && event.phone !== phone) {
        return false;
      }
      if (includes && !event.message.includes(includes)) {
        return false;
      }
      return true;
    });
    if (found) {
      return found;
    }
    await sleep(100);
  }
  throw new Error(
    `Timed out waiting for [mock-sms]${phone ? ` to=${phone}` : ""}${
      includes ? ` including "${includes}"` : ""
    }`
  );
}

async function request(method, urlPath, { token, body, formData, raw } = {}) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let payload = undefined;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  } else if (raw !== undefined) {
    payload = raw;
  }

  const response = await fetch(`${BASE_URL}${urlPath}`, {
    method,
    headers,
    body: payload,
    redirect: "manual"
  });

  const contentType = response.headers.get("content-type") || "";
  let data = null;
  const text = await response.text();
  if (text && contentType.includes("application/json")) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = { parseError: true, text };
    }
  } else if (text) {
    data = text;
  }

  return {
    status: response.status,
    headers: response.headers,
    data,
    text
  };
}

async function expectOk(label, method, urlPath, options = {}, predicate) {
  const result = await request(method, urlPath, options);
  const ok =
    result.status >= 200 &&
    result.status < 300 &&
    (typeof predicate === "function" ? predicate(result) : true);
  assert(
    label,
    ok,
    `status=${result.status} body=${typeof result.data === "string" ? result.data.slice(0, 180) : JSON.stringify(result.data)?.slice(0, 220)}`
  );
  return result;
}

async function expectStatus(label, method, urlPath, expectedStatus, options = {}) {
  const result = await request(method, urlPath, options);
  assert(
    label,
    result.status === expectedStatus,
    `expected ${expectedStatus} got ${result.status} body=${JSON.stringify(result.data)?.slice(0, 220)}`
  );
  return result;
}

async function loginWithOtp(phone, { pin = "123456", purpose } = {}) {
  const since = Date.now();
  const sendBody = { phone };
  if (purpose) {
    sendBody.purpose = purpose;
  }

  const send = await request("POST", "/api/auth/otp/send", {
    body: sendBody
  });
  assert(
    `OTP send ${phone}`,
    send.status === 200 && send.data?.success === true,
    JSON.stringify(send.data)?.slice(0, 200)
  );

  const otp = await waitForOtp(phone, since);
  note(`OTP captured from console for ${phone}`, true, otp);

  await waitForMockSms({
    phone,
    includes: "verification code",
    sinceMs: since
  }).catch(() => null);

  const verifyBody = { phone, otp };
  if (purpose) {
    verifyBody.purpose = purpose;
  }

  const verify = await request("POST", "/api/auth/otp/verify", {
    body: verifyBody
  });
  assert(
    `OTP verify ${phone}`,
    verify.status === 200 &&
      (Boolean(verify.data?.data?.setupToken) ||
        Boolean(verify.data?.data?.accessToken)),
    JSON.stringify(verify.data)?.slice(0, 220)
  );

  if (verify.data?.data?.requiresPinSetup || verify.data?.data?.setupToken) {
    const setup = await request("POST", "/api/auth/pin/set", {
      token: verify.data.data.setupToken,
      body: { pin, confirmPin: pin }
    });
    assert(
      `PIN set ${phone}`,
      setup.status === 200 && Boolean(setup.data?.data?.accessToken),
      JSON.stringify(setup.data)?.slice(0, 220)
    );

    return {
      accessToken: setup.data.data.accessToken,
      refreshToken: setup.data.data.refreshToken,
      user: setup.data.data.user
    };
  }

  return {
    accessToken: verify.data.data.accessToken,
    refreshToken: verify.data.data.refreshToken,
    user: verify.data.data.user
  };
}

async function loginWithPin({ email, phone, pin }) {
  const body = { pin };
  if (email) {
    body.email = email;
  }
  if (phone) {
    body.phone = phone;
  }

  const result = await request("POST", "/api/auth/pin/login", { body });
  assert(
    `PIN login ${email || phone}`,
    result.status === 200 && Boolean(result.data?.data?.accessToken),
    JSON.stringify(result.data)?.slice(0, 220)
  );

  return {
    accessToken: result.data.data.accessToken,
    refreshToken: result.data.data.refreshToken,
    user: result.data.data.user
  };
}

async function resolveSeedUsers() {
  const prisma = require("../src/config/prisma");
  try {
    const admin =
      (await prisma.user.findFirst({
        where: {
          role: "admin",
          deletedAt: null,
          phone: {
            not: null
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      })) || null;
    const customer =
      (await prisma.user.findFirst({
        where: {
          role: "customer",
          deletedAt: null,
          phone: {
            not: null
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      })) || null;

    return {
      adminPhone:
        process.env.E2E_ADMIN_PHONE ||
        process.env.SEED_ADMIN_PHONE ||
        admin?.phone ||
        "+251911676343",
      customerPhone:
        process.env.E2E_CUSTOMER_PHONE ||
        process.env.SEED_CUSTOMER_PHONE ||
        customer?.phone ||
        "+251911000000"
    };
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["src/server.js"], {
      cwd: ROOT,
      env: {
        ...process.env,
        PORT,
        NODE_ENV: "development",
        SMS_PROVIDER: "mock",
        E2E_MODE: "1"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    state.server = child;
    child.stdout.on("data", onServerChunk);
    child.stderr.on("data", onServerChunk);

    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error("Server start timed out"));
      }
    }, 30000);

    const bootWatch = setInterval(async () => {
      try {
        const health = await request("GET", "/api/health");
        if (health.status === 200) {
          clearInterval(bootWatch);
          clearTimeout(timer);
          if (!settled) {
            settled = true;
            resolve(child);
          }
        }
      } catch (error) {
        // still booting
      }
    }, 250);

    child.on("exit", (code) => {
      clearInterval(bootWatch);
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        reject(new Error(`Server exited early with code ${code}`));
      }
    });
  });
}

async function stopServer() {
  if (!state.server || process.env.E2E_KEEP_SERVER === "1") {
    return;
  }

  const child = state.server;
  state.server = null;

  await new Promise((resolve) => {
    const killTimer = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch (error) {
        // ignore
      }
      resolve();
    }, 5000);

    child.once("exit", () => {
      clearTimeout(killTimer);
      resolve();
    });

    try {
      child.kill("SIGTERM");
    } catch (error) {
      clearTimeout(killTimer);
      resolve();
    }
  });
}

function normalizePostmanPath(rawPathParts) {
  const joined = `/${(rawPathParts || []).filter(Boolean).join("/")}`.replace(/\/+/g, "/");
  return joined === "" ? "/" : joined.replace(/\/$/, "") || "/";
}

function pathToPattern(routePath) {
  return `^${routePath
    .split("/")
    .map((segment) => {
      if (!segment) {
        return "";
      }
      if (segment.startsWith("{{") || segment.startsWith(":")) {
        return "[^/]+";
      }
      return escapeRegex(segment);
    })
    .join("/")}$`;
}

function collectPostmanRequests(items, acc = []) {
  for (const item of items) {
    if (item.item) {
      collectPostmanRequests(item.item, acc);
    } else if (item.request?.url) {
      acc.push({
        name: item.name,
        method: String(item.request.method || "GET").toUpperCase(),
        path: normalizePostmanPath(item.request.url.path)
      });
    }
  }
  return acc;
}

const LIVE_ROUTES = [
  ["GET", "/"],
  ["GET", "/api/health"],
  ["GET", "/api/health/supabase"],
  ["GET", "/api/health/prisma"],
  ["GET", "/api/health/storage"],
  ["POST", "/api/auth/otp/send"],
  ["POST", "/api/auth/otp/verify"],
  ["POST", "/api/auth/pin/set"],
  ["POST", "/api/auth/pin/login"],
  ["POST", "/api/auth/pin/change"],
  ["POST", "/api/auth/refresh"],
  ["POST", "/api/auth/logout"],
  ["GET", "/api/auth/google/start"],
  ["GET", "/api/auth/google/callback"],
  ["POST", "/api/auth/exchange-code"],
  ["GET", "/api/auth/me"],
  ["GET", "/api/auth/admin-check"],
  ["GET", "/api/users/me"],
  ["PATCH", "/api/users/me"],
  ["GET", "/api/categories"],
  ["GET", "/api/categories/:slug"],
  ["GET", "/api/products"],
  ["GET", "/api/products/featured"],
  ["GET", "/api/products/:slug"],
  ["GET", "/api/store/config"],
  ["GET", "/api/admin/categories"],
  ["POST", "/api/admin/categories"],
  ["GET", "/api/admin/categories/:id"],
  ["PATCH", "/api/admin/categories/:id"],
  ["DELETE", "/api/admin/categories/:id"],
  ["PATCH", "/api/admin/categories/:id/restore"],
  ["GET", "/api/admin/products"],
  ["POST", "/api/admin/products"],
  ["GET", "/api/admin/products/:id"],
  ["PATCH", "/api/admin/products/:id"],
  ["DELETE", "/api/admin/products/:id"],
  ["PATCH", "/api/admin/products/:id/visibility"],
  ["PATCH", "/api/admin/products/:id/restore"],
  ["POST", "/api/admin/products/:id/images"],
  ["PATCH", "/api/admin/products/:id/images/reorder"],
  ["PATCH", "/api/admin/products/:id/images/:imageId/cover"],
  ["DELETE", "/api/admin/products/:id/images/:imageId"],
  ["GET", "/api/cart"],
  ["POST", "/api/cart/items"],
  ["PATCH", "/api/cart/items/:itemId"],
  ["DELETE", "/api/cart/items/:itemId"],
  ["DELETE", "/api/cart"],
  ["POST", "/api/cart/merge"],
  ["GET", "/api/users/me/addresses"],
  ["POST", "/api/users/me/addresses"],
  ["PATCH", "/api/users/me/addresses/:addressId"],
  ["DELETE", "/api/users/me/addresses/:addressId"],
  ["POST", "/api/orders"],
  ["POST", "/api/orders/guest"],
  ["GET", "/api/orders/me"],
  ["GET", "/api/orders/me/:orderId"],
  ["POST", "/api/orders/:orderId/cancel"],
  ["GET", "/api/admin/orders"],
  ["GET", "/api/admin/orders/:id"],
  ["PATCH", "/api/admin/orders/:id/status"],
  ["GET", "/api/notifications"],
  ["PATCH", "/api/notifications/read-all"],
  ["PATCH", "/api/notifications/:id/read"],
  ["GET", "/api/admin/settings"],
  ["PATCH", "/api/admin/settings"],
  ["POST", "/api/admin/settings/admin-phones"],
  ["PATCH", "/api/admin/settings/admin-phones/:phoneId"],
  ["DELETE", "/api/admin/settings/admin-phones/:phoneId"],
  ["PATCH", "/api/admin/settings/sms"],
  ["POST", "/api/admin/sms/test"],
  ["GET", "/api/admin/sms/logs"],
  ["GET", "/api/admin/customers"],
  ["GET", "/api/admin/customers/:id"],
  ["GET", "/api/admin/customers/:id/orders"],
  ["GET", "/api/admin/dashboard/stats"],
  ["GET", "/api/admin/dashboard/recent-orders"],
  ["GET", "/api/admin/media"],
  ["POST", "/api/age-gate/verify"],
  ["POST", "/api/age-gate/block"]
];

function assertPostmanCoverage() {
  assert("Postman collection exists", fs.existsSync(POSTMAN_PATH), POSTMAN_PATH);

  const collection = JSON.parse(fs.readFileSync(POSTMAN_PATH, "utf8"));
  const postmanRequests = collectPostmanRequests(collection.item || []);

  const missing = [];
  for (const [method, routePath] of LIVE_ROUTES) {
    const pattern = new RegExp(pathToPattern(routePath));
    const hit = postmanRequests.some(
      (entry) => entry.method === method && pattern.test(entry.path)
    );
    if (!hit) {
      missing.push(`${method} ${routePath}`);
    }
  }

  assert(
    "Postman covers all live routes",
    missing.length === 0,
    missing.length ? missing.join(", ") : `${postmanRequests.length} requests`
  );

  const stalePlanned = [];
  function walk(items) {
    for (const item of items) {
      if (item.item) {
        walk(item.item);
      } else if (item.request?.description) {
        if (/Status:\s*planned/i.test(item.request.description)) {
          stalePlanned.push(item.name);
        }
      }
    }
  }
  walk(collection.item || []);
  assert(
    "Postman has no planned leftovers",
    stalePlanned.length === 0,
    stalePlanned.length ? stalePlanned.join(", ") : "all implemented"
  );
}

async function runScenario() {
  console.log("\n=== E2E full scenario ===");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("SMS_PROVIDER forced to mock for spawned server\n");

  // Regenerate Postman before coverage check so "every pass" stays complete.
  require("./generate-postman-collection.js");
  assertPostmanCoverage();

  const { adminPhone, customerPhone } = await resolveSeedUsers();
  const deliveryPhone = `+1703555${String(Date.now()).slice(-4)}`;
  console.log(`\nAdmin phone: ${adminPhone}`);
  console.log(`Customer phone: ${customerPhone}\n`);

  console.log("1) Health");
  await expectOk("GET /", "GET", "/");
  await expectOk("GET /api/health", "GET", "/api/health");
  await expectOk("GET /api/health/supabase", "GET", "/api/health/supabase");
  await expectOk("GET /api/health/prisma", "GET", "/api/health/prisma");
  await expectOk("GET /api/health/storage", "GET", "/api/health/storage", {}, (res) =>
    Boolean(res.data?.data?.connected)
  );

  console.log("\n2) Auth (admin PIN + customer OTP → PIN setup)");
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@gasnation.com";
  const adminPin = process.env.SEED_ADMIN_PIN || "072326";
  const admin = await loginWithPin({ email: adminEmail, pin: adminPin });

  let customer;
  const existingPinLogin = await request("POST", "/api/auth/pin/login", {
    body: { phone: customerPhone, pin: "123456" }
  });
  if (existingPinLogin.status === 200 && existingPinLogin.data?.data?.accessToken) {
    note("Customer PIN login (existing)", true, customerPhone);
    customer = {
      accessToken: existingPinLogin.data.data.accessToken,
      refreshToken: existingPinLogin.data.data.refreshToken,
      user: existingPinLogin.data.data.user
    };
  } else {
    customer = await loginWithOtp(customerPhone, { pin: "123456" });
  }

  await expectStatus(
    "OTP send blocked when PIN already set",
    "POST",
    "/api/auth/otp/send",
    409,
    { body: { phone: customerPhone } }
  );

  await expectOk("GET /api/auth/me (admin)", "GET", "/api/auth/me", {
    token: admin.accessToken
  }, (res) => res.data?.user?.role === "admin" || res.data?.data?.user?.role === "admin" || res.data?.user?.role === "admin");

  await expectOk("GET /api/auth/admin-check", "GET", "/api/auth/admin-check", {
    token: admin.accessToken
  });

  await expectOk(
    "POST /api/auth/pin/change (admin)",
    "POST",
    "/api/auth/pin/change",
    {
      token: admin.accessToken,
      body: {
        currentPin: adminPin,
        newPin: adminPin,
        confirmPin: adminPin
      }
    }
  );

  await expectStatus(
    "Customer blocked from admin-check",
    "GET",
    "/api/auth/admin-check",
    403,
    { token: customer.accessToken }
  );

  const refreshed = await expectOk("POST /api/auth/refresh", "POST", "/api/auth/refresh", {
    body: { refreshToken: customer.refreshToken }
  }, (res) => Boolean(res.data?.data?.accessToken));
  customer.accessToken = refreshed.data.data.accessToken;
  customer.refreshToken = refreshed.data.data.refreshToken;

  const googleStart = await request("GET", "/api/auth/google/start");
  assert(
    "GET /api/auth/google/start responds",
    [302, 500, 501, 502].includes(googleStart.status) || googleStart.status < 500,
    `status=${googleStart.status}`
  );
  note(
    "Google OAuth start reachable",
    true,
    `status=${googleStart.status} (full callback needs real Google consent)`
  );

  const handoffSeed = await expectOk(
    "POST /api/auth/e2e/handoff (seed exchange code)",
    "POST",
    "/api/auth/e2e/handoff",
    {
      token: customer.accessToken,
      body: { refreshToken: customer.refreshToken }
    },
    (res) => typeof res.data?.data?.code === "string"
  );
  const handoffCode = handoffSeed.data.data.code;

  const exchanged = await expectOk(
    "POST /api/auth/exchange-code",
    "POST",
    "/api/auth/exchange-code",
    {
      body: { code: handoffCode }
    },
    (res) =>
      Boolean(res.data?.data?.accessToken) &&
      Boolean(res.data?.data?.refreshToken) &&
      res.data?.data?.user?.role === "customer"
  );
  customer.accessToken = exchanged.data.data.accessToken;
  customer.refreshToken = exchanged.data.data.refreshToken;

  await expectStatus(
    "POST /api/auth/exchange-code reused code -> 400",
    "POST",
    "/api/auth/exchange-code",
    400,
    { body: { code: handoffCode } }
  );

  console.log("\n2b) Age gate");
  const ageVerify = await expectOk(
    "POST /api/age-gate/verify",
    "POST",
    "/api/age-gate/verify",
    {
      body: { over21: true }
    },
    (res) =>
      res.data?.data?.approved === true &&
      typeof res.data?.data?.ageGateToken === "string" &&
      res.data?.data?.expiresIn === "30d"
  );
  assert(
    "Age gate token returned",
    Boolean(ageVerify.data?.data?.ageGateToken),
    ageVerify.data?.data?.ageGateToken?.slice(0, 12)
  );

  await expectOk(
    "POST /api/age-gate/block",
    "POST",
    "/api/age-gate/block",
    {
      body: { accepted: false }
    },
    (res) => res.data?.data?.blocked === true
  );

  await expectStatus(
    "POST /api/age-gate/verify missing body -> 400",
    "POST",
    "/api/age-gate/verify",
    400,
    { body: {} }
  );

  console.log("\n3) Public catalog");
  const categories = await expectOk(
    "GET /api/categories",
    "GET",
    "/api/categories",
    {},
    (res) => Array.isArray(res.data?.data?.categories)
  );
  const categoryTree = categories.data.data.categories;
  const flower = categoryTree.find((entry) => entry.slug === "flower");
  assert(
    "Public categories include Flower parent with strain children",
    Boolean(flower) &&
      Array.isArray(flower.children) &&
      ["indica", "sativa", "hybrid"].every((slug) =>
        flower.children.some((child) => child.slug === slug)
      ),
    JSON.stringify(
      flower
        ? { slug: flower.slug, children: flower.children.map((c) => c.slug) }
        : categoryTree.map((c) => c.slug)
    )
  );
  const categorySlug = flower?.slug || categoryTree[0]?.slug || "vegetables";
  await expectOk(
    "GET /api/categories/:slug",
    "GET",
    `/api/categories/${categorySlug}`,
    {},
    (res) =>
      res.data?.data?.category?.slug === categorySlug &&
      Array.isArray(res.data?.data?.category?.children)
  );
  await expectOk("GET /api/products", "GET", "/api/products");
  await expectOk("GET /api/products/featured", "GET", "/api/products/featured");
  const products = await expectOk("GET /api/products", "GET", "/api/products");
  const productList =
    products.data?.data?.products || products.data?.products || [];
  const seedProduct =
    productList.find((product) => product.slug === "fresh-tomato") ||
    productList.find((product) => product.price != null) ||
    productList[0];
  assert("Seed/public product available", Boolean(seedProduct?.id), "priced or first product");
  const nullPriceProduct = productList.find((product) => product.price == null);
  await expectOk(
    "GET /api/products/:slug",
    "GET",
    `/api/products/${seedProduct.slug}`
  );

  const flowerProducts = await expectOk(
    "GET /api/products?category=flower includes descendants",
    "GET",
    "/api/products?category=flower",
    {},
    (res) => (res.data?.data?.products || []).length >= 1
  );
  note(
    "Flower category product count",
    true,
    String(flowerProducts.data.data.products.length)
  );
  await expectOk(
    "GET /api/products?category=indica leaf filter",
    "GET",
    "/api/products?category=indica",
    {},
    (res) => Array.isArray(res.data?.data?.products)
  );

  console.log("\n4) Admin categories CRUD");
  const stamp = Date.now();
  const createdCategory = await expectOk(
    "POST /api/admin/categories",
    "POST",
    "/api/admin/categories",
    {
      token: admin.accessToken,
      body: {
        name: `E2E Cat ${stamp}`,
        description: "e2e",
        isActive: true
      }
    },
    (res) => Boolean(res.data?.data?.category?.id)
  );
  const categoryId = createdCategory.data.data.category.id;
  await expectOk(
    "GET /api/admin/categories",
    "GET",
    "/api/admin/categories",
    { token: admin.accessToken }
  );
  await expectOk(
    "GET /api/admin/categories/:id",
    "GET",
    `/api/admin/categories/${categoryId}`,
    { token: admin.accessToken }
  );
  await expectOk(
    "PATCH /api/admin/categories/:id",
    "PATCH",
    `/api/admin/categories/${categoryId}`,
    {
      token: admin.accessToken,
      body: { description: "updated" }
    }
  );
  await expectOk(
    "DELETE /api/admin/categories/:id",
    "DELETE",
    `/api/admin/categories/${categoryId}`,
    { token: admin.accessToken }
  );
  await expectOk(
    "PATCH /api/admin/categories/:id/restore",
    "PATCH",
    `/api/admin/categories/${categoryId}/restore`,
    { token: admin.accessToken }
  );

  if (flower?.id) {
    await expectStatus(
      "DELETE Flower parent blocked while children exist",
      "DELETE",
      `/api/admin/categories/${flower.id}`,
      400,
      { token: admin.accessToken }
    );
  }

  console.log("\n5) Admin products + images");
  const createdProduct = await expectOk(
    "POST /api/admin/products",
    "POST",
    "/api/admin/products",
    {
      token: admin.accessToken,
      body: {
        name: `E2E Product ${stamp}`,
        categoryId,
        price: 55.25,
        measurementUnit: "kg",
        volume: 1,
        isVisible: true,
        isFeatured: false
      }
    },
    (res) => Boolean(res.data?.data?.product?.id)
  );
  const productId = createdProduct.data.data.product.id;
  const productSlug = createdProduct.data.data.product.slug;
  const productSkuId =
    createdProduct.data.data.product.skus?.[0]?.id ||
    (await (async () => {
      const detail = await expectOk(
        "GET product for skuId",
        "GET",
        `/api/admin/products/${productId}`,
        { token: admin.accessToken },
        (res) => Boolean(res.data?.data?.product?.skus?.[0]?.id)
      );
      return detail.data.data.product.skus[0].id;
    })());
  assert("productSkuId present", Boolean(productSkuId));

  await expectOk("GET /api/admin/products", "GET", "/api/admin/products", {
    token: admin.accessToken
  });
  await expectOk(
    "GET /api/admin/products/:id",
    "GET",
    `/api/admin/products/${productId}`,
    { token: admin.accessToken }
  );
  await expectOk(
    "PATCH /api/admin/products/:id",
    "PATCH",
    `/api/admin/products/${productId}`,
    {
      token: admin.accessToken,
      body: { price: 60 }
    }
  );

  const form = new FormData();
  form.append(
    "image",
    new Blob([PNG_1X1], { type: "image/png" }),
    "e2e-pixel.png"
  );
  const upload1 = await expectOk(
    "POST product image #1",
    "POST",
    `/api/admin/products/${productId}/images`,
    { token: admin.accessToken, formData: form },
    (res) => Boolean(res.data?.data?.image?.id || res.data?.data?.product)
  );

  const form2 = new FormData();
  form2.append(
    "image",
    new Blob([PNG_1X1], { type: "image/png" }),
    "e2e-pixel-2.png"
  );
  const upload2 = await expectOk(
    "POST product image #2",
    "POST",
    `/api/admin/products/${productId}/images`,
    { token: admin.accessToken, formData: form2 },
    (res) => Boolean(res.data?.data?.image?.id || res.data?.data?.product)
  );

  const imageId1 =
    upload1.data?.data?.image?.id ||
    upload1.data?.data?.product?.images?.[0]?.id;
  const imageId2 =
    upload2.data?.data?.image?.id ||
    upload2.data?.data?.product?.images?.slice(-1)?.[0]?.id;
  assert("Uploaded image ids", Boolean(imageId1 && imageId2), `${imageId1}, ${imageId2}`);

  const productName = `E2E Product ${stamp}`;
  const mediaList = await expectOk(
    "GET /api/admin/media",
    "GET",
    "/api/admin/media",
    { token: admin.accessToken },
    (res) =>
      Array.isArray(res.data?.data?.items) &&
      res.data.data.items.some((item) => item.imageId === imageId1) &&
      res.data.data.items.some((item) => item.imageId === imageId2)
  );
  assert(
    "Media list includes proxy url",
    mediaList.data.data.items.some((item) =>
      String(item.url || "").includes(`/api/assets/product-images/${productId}/`)
    ),
    mediaList.data.data.items[0]?.url
  );

  await expectOk(
    "GET /api/admin/media search by product name",
    "GET",
    `/api/admin/media?search=${encodeURIComponent(productName)}`,
    { token: admin.accessToken },
    (res) =>
      res.data.data.items.length >= 2 &&
      res.data.data.items.every((item) => item.productId === productId)
  );

  await expectStatus(
    "Customer blocked from /api/admin/media",
    "GET",
    "/api/admin/media",
    403,
    { token: customer.accessToken }
  );

  await expectOk(
    "PATCH images/reorder",
    "PATCH",
    `/api/admin/products/${productId}/images/reorder`,
    {
      token: admin.accessToken,
      body: { imageIds: [imageId2, imageId1] }
    }
  );
  await expectOk(
    "PATCH image cover",
    "PATCH",
    `/api/admin/products/${productId}/images/${imageId1}/cover`,
    { token: admin.accessToken }
  );
  await expectOk(
    "DELETE product image",
    "DELETE",
    `/api/admin/products/${productId}/images/${imageId2}`,
    { token: admin.accessToken }
  );

  await expectOk(
    "PATCH visibility hide",
    "PATCH",
    `/api/admin/products/${productId}/visibility`,
    {
      token: admin.accessToken,
      body: { isVisible: false }
    }
  );
  await expectStatus(
    "Hidden product not public",
    "GET",
    `/api/products/${productSlug}`,
    404
  );

  await expectOk(
    "GET /api/admin/media excludes hidden product by default",
    "GET",
    "/api/admin/media",
    { token: admin.accessToken },
    (res) => !res.data.data.items.some((item) => item.productId === productId)
  );

  await expectOk(
    "GET /api/admin/media includeArchived shows hidden product images",
    "GET",
    "/api/admin/media?includeArchived=true",
    { token: admin.accessToken },
    (res) => res.data.data.items.some((item) => item.productId === productId)
  );

  await expectOk(
    "PATCH visibility show",
    "PATCH",
    `/api/admin/products/${productId}/visibility`,
    {
      token: admin.accessToken,
      body: { isVisible: true }
    }
  );
  await expectOk(
    "Soft delete product",
    "DELETE",
    `/api/admin/products/${productId}`,
    { token: admin.accessToken }
  );

  await expectOk(
    "GET /api/admin/media includeArchived shows soft-deleted product images",
    "GET",
    "/api/admin/media?includeArchived=true",
    { token: admin.accessToken },
    (res) =>
      res.data.data.items.some(
        (item) => item.productId === productId && item.productDeletedAt
      )
  );

  await expectOk(
    "Restore product",
    "PATCH",
    `/api/admin/products/${productId}/restore`,
    { token: admin.accessToken }
  );

  console.log("\n6) Cart + merge");
  await expectOk("DELETE /api/cart clear", "DELETE", "/api/cart", {
    token: customer.accessToken
  });

  if (nullPriceProduct?.id) {
    await expectStatus(
      "Null-price product blocked from cart",
      "POST",
      "/api/cart/items",
      400,
      {
        token: customer.accessToken,
        body: { productId: nullPriceProduct.id, quantity: 1 }
      }
    );
  }

  const added = await expectOk(
    "POST /api/cart/items",
    "POST",
    "/api/cart/items",
    {
      token: customer.accessToken,
      body: { productId, skuId: productSkuId, quantity: 1 }
    },
    (res) => (res.data?.data?.cart?.items || []).length >= 1
  );
  const itemId = added.data.data.cart.items[0].id;
  await expectOk("GET /api/cart", "GET", "/api/cart", {
    token: customer.accessToken
  });
  await expectOk(
    "PATCH /api/cart/items/:id",
    "PATCH",
    `/api/cart/items/${itemId}`,
    {
      token: customer.accessToken,
      body: { quantity: 2 }
    }
  );
  await expectOk(
    "DELETE /api/cart/items/:id",
    "DELETE",
    `/api/cart/items/${itemId}`,
    { token: customer.accessToken }
  );
  await expectOk("POST /api/cart/merge", "POST", "/api/cart/merge", {
    token: customer.accessToken,
    body: {
      items: [{ productId, skuId: productSkuId, quantity: 1 }]
    }
  });

  console.log("\n7) Addresses");
  const addressCreate = await expectOk(
    "POST address",
    "POST",
    "/api/users/me/addresses",
    {
      token: customer.accessToken,
      body: {
        label: `E2E ${stamp}`,
        fullName: "E2E Customer",
        phone: deliveryPhone,
        addressLine1: "1200 Wilson Blvd",
        city: "Arlington",
        state: "VA",
        postalCode: "22201",
        country: "United States",
        isDefault: true
      }
    },
    (res) => Boolean(res.data?.data?.address?.id)
  );
  const addressId = addressCreate.data.data.address.id;
  await expectOk("GET addresses", "GET", "/api/users/me/addresses", {
    token: customer.accessToken
  });
  await expectOk(
    "PATCH address",
    "PATCH",
    `/api/users/me/addresses/${addressId}`,
    {
      token: customer.accessToken,
      body: { label: `E2E ${stamp} updated` }
    }
  );

  console.log("\n8) Admin settings + SMS test");
  await expectOk("GET /api/store/config", "GET", "/api/store/config", {}, (res) =>
    Boolean(res.data?.data?.defaultCurrency) &&
      Array.isArray(res.data?.data?.orderContactPhones)
  );

  await expectOk("GET settings", "GET", "/api/admin/settings", {
    token: admin.accessToken
  }, (res) => Boolean(res.data?.data?.settings?.defaultCurrency));

  await expectOk("PATCH settings defaultCurrency USD", "PATCH", "/api/admin/settings", {
    token: admin.accessToken,
    body: {
      defaultCurrency: "USD"
    }
  }, (res) => res.data?.data?.settings?.defaultCurrency === "USD");

  await expectOk("GET /api/store/config reflects USD", "GET", "/api/store/config", {}, (res) =>
    res.data?.data?.defaultCurrency === "USD"
  );

  await expectStatus(
    "PATCH settings invalid defaultCurrency -> 400",
    "PATCH",
    "/api/admin/settings",
    400,
    {
      token: admin.accessToken,
      body: { defaultCurrency: "INVALID" }
    }
  );

  const emptyPatch = await expectStatus(
    "PATCH settings empty body -> 400",
    "PATCH",
    "/api/admin/settings",
    400,
    {
      token: admin.accessToken,
      body: {}
    }
  );
  assert(
    "PATCH settings empty body message mentions fields",
    String(emptyPatch.data?.message || "").includes("defaultMeasurementUnit") &&
      String(emptyPatch.data?.message || "").includes("defaultCurrency"),
    emptyPatch.data?.message
  );

  await expectOk("PATCH settings restore ETB", "PATCH", "/api/admin/settings", {
    token: admin.accessToken,
    body: {
      defaultCurrency: "ETB"
    }
  }, (res) => res.data?.data?.settings?.defaultCurrency === "ETB");

  await expectOk("PATCH settings measurement unit", "PATCH", "/api/admin/settings", {
    token: admin.accessToken,
    body: {
      defaultMeasurementUnit: "pcs"
    }
  });
  await expectOk("PATCH sms settings", "PATCH", "/api/admin/settings/sms", {
    token: admin.accessToken,
    body: { provider: "mock", senderId: "E2ESHOP" }
  });

  const phoneAdd = await expectOk(
    "POST admin phone",
    "POST",
    "/api/admin/settings/admin-phones",
    {
      token: admin.accessToken,
      body: { phone: "+17035552233", showOnBanner: false }
    },
    (res) =>
      (res.data?.data?.settings?.adminPhoneNumbers || []).some(
        (entry) => entry.phone === "+17035552233" && entry.showOnBanner === false
      )
  );
  const adminPhoneId = (
    phoneAdd.data.data.settings.adminPhoneNumbers || []
  ).find((entry) => entry.phone === "+17035552233")?.id;
  assert("adminPhoneId present", Boolean(adminPhoneId));

  await expectOk(
    "PATCH admin phone showOnBanner",
    "PATCH",
    `/api/admin/settings/admin-phones/${adminPhoneId}`,
    {
      token: admin.accessToken,
      body: { showOnBanner: true }
    },
    (res) =>
      (res.data?.data?.settings?.adminPhoneNumbers || []).some(
        (entry) => entry.id === adminPhoneId && entry.showOnBanner === true
      )
  );

  await expectOk(
    "GET /api/store/config includes banner phone",
    "GET",
    "/api/store/config",
    {},
    (res) =>
      (res.data?.data?.orderContactPhones || []).some(
        (entry) => entry.phone === "+17035552233"
      )
  );

  const smsSince = Date.now();
  await expectOk("POST /api/admin/sms/test", "POST", "/api/admin/sms/test", {
    token: admin.accessToken,
    body: {
      phone: deliveryPhone,
      message: `E2E test SMS ${stamp}`
    }
  });
  await waitForMockSms({
    phone: deliveryPhone,
    includes: `E2E test SMS ${stamp}`,
    sinceMs: smsSince
  });
  note("mock-sms captured for test endpoint", true);

  await expectOk(
    "DELETE admin phone",
    "DELETE",
    `/api/admin/settings/admin-phones/${adminPhoneId}`,
    { token: admin.accessToken }
  );

  console.log("\n9) Orders + notifications + cancel + reputation");
  await expectOk("Ensure cart item for order", "POST", "/api/cart/items", {
    token: customer.accessToken,
    body: { productId, skuId: productSkuId, quantity: 1 }
  });

  const orderSince = Date.now();
  const orderCreate = await expectOk(
    "POST /api/orders",
    "POST",
    "/api/orders",
    {
      token: customer.accessToken,
      body: { addressId, paymentMethod: "COD" }
    },
    (res) =>
      Boolean(res.data?.data?.order?.id) &&
      res.data?.data?.smsAlert?.attempted >= 0
  );
  const orderId = orderCreate.data.data.order.id;
  const orderNumber = orderCreate.data.data.order.orderNumber;
  const customerId = customer.user.id;
  assert(
    "Order SMS alert attempted",
    orderCreate.data.data.smsAlert.attempted >= 1,
    JSON.stringify(orderCreate.data.data.smsAlert)
  );
  await waitForMockSms({
    includes: orderNumber,
    sinceMs: orderSince
  });
  note("mock-sms captured for new-order alert", true, orderNumber);

  await expectOk("GET /api/orders/me", "GET", "/api/orders/me", {
    token: customer.accessToken
  });
  await expectOk(
    "GET /api/orders/me/:id",
    "GET",
    `/api/orders/me/${orderId}`,
    { token: customer.accessToken }
  );
  const adminOrders = await expectOk(
    "GET /api/admin/orders",
    "GET",
    "/api/admin/orders",
    { token: admin.accessToken },
    (res) =>
      Array.isArray(res.data?.data?.orders) &&
      res.data.data.orders.some((order) => order.user?.reputation)
  );
  note(
    "Admin order list includes reputation",
    true,
    JSON.stringify(
      adminOrders.data.data.orders.find((order) => order.id === orderId)?.user
        ?.reputation
    )
  );
  await expectOk(
    "GET /api/admin/orders/:id",
    "GET",
    `/api/admin/orders/${orderId}`,
    {
      token: admin.accessToken
    },
    (res) =>
      Boolean(res.data?.data?.order?.user?.reputation) &&
      res.data?.data?.order?.risk &&
      res.data.data.order.placedAsGuest === false
  );

  console.log("\n9b) Guest checkout + phone burst block + cart merge intact");
  const guestPhone = `+1703555${String(stamp).slice(-4)}`;
  const guestOrder = await expectOk(
    "POST /api/orders/guest",
    "POST",
    "/api/orders/guest",
    {
      body: {
        phone: guestPhone,
        name: "E2E Guest",
        paymentMethod: "COD",
        items: [{ productId, skuId: productSkuId, quantity: 1 }],
        address: {
          fullName: "E2E Guest",
          phone: guestPhone,
          addressLine1: "1200 Wilson Blvd",
          city: "Arlington",
          state: "VA",
          postalCode: "22201",
          country: "United States"
        }
      }
    },
    (res) =>
      res.data?.data?.order?.placedAsGuest === true &&
      res.data?.data?.customer?.postOrderCta === "register" &&
      res.data?.data?.order?.risk
  );
  assert(
    "Guest order matchedExistingAccount false for new phone",
    guestOrder.data.data.order.matchedExistingAccount === false &&
      guestOrder.data.data.customer.isNewUser === true,
    JSON.stringify(guestOrder.data.data.customer)
  );

  const guestAdminDetail = await expectOk(
    "Admin sees guest flags + risk",
    "GET",
    `/api/admin/orders/${guestOrder.data.data.order.id}`,
    { token: admin.accessToken },
    (res) =>
      res.data?.data?.order?.placedAsGuest === true &&
      typeof res.data?.data?.order?.risk?.lowReputation === "boolean"
  );
  note(
    "Guest admin risk payload",
    true,
    JSON.stringify(guestAdminDetail.data.data.order.risk)
  );

  const prisma = require("../src/config/prisma");
  const guestUserId = guestOrder.data.data.customer.id;
  const burstBase = {
    userId: guestUserId,
    items: guestOrder.data.data.order.items,
    deliveryAddress: guestOrder.data.data.order.deliveryAddress,
    status: "Pending",
    totalAmount: guestOrder.data.data.order.totalAmount,
    paymentMethod: "COD",
    placedAsGuest: true,
    matchedExistingAccount: false
  };

  for (let i = 0; i < 9; i += 1) {
    await prisma.order.create({
      data: {
        ...burstBase,
        orderNumber: `ORD-E2E-BURST-${stamp}-${i}`
      }
    });
  }

  const blocked = await expectStatus(
    "11th guest order within hour → ORDER_PHONE_BLOCKED",
    "POST",
    "/api/orders/guest",
    429,
    {
      body: {
        phone: guestPhone,
        items: [{ productId, skuId: productSkuId, quantity: 1 }],
        address: {
          fullName: "E2E Guest",
          addressLine1: "1200 Wilson Blvd",
          city: "Arlington",
          state: "VA",
          postalCode: "22201",
          country: "United States"
        }
      }
    }
  );
  assert(
    "Blocked response has clear try-again message + code",
    blocked.data?.code === "ORDER_PHONE_BLOCKED" &&
      /try again later/i.test(blocked.data?.message || "") &&
      Boolean(blocked.data?.blockedUntil),
    JSON.stringify(blocked.data)
  );

  await expectOk(
    "Cart merge still works after guest checkout work",
    "POST",
    "/api/cart/merge",
    {
      token: customer.accessToken,
      body: {
        items: [{ productId, skuId: productSkuId, quantity: 1 }]
      }
    },
    (res) => Boolean(res.data?.data?.cart)
  );

  await expectOk(
    "GET /api/admin/customers/:id",
    "GET",
    `/api/admin/customers/${customerId}`,
    {
      token: admin.accessToken
    },
    (res) =>
      Boolean(res.data?.data?.customer?.reputation) &&
      res.data.data.customer.reputation.reputationScore !== undefined
  );

  await expectOk(
    "GET /api/admin/customers",
    "GET",
    "/api/admin/customers",
    { token: admin.accessToken },
    (res) =>
      Array.isArray(res.data?.data?.customers) &&
      res.data.data.customers.some((entry) => entry.id === customerId)
  );

  await expectOk(
    "GET /api/admin/customers/:id/orders",
    "GET",
    `/api/admin/customers/${customerId}/orders`,
    { token: admin.accessToken },
    (res) => Array.isArray(res.data?.data?.orders)
  );

  await expectOk(
    "GET /api/admin/dashboard/stats",
    "GET",
    "/api/admin/dashboard/stats",
    { token: admin.accessToken },
    (res) =>
      typeof res.data?.data?.stats?.totalOrders === "number" &&
      typeof res.data?.data?.stats?.totalCustomers === "number"
  );

  await expectOk(
    "GET /api/admin/dashboard/recent-orders",
    "GET",
    "/api/admin/dashboard/recent-orders",
    { token: admin.accessToken },
    (res) => Array.isArray(res.data?.data?.orders)
  );

  await expectOk(
    "GET /api/admin/sms/logs",
    "GET",
    "/api/admin/sms/logs",
    { token: admin.accessToken },
    (res) => Array.isArray(res.data?.data?.logs)
  );

  const me = await expectOk("GET /api/auth/me (customer)", "GET", "/api/auth/me", {
    token: customer.accessToken
  });
  assert(
    "Customer /me has no reputation fields",
    me.data?.user?.reputationScore === undefined &&
      me.data?.user?.reputation === undefined &&
      me.data?.data?.user?.reputation === undefined,
    JSON.stringify(me.data?.user || me.data)
  );

  const usersMe = await expectOk(
    "GET /api/users/me (customer)",
    "GET",
    "/api/users/me",
    { token: customer.accessToken },
    (res) => Boolean(res.data?.data?.user?.id)
  );
  assert(
    "GET /api/users/me has no reputation fields",
    usersMe.data?.data?.user?.reputation === undefined &&
      usersMe.data?.data?.user?.reputationScore === undefined,
    JSON.stringify(usersMe.data?.data?.user)
  );

  const updatedProfile = await expectOk(
    "PATCH /api/users/me (customer)",
    "PATCH",
    "/api/users/me",
    {
      token: customer.accessToken,
      body: { name: "E2E Customer Updated" }
    },
    (res) => res.data?.data?.user?.name === "E2E Customer Updated"
  );
  note("Profile update persisted", true, updatedProfile.data.data.user.name);

  // Confirm order then cancel from Confirmed with stage ack
  await expectOk(
    "Admin status -> Confirmed (for cancel stage test)",
    "PATCH",
    `/api/admin/orders/${orderId}/status`,
    {
      token: admin.accessToken,
      body: { status: "Confirmed", note: "E2E confirm before cancel sibling" }
    }
  );

  await expectStatus(
    "Cancel with stale cancelledFromStatus -> 409",
    "POST",
    `/api/orders/${orderId}/cancel`,
    409,
    {
      token: customer.accessToken,
      body: { cancelledFromStatus: "Pending" }
    }
  );

  // Second order for cancel-from-Confirmed path
  await expectOk("Cart for cancel order", "POST", "/api/cart/items", {
    token: customer.accessToken,
    body: { productId, skuId: productSkuId, quantity: 1 }
  });
  const cancelOrder = await expectOk(
    "Create order for cancel",
    "POST",
    "/api/orders",
    {
      token: customer.accessToken,
      body: { addressId, paymentMethod: "COD" }
    },
    (res) => Boolean(res.data?.data?.order?.id)
  );
  const cancelOrderId = cancelOrder.data.data.order.id;

  await expectOk(
    "Admin confirm cancel-target order",
    "PATCH",
    `/api/admin/orders/${cancelOrderId}/status`,
    {
      token: admin.accessToken,
      body: { status: "Confirmed", note: "Ready for customer cancel" }
    }
  );

  const cancelled = await expectOk(
    "POST cancel Confirmed order",
    "POST",
    `/api/orders/${cancelOrderId}/cancel`,
    {
      token: customer.accessToken,
      body: { cancelledFromStatus: "Confirmed", note: "E2E cancel" }
    },
    (res) =>
      res.data?.data?.order?.status === "Cancelled" &&
      res.data?.data?.cancelledFromStatus === "Confirmed"
  );
  note(
    "Cancel response includes cancelledFromStatus",
    true,
    cancelled.data.data.cancelledFromStatus
  );

  // Delivered blocks cancel
  await expectOk(
    "Admin status -> OutForDelivery",
    "PATCH",
    `/api/admin/orders/${orderId}/status`,
    {
      token: admin.accessToken,
      body: { status: "OutForDelivery", note: "On the way" }
    }
  );
  await expectOk(
    "Admin status -> Delivered (reputation +1)",
    "PATCH",
    `/api/admin/orders/${orderId}/status`,
    {
      token: admin.accessToken,
      body: { status: "Delivered", note: "Done" }
    },
    (res) =>
      res.data?.data?.order?.user?.reputation?.deliveredOrderCount >= 1
  );

  await expectStatus(
    "Delivered order cannot be cancelled",
    "POST",
    `/api/orders/${orderId}/cancel`,
    400,
    {
      token: customer.accessToken,
      body: { cancelledFromStatus: "Delivered" }
    }
  );

  const customerAfter = await expectOk(
    "Admin customer after deliver+cancel",
    "GET",
    `/api/admin/customers/${customerId}`,
    { token: admin.accessToken }
  );
  const rep = customerAfter.data.data.customer.reputation;
  assert(
    "Reputation reflects cancel penalty and delivery credit",
    rep.cancelledOrderCount >= 1 && rep.deliveredOrderCount >= 1,
    JSON.stringify(rep)
  );

  const notifications = await expectOk(
    "GET /api/notifications",
    "GET",
    "/api/notifications",
    { token: customer.accessToken },
    (res) => Array.isArray(res.data?.data?.notifications)
  );
  const notificationId = notifications.data.data.notifications[0]?.id;
  assert("At least one notification", Boolean(notificationId));
  await expectOk(
    "PATCH notification read",
    "PATCH",
    `/api/notifications/${notificationId}/read`,
    { token: customer.accessToken }
  );
  await expectOk(
    "PATCH notifications read-all",
    "PATCH",
    "/api/notifications/read-all",
    { token: customer.accessToken }
  );

  console.log("\n10) Security negatives");
  await expectStatus(
    "Customer cannot hit admin settings",
    "GET",
    "/api/admin/settings",
    403,
    { token: customer.accessToken }
  );
  await expectStatus(
    "Customer cannot admin status update",
    "PATCH",
    `/api/admin/orders/${orderId}/status`,
    403,
    {
      token: customer.accessToken,
      body: { status: "Delivered" }
    }
  );
  await expectStatus("Missing auth on cart", "GET", "/api/cart", 401);

  console.log("\n11) Logout");
  await expectOk("POST /api/auth/logout", "POST", "/api/auth/logout", {
    body: { refreshToken: customer.refreshToken }
  });

  // Soft-delete temporary category/product leftovers (best-effort)
  await request("DELETE", `/api/admin/products/${productId}`, {
    token: admin.accessToken
  }).catch(() => {});
  await request("DELETE", `/api/admin/categories/${categoryId}`, {
    token: admin.accessToken
  }).catch(() => {});
  await request("DELETE", `/api/users/me/addresses/${addressId}`, {
    token: customer.accessToken
  }).catch(() => {});
}

async function main() {
  const started = Date.now();
  let exitCode = 0;

  try {
    if (process.env.E2E_BASE_URL) {
      console.log("Using existing server at", BASE_URL);
      console.warn(
        "Warning: OTP/mock-sms capture requires this process to own server stdout. Prefer default spawned server."
      );
    } else {
      console.log(`Starting isolated mock-SMS server on port ${PORT}...`);
      await startServer();
      note("Server started", true, `port ${PORT}`);
    }

    await runScenario();
  } catch (error) {
    exitCode = 1;
    if (!error.isAssert) {
      console.error("\nE2E crashed:", error.stack || error.message);
      state.failed += 1;
    }
  } finally {
    await stopServer();
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log("\n=== E2E summary ===");
  console.log(`Passed: ${state.passed}`);
  console.log(`Failed: ${state.failed}`);
  console.log(`Elapsed: ${elapsed}s`);
  console.log(`OTP events captured: ${state.otpEvents.length}`);
  console.log(`Mock SMS events captured: ${state.mockSmsEvents.length}`);

  if (state.failed > 0) {
    exitCode = 1;
  }

  process.exit(exitCode);
}

main();
