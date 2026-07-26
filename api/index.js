// Vercel Serverless Function — wraps the bundled Express app
let handler;

module.exports = async (req, res) => {
  if (!handler) {
    const app = await import("../artifacts/api-server/dist/vercel.mjs");
    handler = app.default || app;
  }
  return handler(req, res);
};
