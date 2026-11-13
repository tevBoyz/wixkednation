/**
 * Generates a complete Postman collection covering every mounted API route.
 * Run: node scripts/generate-postman-collection.js
 */
const fs = require("fs");
const path = require("path");

const OUT =
  process.env.POSTMAN_OUT ||
  path.join(__dirname, "..", "..", "baseDocs", "backend-postman-collection.json");

function req(name, method, rawPath, { auth, body, description, formdata } = {}) {
  const pathParts = rawPath
    .replace(/^\//, "")
    .split("/")
    .filter((part) => part.length > 0);

  const headers = [];

  if (auth === "admin" || auth === "customer" || auth === "bearer") {
    headers.push({
      key: "Authorization",
      value: "Bearer {{accessToken}}"
    });
  }

  if (body && !formdata) {
    headers.push({
      key: "Content-Type",
      value: "application/json"
    });
  }

  const request = {
    method,
    header: headers,
    description:
      description ||
      `Status: implemented\nAuth: ${auth || "none"}`,
    url: {
      raw: `{{baseUrl}}${rawPath.startsWith("/") ? rawPath : `/${rawPath}`}`,
      host: ["{{baseUrl}}"],
      path: pathParts
    }
  };

  if (body && !formdata) {
    request.body = {
      mode: "raw",
      raw: typeof body === "string" ? body : JSON.stringify(body, null, 2),
      options: {
        raw: {
          language: "json"
        }
      }
    };
  }

  if (formdata) {
    request.body = {
      mode: "formdata",
      formdata
    };
  }

  return {
    name,
    request
  };
}

const collection = {
  info: {
    _postman_id: "d33fcdf0-2d96-4fd1-a3c0-b8f221e36a61",
    name: "Backend API (Complete)",
    description:
      "Complete Postman collection for the Express ecommerce backend. All listed endpoints are implemented. Use mock SMS (SMS_PROVIDER=mock) locally; OTP appears in the server console as [otp-dev] phone=... otp=...... Also run: npm run test:e2e",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5000" },
    { key: "accessToken", value: "" },
    { key: "refreshToken", value: "" },
    { key: "adminPhone", value: "+251911676343" },
    { key: "customerPhone", value: "+251911000000" },
    { key: "otpCode", value: "" },
    { key: "categoryId", value: "" },
    { key: "categorySlug", value: "vegetables" },
    { key: "productId", value: "" },
    { key: "skuId", value: "" },
    { key: "productSlug", value: "fresh-tomato" },
    { key: "imageId", value: "" },
    { key: "itemId", value: "" },
    { key: "addressId", value: "" },
    { key: "orderId", value: "" },
    { key: "notificationId", value: "" },
    { key: "adminPhoneId", value: "" },
    { key: "customerId", value: "" },
    { key: "authHandoffCode", value: "" },
    { key: "ageGateToken", value: "" },
    { key: "setupToken", value: "" },
    { key: "adminEmail", value: "admin@wixkednation.com" },
    { key: "adminPin", value: "072326" },
    { key: "superadminEmail", value: "superadmin1@wixkednation.com" },
    { key: "superadminPin", value: "199183" },
    { key: "teamUserId", value: "" }
  ],
  item: [
    {
      name: "Health",
      item: [
        req("Root status", "GET", "/"),
        req("Health overview", "GET", "/api/health"),
        req("Health supabase", "GET", "/api/health/supabase"),
        req("Health prisma", "GET", "/api/health/prisma"),
        req("Health storage", "GET", "/api/health/storage", {
          description:
            "Status: implemented\nAuth: none\nChecks Supabase Storage bucket connectivity."
        })
      ]
    },
    {
      name: "Users",
      item: [
        req("Get profile", "GET", "/api/users/me", {
          auth: "bearer",
          description:
            "Status: implemented\nAuth: Bearer JWT\nPreferred profile endpoint.\nResponse: { success, message, data: { user } }.\nNo reputation fields (reputation is admin-only)."
        }),
        req("Update profile", "PATCH", "/api/users/me", {
          auth: "bearer",
          body: { name: "Updated Name", email: "customer@example.com" },
          description:
            "Status: implemented\nAuth: Bearer JWT\nOnly name and email are updatable."
        })
      ]
    },
    {
      name: "Auth",
      item: [
        req("Auth config", "GET", "/api/auth/config", {
          description:
            "Status: implemented\nAuth: none\nReturns data: { googleEnabled, emailOtpEnabled, smsOtpEnabled }."
        }),
        req("Send OTP", "POST", "/api/auth/otp/send", {
          body: { email: "customer@example.com", purpose: "register" },
          description:
            "Status: implemented\nAuth: none\nBody: { email, purpose? } for email OTP; { phone, email, purpose? } for SMS register (Twilio); { phone, purpose: forgot_pin } when SMS enabled.\nPhone OTP rejected when SMS provider is mock.\nMock: [otp-dev] email=... otp=..."
        }),
        req("Verify OTP", "POST", "/api/auth/otp/verify", {
          body: {
            email: "customer@example.com",
            otp: "{{otpCode}}",
            purpose: "register"
          },
          description:
            "Status: implemented\nAuth: none\nBody: { email|phone, otp, purpose? }. Phone register may include email.\nIf PIN missing or purpose=forgot_pin → setupToken; else access+refresh tokens."
        }),
        req("Set PIN", "POST", "/api/auth/pin/set", {
          auth: "bearer",
          body: { pin: "123456", confirmPin: "123456" },
          description:
            "Status: implemented\nAuth: Bearer setupToken (purpose pin-setup), NOT full access token.\nBody: { pin, confirmPin } — 4–6 digits.\nReturns full accessToken + refreshToken + user."
        }),
        req("PIN login", "POST", "/api/auth/pin/login", {
          body: { email: "{{adminEmail}}", pin: "{{adminPin}}" },
          description:
            "Status: implemented\nAuth: none\nBody: { pin, phone? } OR { pin, email? } (exactly one identifier).\nOps admin seed: admin@wixkednation.com / 072326.\nSuperadmin seed: superadmin1@wixkednation.com / 199183.\nNo OTP required."
        }),
        req("PIN login (superadmin)", "POST", "/api/auth/pin/login", {
          body: { email: "{{superadminEmail}}", pin: "{{superadminPin}}" },
          description:
            "Status: implemented\nAuth: none\nLogin as seeded superadmin for /api/admin/team."
        }),
        req("Change PIN", "POST", "/api/auth/pin/change", {
          auth: "bearer",
          body: {
            currentPin: "{{adminPin}}",
            newPin: "072326",
            confirmPin: "072326"
          },
          description:
            "Status: implemented\nAuth: Bearer access JWT\nBody: { currentPin, newPin, confirmPin }"
        }),
        req("Refresh token", "POST", "/api/auth/refresh", {
          body: { refreshToken: "{{refreshToken}}" }
        }),
        req("Logout", "POST", "/api/auth/logout", {
          body: { refreshToken: "{{refreshToken}}" },
          description:
            "Status: implemented\nAuth: none (refreshToken body only)"
        }),
        req("Google start", "GET", "/api/auth/google/start", {
          description:
            "Status: implemented\nAuth: none\nBrowser redirect flow. Expect 302 when Google OAuth is configured.\nAfter Google consent, backend callback redirects to FRONTEND_URL/auth/google/callback?code=<one-time-handoff-code> (tokens are NOT in the URL)."
        }),
        req("Google callback", "GET", "/api/auth/google/callback", {
          description:
            "Status: implemented\nAuth: none\nGoogle OAuth provider callback (backend URL). Not for manual Postman use.\nOn success redirects to frontend /auth/google/callback?code=<handoff>."
        }),
        req("Exchange auth handoff code", "POST", "/api/auth/exchange-code", {
          body: { code: "{{authHandoffCode}}" },
          description:
            "Status: implemented\nAuth: none\nExchange one-time Google handoff code.\nIf user has no PIN → requiresPinSetup + setupToken.\nIf PIN set → accessToken + refreshToken.\nCode single-use, TTL 60s."
        }),
        req("Get me", "GET", "/api/auth/me", {
          auth: "bearer",
          description:
            "Status: implemented\nAuth: Bearer JWT\nLegacy response shape: { success, message, user } (user is top-level, not data.user).\nNo reputation fields."
        }),
        req("Admin check", "GET", "/api/auth/admin-check", {
          auth: "admin",
          description:
            "Status: implemented\nAuth: staff Bearer JWT (role admin or superadmin)"
        })
      ]
    },
    {
      name: "Admin Team",
      item: [
        req("List team", "GET", "/api/admin/team", {
          auth: "admin",
          description:
            "Status: implemented\nAuth: superadmin Bearer JWT only.\nLists admin + superadmin users (includes soft-disabled with isDisabled)."
        }),
        req("Create admin", "POST", "/api/admin/team", {
          auth: "admin",
          body: {
            email: "newadmin@example.com",
            pin: "654321",
            name: "Ops Admin"
          },
          description:
            "Status: implemented\nAuth: superadmin Bearer JWT only.\nBody: { email, pin, name? }. Creates role=admin.\nResponse data: { user, credentials: { email, pin } } — PIN returned once."
        }),
        req("Patch team member", "PATCH", "/api/admin/team/{{teamUserId}}", {
          auth: "admin",
          body: { restore: true },
          description:
            "Status: implemented\nAuth: superadmin Bearer JWT only.\nBody: { role?: \"admin\"|\"customer\", restore?: true }.\nCannot act on self; cannot promote to superadmin."
        }),
        req("Disable team member", "DELETE", "/api/admin/team/{{teamUserId}}", {
          auth: "admin",
          description:
            "Status: implemented\nAuth: superadmin Bearer JWT only.\nSoft-deletes (deletedAt). Blocks login. Cannot disable last active superadmin or self."
        })
      ]
    },
    {
      name: "Age Gate",
      item: [
        req("Verify age gate", "POST", "/api/age-gate/verify", {
          body: { accepted: true },
          description:
            "Status: implemented\nAuth: none\nBody: { accepted: true } or { over21: true }.\nResponse: { success, message, data: { approved, ageGateToken, expiresIn: \"30d\" } }.\nFrontend stores ageGateToken client-side. Backend does not enforce on catalog routes yet."
        }),
        req("Block age gate", "POST", "/api/age-gate/block", {
          body: { accepted: false },
          description:
            "Status: implemented\nAuth: none\nBody: { accepted: false } or { over21: false }.\nResponse: { success, message, data: { blocked: true } }.\nFrontend should redirect to /blocked after calling this."
        })
      ]
    },
    {
      name: "Analytics",
      item: [
        req("Collect pageview", "POST", "/api/analytics/collect", {
          body: {
            visitorId: "11111111-1111-4111-8111-111111111111",
            sessionId: "22222222-2222-4222-8222-222222222222",
            path: "/",
            referrer: "https://google.com/",
            landingPath: "/",
            utmSource: "google",
            utmMedium: "organic"
          },
          description:
            "Status: implemented\nAuth: none\nFirst-party pageview. Body: visitorId + sessionId (UUIDs), path required.\nRejects /admin paths. Hashes IP; geo via geoip-lite. Bots return 204."
        }),
        req("Admin analytics summary", "GET", "/api/admin/analytics", {
          auth: "admin",
          description:
            "Status: implemented\nAuth: staff Bearer JWT\nQuery: from, to (ISO or YYYY-MM-DD; default last 7 days, max 90).\nReturns totals, daily series, topPaths, topCountries, topSources."
        })
      ]
    },
    {
      name: "Blog",
      item: [
        req("List public blog posts", "GET", "/api/blog", {
          description:
            "Status: implemented\nAuth: none\nQuery: page, limit, showOnHomepage=true (optional).\nReturns published posts only: { posts, pagination }."
        }),
        req("Get public blog post", "GET", "/api/blog/{{blogSlug}}", {
          description:
            "Status: implemented\nAuth: none\nPublished post by slug; 404 if draft/missing."
        }),
        req("Admin list blog posts", "GET", "/api/admin/blog", {
          auth: "admin",
          description:
            "Status: implemented\nAuth: staff Bearer JWT\nQuery: status, includeDeleted."
        }),
        req("Admin create blog post", "POST", "/api/admin/blog", {
          auth: "admin",
          body: {
            title: "Weed delivery in north Virginia",
            slug: "weed-delivery-north-virginia",
            excerpt: "How same-day delivery works across Ohio.",
            status: "draft",
            showOnHomepage: false,
            bodyJson: {
              type: "doc",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Hello from Wixked Nation." }]
                }
              ]
            }
          },
          description:
            "Status: implemented\nAuth: staff\nCreates post; bodyHtml sanitized server-side."
        }),
        req("Admin get blog post", "GET", "/api/admin/blog/{{blogPostId}}", {
          auth: "admin",
          description: "Status: implemented\nAuth: staff"
        }),
        req("Admin update blog post", "PATCH", "/api/admin/blog/{{blogPostId}}", {
          auth: "admin",
          body: {
            status: "published",
            showOnHomepage: true
          },
          description:
            "Status: implemented\nAuth: staff\nUnpublish clears publishedAt."
        }),
        req("Admin upload blog cover", "POST", "/api/admin/blog/{{blogPostId}}/cover", {
          auth: "admin",
          description:
            "Status: implemented\nAuth: staff\nMultipart field: image"
        }),
        req("Admin upload blog media", "POST", "/api/admin/blog/{{blogPostId}}/media", {
          auth: "admin",
          description:
            "Status: implemented\nAuth: staff\nMultipart field: image; optional alt"
        }),
        req("Admin delete blog post", "DELETE", "/api/admin/blog/{{blogPostId}}", {
          auth: "admin",
          description: "Status: implemented\nAuth: staff\nSoft delete"
        }),
        req("Admin restore blog post", "PATCH", "/api/admin/blog/{{blogPostId}}/restore", {
          auth: "admin",
          description: "Status: implemented\nAuth: staff"
        })
      ]
    },
    {
      name: "Public Catalog",
      item: [
        req("List categories", "GET", "/api/categories", {
          description:
            "Status: implemented\nAuth: none\nReturns nested tree: roots with children[]. Each node: id, name, slug, parentId, sortOrder, children."
        }),
        req("Get category by slug", "GET", "/api/categories/{{categorySlug}}", {
          description:
            "Status: implemented\nAuth: none\nIncludes parentId and direct children."
        }),
        req("List products", "GET", "/api/products", {
          description:
            "Status: implemented\nAuth: none\nQuery category=id|slug includes that category and all descendants (e.g. flower → indica/sativa/hybrid)."
        }),
        req("List featured products", "GET", "/api/products/featured"),
        req("Get product by slug", "GET", "/api/products/{{productSlug}}")
      ]
    },
    {
      name: "Admin Categories",
      item: [
        req("List categories", "GET", "/api/admin/categories", { auth: "admin" }),
        req("Create category", "POST", "/api/admin/categories", {
          auth: "admin",
          body: {
            name: "E2E Category",
            description: "Created from Postman",
            isActive: true,
            parentId: null,
            sortOrder: 0
          },
          description:
            "Status: implemented\nAuth: admin\nBody: { name, slug?, description?, isActive?, parentId?, sortOrder? }.\nSoft-delete blocked if children or products exist."
        }),
        req("Get category", "GET", "/api/admin/categories/{{categoryId}}", {
          auth: "admin"
        }),
        req("Update category", "PATCH", "/api/admin/categories/{{categoryId}}", {
          auth: "admin",
          body: { name: "E2E Category Updated", isActive: true, sortOrder: 5 }
        }),
        req("Soft delete category", "DELETE", "/api/admin/categories/{{categoryId}}", {
          auth: "admin"
        }),
        req("Restore category", "PATCH", "/api/admin/categories/{{categoryId}}/restore", {
          auth: "admin"
        })
      ]
    },
    {
      name: "Admin Products",
      item: [
        req("List products", "GET", "/api/admin/products", { auth: "admin" }),
        req("Create product", "POST", "/api/admin/products", {
          auth: "admin",
          body: {
            name: "E2E Product",
            categoryId: "{{categoryId}}",
            measurementUnit: "g",
            skus: [
              { volume: 1, measurementUnit: "g", price: 100, sortOrder: 0, isVisible: true },
              { volume: 0.5, measurementUnit: "g", price: 60, sortOrder: 1, isVisible: true }
            ],
            isVisible: true,
            isFeatured: false
          },
          description:
            "Status: implemented\nAuth: admin Bearer JWT\nBody: product fields + skus[1–3] { volume, measurementUnit, price, sortOrder?, isVisible?, label? }.\nLegacy single pack still accepted via price+volume+measurementUnit."
        }),
        req("Get product", "GET", "/api/admin/products/{{productId}}", {
          auth: "admin"
        }),
        req("Update product", "PATCH", "/api/admin/products/{{productId}}", {
          auth: "admin",
          body: {
            name: "E2E Product Updated",
            skus: [
              { volume: 1, measurementUnit: "g", price: 110, sortOrder: 0, isVisible: true }
            ]
          }
        }),
        req("Toggle visibility", "PATCH", "/api/admin/products/{{productId}}/visibility", {
          auth: "admin",
          body: { isVisible: false }
        }),
        req("Soft delete product", "DELETE", "/api/admin/products/{{productId}}", {
          auth: "admin"
        }),
        req("Restore product", "PATCH", "/api/admin/products/{{productId}}/restore", {
          auth: "admin"
        }),
        req("Upload product image", "POST", "/api/admin/products/{{productId}}/images", {
          auth: "admin",
          formdata: [
            {
              key: "image",
              type: "file",
              src: []
            }
          ],
          description:
            "Status: implemented\nAuth: admin Bearer JWT\nMultipart field name: image"
        }),
        req("Reorder product images", "PATCH", "/api/admin/products/{{productId}}/images/reorder", {
          auth: "admin",
          body: { imageIds: ["{{imageId}}"] }
        }),
        req("Set cover image", "PATCH", "/api/admin/products/{{productId}}/images/{{imageId}}/cover", {
          auth: "admin"
        }),
        req("Delete product image", "DELETE", "/api/admin/products/{{productId}}/images/{{imageId}}", {
          auth: "admin"
        })
      ]
    },
    {
      name: "Cart",
      item: [
        req("Get cart", "GET", "/api/cart", { auth: "customer" }),
        req("Add cart item", "POST", "/api/cart/items", {
          auth: "customer",
          body: { productId: "{{productId}}", skuId: "{{skuId}}", quantity: 1 },
          description:
            "Status: implemented\nAuth: customer Bearer JWT\nBody: { productId, skuId, quantity }. Different skuId → separate cart lines."
        }),
        req("Update cart item", "PATCH", "/api/cart/items/{{itemId}}", {
          auth: "customer",
          body: { quantity: 2 }
        }),
        req("Delete cart item", "DELETE", "/api/cart/items/{{itemId}}", {
          auth: "customer"
        }),
        req("Clear cart", "DELETE", "/api/cart", { auth: "customer" }),
        req("Merge guest cart", "POST", "/api/cart/merge", {
          auth: "customer",
          body: {
            items: [{ productId: "{{productId}}", skuId: "{{skuId}}", quantity: 1 }]
          }
        })
      ]
    },
    {
      name: "Addresses",
      item: [
        req("List addresses", "GET", "/api/users/me/addresses", {
          auth: "customer"
        }),
        req("Create address", "POST", "/api/users/me/addresses", {
          auth: "customer",
          body: {
            label: "Home",
            fullName: "Test Customer",
            phone: "{{customerPhone}}",
            addressLine1: "1 Capitol Square",
            city: "Columbus",
            state: "OH",
            postalCode: "43215",
            country: "United States",
            isDefault: true
          }
        }),
        req("Update address", "PATCH", "/api/users/me/addresses/{{addressId}}", {
          auth: "customer",
          body: { label: "Home Updated" }
        }),
        req("Delete address", "DELETE", "/api/users/me/addresses/{{addressId}}", {
          auth: "customer"
        })
      ]
    },
    {
      name: "Orders",
      item: [
        req("Create guest order", "POST", "/api/orders/guest", {
          body: {
            phone: "{{guestPhone}}",
            name: "Guest Customer",
            paymentMethod: "COD",
            items: [
              { productId: "{{productId}}", skuId: "{{skuId}}", quantity: 1 }
            ],
            address: {
              fullName: "Guest Customer",
              phone: "{{guestPhone}}",
              addressLine1: "1 Capitol Square",
              city: "Columbus",
              state: "OH",
              postalCode: "43215",
              country: "United States"
            }
          },
          description:
            "Status: implemented\nAuth: none (public)\nNo OTP/PIN at checkout.\nBody: { phone, name?, paymentMethod?: \"COD\", items[{ productId, skuId, quantity }], address{ fullName, phone?, addressLine1, city, postalCode, ... } }.\nDelivery ZIP must be an Ohio ZIP (43001–45999). Finds/creates User by phone (guest registry). Response: order (placedAsGuest, matchedExistingAccount, risk), smsAlert, customer { hasPin, postOrderCta: register|login }.\nRate limit: >10 orders/hour → 429 code ORDER_PHONE_BLOCKED + blockedUntil + try-again message.\nDoes not clear authenticated server cart / does not break POST /api/cart/merge."
        }),
        req("Create order", "POST", "/api/orders", {
          auth: "customer",
          body: { addressId: "{{addressId}}", paymentMethod: "COD" },
          description:
            "Status: implemented\nAuth: customer Bearer JWT\nBody: { addressId, paymentMethod?: \"COD\" } — use addressId (NOT deliveryAddressId). paymentMethod is optional; always stored as COD.\nTriggers admin SMS alerts (mock logs [mock-sms]). Response includes data.smsAlert and order.risk.\nSame phone burst rate limit as guest checkout (ORDER_PHONE_BLOCKED)."
        }),
        req("My orders", "GET", "/api/orders/me", { auth: "customer" }),
        req("My order detail", "GET", "/api/orders/me/{{orderId}}", {
          auth: "customer"
        }),
        req("Cancel my order", "POST", "/api/orders/{{orderId}}/cancel", {
          auth: "customer",
          body: {
            cancelledFromStatus: "Pending",
            note: "Changed my mind"
          },
          description:
            "Status: implemented\nAuth: customer Bearer JWT\nAllowed from Pending, Confirmed, or OutForDelivery.\nRequired body: { cancelledFromStatus: \"Pending\"|\"Confirmed\"|\"OutForDelivery\", note?: string }.\nBody.cancelledFromStatus must match the current order status (409 if stale).\nDelivered orders cannot be cancelled. Admin-only reputation is adjusted on customer cancel."
        }),
        req("Admin list orders", "GET", "/api/admin/orders", { auth: "admin" }),
        req("Admin order detail", "GET", "/api/admin/orders/{{orderId}}", {
          auth: "admin",
          description:
            "Status: implemented\nAuth: admin Bearer JWT\nIncludes placedAsGuest, matchedExistingAccount, live risk { lowReputation, pendingPileUp, reputationScore, cancelledOrderCount, pendingOrderCount }, and user.reputation."
        }),
        req("Admin update order status", "PATCH", "/api/admin/orders/{{orderId}}/status", {
          auth: "admin",
          body: { status: "Confirmed", note: "Accepted" }
        }),
        req("Admin get customer", "GET", "/api/admin/customers/{{customerId}}", {
          auth: "admin",
          description:
            "Status: implemented\nAuth: admin Bearer JWT\nCustomer profile + reputation + recent orders. Never exposed to customers."
        }),
        req("Admin list customers", "GET", "/api/admin/customers", {
          auth: "admin",
          description:
            "Status: implemented\nAuth: admin Bearer JWT\nPaginated customer list with reputation and orderCount."
        }),
        req("Admin customer orders", "GET", "/api/admin/customers/{{customerId}}/orders", {
          auth: "admin",
          description:
            "Status: implemented\nAuth: admin Bearer JWT\nPaginated orders for one customer."
        })
      ]
    },
    {
      name: "Admin Dashboard",
      item: [
        req("Dashboard stats", "GET", "/api/admin/dashboard/stats", {
          auth: "admin",
          description:
            "Status: implemented\nAuth: admin Bearer JWT\nReturns order, product, and customer counts."
        }),
        req("Dashboard recent orders", "GET", "/api/admin/dashboard/recent-orders", {
          auth: "admin",
          description:
            "Status: implemented\nAuth: admin Bearer JWT\nQuery limit (default 10, max 50)."
        })
      ]
    },
    {
      name: "Notifications",
      item: [
        req("List notifications", "GET", "/api/notifications", {
          auth: "customer",
          description:
            "Status: implemented\nAuth: Bearer JWT\nFrontend should poll this endpoint (no Supabase Realtime).\nResponse includes unreadCount."
        }),
        req("Mark notification read", "PATCH", "/api/notifications/{{notificationId}}/read", {
          auth: "customer"
        }),
        req("Read all notifications", "PATCH", "/api/notifications/read-all", {
          auth: "customer"
        })
      ]
    },
    {
      name: "Store",
      item: [
        req("Get store config", "GET", "/api/store/config", {
          description:
            "Status: implemented\nAuth: none\nPublic storefront config.\nResponse: { success, message, data: { defaultCurrency, orderContactPhones: [{ id, phone }] } }.\norderContactPhones = admin phones with showOnBanner true (for Call/Telegram banner)."
        })
      ]
    },
    {
      name: "Admin Settings",
      item: [
        req("Get settings", "GET", "/api/admin/settings", {
          auth: "admin",
          description:
            "Status: implemented\nAuth: admin Bearer JWT\nIncludes defaultMeasurementUnit and defaultCurrency in data.settings."
        }),
        req("Patch settings", "PATCH", "/api/admin/settings", {
          auth: "admin",
          body: {
            defaultMeasurementUnit: "oz",
            defaultCurrency: "USD"
          },
          description:
            "Status: implemented\nAuth: admin Bearer JWT\nBody: { defaultMeasurementUnit?, defaultCurrency? }.\ndefaultCurrency: 3-letter ISO code; allowed v1: ETB, USD, EUR, GBP."
        }),
        req("Add admin phone", "POST", "/api/admin/settings/admin-phones", {
          auth: "admin",
          body: { phone: "+17035551111", showOnBanner: true },
          description:
            "Status: implemented\nAuth: admin Bearer JWT\nBody: { phone, showOnBanner?: boolean }.\nphone must be US E.164. showOnBanner defaults false — when true, phone appears on store order-contact banner."
        }),
        req("Patch admin phone", "PATCH", "/api/admin/settings/admin-phones/{{adminPhoneId}}", {
          auth: "admin",
          body: { showOnBanner: true },
          description:
            "Status: implemented\nAuth: admin Bearer JWT\nBody: { showOnBanner: boolean } — toggle storefront banner visibility."
        }),
        req("Delete admin phone", "DELETE", "/api/admin/settings/admin-phones/{{adminPhoneId}}", {
          auth: "admin"
        }),
        req("Patch SMS settings", "PATCH", "/api/admin/settings/sms", {
          auth: "admin",
          body: { provider: "twilio" },
          description:
            "Status: implemented\nAuth: admin Bearer JWT\nBody: { provider: \"mock\" | \"twilio\" }. Secrets stay in env (TWILIO_*). AfroMessage is not allowed."
        })
      ]
    },
    {
      name: "Admin SMS",
      item: [
        req("Send test SMS", "POST", "/api/admin/sms/test", {
          auth: "admin",
          body: {
            phone: "{{customerPhone}}",
            message: "This is a test SMS from the backend."
          },
          description:
            "Status: implemented\nAuth: admin Bearer JWT\nWith mock provider, expect server log [mock-sms] to=..."
        }),
        req("List SMS logs", "GET", "/api/admin/sms/logs", {
          auth: "admin",
          description:
            "Status: implemented\nAuth: admin Bearer JWT\nPaginated SMS logs with optional filters."
        })
      ]
    },
    {
      name: "Admin Media",
      item: [
        req("List media library", "GET", "/api/admin/media", {
          auth: "admin",
          description:
            "Status: implemented\nAuth: admin Bearer JWT\nDB-first flatten of Product.images across products.\nQuery: page, limit, search (product name), includeArchived (true = hidden + soft-deleted products).\nResponse data: { items, pagination, summary: { totalImages, totalBytes } }.\nDelete from media UI: reuse DELETE /api/admin/products/:productId/images/:imageId."
        })
      ]
    }
  ]
};

function collectRequests(items, acc = []) {
  for (const item of items) {
    if (item.item) {
      collectRequests(item.item, acc);
    } else if (item.request) {
      acc.push({
        name: item.name,
        method: item.request.method,
        path: `/${(item.request.url.path || []).join("/")}`.replace(/\/$/, "") || "/"
      });
    }
  }
  return acc;
}

fs.writeFileSync(OUT, `${JSON.stringify(collection, null, 2)}\n`, "utf8");

const requests = collectRequests(collection.item);
console.log(`Wrote ${requests.length} requests to ${OUT}`);
