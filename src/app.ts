import express, { Application, Request, Response } from "express";
import cors from "cors";
import notFound from "./middleware/notFound";
import globalError from "./middleware/globalError";
import { AuthRoutes } from "./modules/auth/auth.routes";
import cookieParser from "cookie-parser";
import { rateLimiters } from "./middleware/rateLimiter";
import { settingRoutes } from "./modules/settings/setting.routes";
import fs from "fs";
import YAML from "yaml";
import swaggerUi from "swagger-ui-express";

const createApp = () => {
  const app: Application = express();

  app.use(express.json());
  app.use(cors());
  app.use(rateLimiters.global);
  app.use(cookieParser());

  // configure swagger
  const file = fs.readFileSync("./swagger.yml", "utf-8");
  const parsedFile = YAML.parse(file);

  app.get("/", (_req: Request, res: Response) => {
    res.send({
      status: "ok",
      message: "server is running...",
      uptime: process.uptime(),
      time: new Date().toISOString(),
    });
  });

  // api docs with swagger
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(parsedFile));

  app.use("/api/v1/auth", AuthRoutes);
  app.use("/api/v1/settings", settingRoutes);

  app.use(notFound);
  app.use(globalError);

  return app;
};

export default createApp;
