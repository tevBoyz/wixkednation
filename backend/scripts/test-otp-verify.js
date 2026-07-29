require("dotenv").config();

const http = require("http");
const prisma = require("../src/config/prisma");

function request(method, path, { token, body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 5000,
        path,
        method,
        headers: {
          ...(token
            ? {
                Authorization: `Bearer ${token}`
              }
            : {}),
          ...(payload
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload)
              }
            : {})
        }
      },
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          resolve({
            status: res.statusCode,
            body: data
          });
        });
      }
    );

    req.on("error", reject);

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
}

async function main() {
  const phone = process.env.SEED_ADMIN_PHONE || "+251911676343";

  console.log("1) Sending OTP...");
  const sendResult = await request("POST", "/api/auth/otp/send", {
    body: { phone }
  });
  console.log("Status:", sendResult.status);
  console.log(sendResult.body);
  console.log("");

  if (sendResult.status === 429) {
    console.log(
      "Cooldown active. Use the latest OTP from the server console and set OTP_CODE env var, or wait and rerun."
    );
  }

  const otpCode = process.env.OTP_CODE;

  if (!otpCode) {
    console.log(
      "Set OTP_CODE from the [otp-dev] console line, then rerun:\nOTP_CODE=123456 node scripts/test-otp-verify.js"
    );
    return;
  }

  console.log("2) Verifying OTP...");
  const verifyResult = await request("POST", "/api/auth/otp/verify", {
    body: {
      phone,
      otp: otpCode
    }
  });
  console.log("Status:", verifyResult.status);
  console.log(verifyResult.body);
  console.log("");

  const parsed = JSON.parse(verifyResult.body);

  if (!parsed.success) {
    return;
  }

  const accessToken = parsed.data.accessToken;

  console.log("3) Calling /api/auth/me with access token...");
  const meResult = await request("GET", "/api/auth/me", {
    token: accessToken
  });
  console.log("Status:", meResult.status);
  console.log(meResult.body);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
