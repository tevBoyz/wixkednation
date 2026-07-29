require("dotenv").config();

const http = require("http");
const prisma = require("../src/config/prisma");
const {
  buildAuthTokenPayload,
  signAccessToken
} = require("../src/services/auth/token.service");

function request(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 5000,
        path,
        method: "GET",
        headers: token
          ? {
              Authorization: `Bearer ${token}`
            }
          : {}
      },
      (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          resolve({
            status: res.statusCode,
            body
          });
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      role: "admin"
    }
  });

  if (!user) {
    throw new Error("No admin user found. Run npm run db:seed first.");
  }

  const token = signAccessToken(buildAuthTokenPayload(user));

  const me = await request("/api/auth/me", token);
  const admin = await request("/api/auth/admin-check", token);
  const invalid = await request("/api/auth/me", "invalid-token");

  console.log("1) GET /api/auth/me");
  console.log("Status:", me.status);
  console.log(me.body);
  console.log("");

  console.log("2) GET /api/auth/admin-check");
  console.log("Status:", admin.status);
  console.log(admin.body);
  console.log("");

  console.log("3) GET /api/auth/me with invalid token");
  console.log("Status:", invalid.status);
  console.log(invalid.body);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
