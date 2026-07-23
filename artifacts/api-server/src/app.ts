import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "path";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(authMiddleware);

app.use("/api", router);

// ── Serve frontend static files in production ─────────────────────
const staticDir = process.env.STATIC_DIR
  || path.resolve(process.cwd(), "artifacts", "devmind", "dist", "public");

app.use(express.static(staticDir));

// SPA fallback — serve index.html for all non-API routes
app.use((_req, res, next) => {
  // If no route matched and it's not an API path, serve the SPA
  if (!res.headersSent) {
    res.sendFile(path.join(staticDir, "index.html"), (err) => {
      if (err) next();
    });
  } else {
    next();
  }
});

export default app;
