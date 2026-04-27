const { createProxyMiddleware } = require("http-proxy-middleware");

/**
 * Avoid browser CORS to SofaScore during `npm start`.
 * Client uses base URL `/sofa-api` which is rewritten to `/api/v1` on www.sofascore.com.
 */
module.exports = function setupProxy(app) {
  app.use(
    "/sofa-api",
    createProxyMiddleware({
      target: "https://www.sofascore.com",
      changeOrigin: true,
      secure: true,
      pathRewrite: { "^/sofa-api": "/api/v1" },
    })
  );
};
