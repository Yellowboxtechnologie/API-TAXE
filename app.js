require("./utils/instrument");
const Sentry = require("@sentry/node");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
dotenv.config();
const morgan = require("morgan");
const helmet = require("helmet");
const fs = require("fs");
const permissionsPolicy = require("permissions-policy");
const adminRoutes = require("./routes/adminRoutes");
const merchantRoutes = require("./routes/merchantRoutes");
const operatorRoutes = require("./routes/operatorRoutes");

// Init express app
const app = express();

// Logger
app.use(morgan("dev"));

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Public directory
app.use(express.static("public"));

// Implement security measures
// XSS protection
app.use(helmet.xssFilter());
app.use(helmet.frameguard({ action: "sameorigin" }));
app.use(helmet.dnsPrefetchControl());
app.use(helmet.referrerPolicy({ policy: "same-origin" }));
app.use(helmet.noSniff());
app.use(helmet());

// CSP protection
app.use(
  helmet.contentSecurityPolicy({ directives: { defaultSrc: ["'self'"] } })
);

// Permissions policy
app.use(
  permissionsPolicy({
    features: {
      payment: ["self", '"nyota-api.com"'],
      syncXhr: [],
    },
  })
);

// Routes
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/merchant", merchantRoutes);
app.use("/api/v1/operator", operatorRoutes);

// The error handler must be registered after all controllers
Sentry.setupExpressErrorHandler(app);

// Export app
const port = process.env.PORT || 3000;

// Start server
app.listen(port, () => {
  console.log(`
  ==================================
  |🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀|
  |============= API ==============|
  |======= ENV: ${process.env.NODE_ENV}  =======|
  |========== POST: ${process.env.PORT} ==========|
  |🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀|
  ==================================
  `);
});
