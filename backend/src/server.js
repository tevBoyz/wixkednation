const app = require("./app");
const env = require("./config/env");

const server = app.listen(env.port, () => {
  console.log(`Server running on ${env.backendUrl}`);
  console.log(`Environment: ${env.nodeEnv}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);

  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);

  process.exit(1);
});