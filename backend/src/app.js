const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const env = require("./config/env");
const { corsOrigin } = require("./config/cors");
const { assetsDir } = require("./config/assets");
const assetsRoutes = require("./modules/assets/assets.routes");

const healthRoutes = require("./modules/health/health.routes");
const authRoutes = require("./modules/auth/auth.routes");
const categoriesRoutes = require("./modules/categories/categories.routes");
const productsRoutes = require("./modules/products/products.routes");
const adminCategoriesRoutes = require("./modules/admin/categories/categories.routes");
const adminProductsRoutes = require("./modules/admin/products/products.routes");
const cartRoutes = require("./modules/cart/cart.routes");
const addressesRoutes = require("./modules/addresses/addresses.routes");
const ordersRoutes = require("./modules/orders/orders.routes");
const adminOrdersRoutes = require("./modules/admin/orders/orders.routes");
const adminSettingsRoutes = require("./modules/admin/settings/settings.routes");
const adminSmsRoutes = require("./modules/admin/sms/sms.routes");
const adminCustomersRoutes = require("./modules/admin/customers/customers.routes");
const adminDashboardRoutes = require("./modules/admin/dashboard/dashboard.routes");
const adminMediaRoutes = require("./modules/admin/media/media.routes");
const adminTeamRoutes = require("./modules/admin/team/team.routes");
const adminBannersRoutes = require("./modules/admin/banners/banners.routes");
const adminCouponsRoutes = require("./modules/admin/coupons/coupons.routes");
const adminLeadsRoutes = require("./modules/admin/leads/leads.routes");
const adminAnalyticsRoutes = require("./modules/admin/analytics/analytics.routes");
const adminBlogRoutes = require("./modules/admin/blog/blog.routes");
const usersRoutes = require("./modules/users/users.routes");
const notificationsRoutes = require("./modules/notifications/notifications.routes");
const ageGateRoutes = require("./modules/age-gate/age-gate.routes");
const storeRoutes = require("./modules/store/store.routes");
const analyticsRoutes = require("./modules/analytics/analytics.routes");
const blogRoutes = require("./modules/blog/blog.routes");

const notFoundHandler = require("./middleware/notFound.middleware");
const errorHandler = require("./middleware/error.middleware");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: corsOrigin,
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv === "development") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend API is running"
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/admin/categories", adminCategoriesRoutes);
app.use("/api/admin/products", adminProductsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/users/me/addresses", addressesRoutes);
app.use("/api/users/me", usersRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin/orders", adminOrdersRoutes);
app.use("/api/admin/settings", adminSettingsRoutes);
app.use("/api/admin/sms", adminSmsRoutes);
app.use("/api/admin/customers", adminCustomersRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/media", adminMediaRoutes);
app.use("/api/admin/team", adminTeamRoutes);
app.use("/api/admin/banners", adminBannersRoutes);
app.use("/api/admin/coupons", adminCouponsRoutes);
app.use("/api/admin/leads", adminLeadsRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/admin/blog", adminBlogRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/age-gate", ageGateRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/blog", blogRoutes);

app.use("/api/assets", assetsRoutes);

app.use(
  "/api/assets",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(assetsDir, {
    maxAge: env.nodeEnv === "production" ? "7d" : 0,
    fallthrough: false
  })
);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;