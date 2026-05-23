import express, { Application, Request, Response } from "express";
import cors from "cors";
import notFound from "./middleware/notFound.js";
import globalError from "./middleware/globalError.js";
import { AuthRoutes } from "./modules/auth/auth.routes.js";
import cookieParser from "cookie-parser";
import { rateLimiters } from "./middleware/rateLimiter.js";
import { settingRoutes } from "./modules/settings/setting.routes.js";
import fs from "fs";
import YAML from "yaml";
import swaggerUi from "swagger-ui-express";
import path from "path";

const createApp = () => {
  const app: Application = express();

  app.use(express.json());
  app.use(cors());
  app.use(rateLimiters.global);
  app.use(cookieParser());

  // configure swagger
  let parsedFile: Record<string, unknown> | null = null;
  try {
    const swaggerPath = path.resolve(process.cwd(), "swagger.yml");
    const file = fs.readFileSync(swaggerPath, "utf-8");
    parsedFile = YAML.parse(file);
  } catch (_err) {
    parsedFile = null;
  }

  if (parsedFile) {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(parsedFile));
  }

  app.get("/", (_req: Request, res: Response) => {
    res.send({
      status: "ok",
      message: "server is running...",
      uptime: process.uptime(),
      time: new Date().toISOString(),
    });
  });

  // api docs with swagger
  // app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(parsedFile));

  app.use("/api/v1/auth", AuthRoutes);
  app.use("/api/v1/settings", settingRoutes);

  app.use(notFound);
  app.use(globalError);

  return app;
};

export default createApp;
