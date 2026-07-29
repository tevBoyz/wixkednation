require("dotenv").config();

const prisma = require("../src/config/prisma");
const { resolveProvider, sendSms } = require("../src/services/sms/sms.service");

async function main() {
  const provider = resolveProvider();
  const phone = process.env.SEED_ADMIN_PHONE || "+251911676343";
  const message = "Backend SMS abstraction test message.";

  console.log("Resolved provider:", provider.name);

  const result = await sendSms({
    phone,
    message
  });

  console.log("Send result:");
  console.log(
    JSON.stringify(
      {
        success: result.success,
        provider: result.provider,
        providerRef: result.providerRef,
        error: result.error,
        smsLogId: result.smsLogId
      },
      null,
      2
    )
  );

  if (result.smsLogId) {
    const smsLog = await prisma.smsLog.findUnique({
      where: {
        id: result.smsLogId
      }
    });

    console.log("Stored SMS log:");
    console.log(
      JSON.stringify(
        {
          id: smsLog.id,
          phone: smsLog.phone,
          provider: smsLog.provider,
          status: smsLog.status,
          providerRef: smsLog.providerRef,
          errorMessage: smsLog.errorMessage
        },
        null,
        2
      )
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
