// Vercel Serverless Function — wraps the bundled Express app
const app = require("../artifacts/api-server/dist/vercel.mjs");
module.exports = app.default || app;
