import express, { Application, Request, Response } from "express";
import cors from "cors";
import notFound from "./middleware/notFound";
import globalError from "./middleware/globalError";
import { AuthRoutes } from "./modules/auth/auth.routes";
import cookieParser from "cookie-parser";
import { rateLimiters } from "./middleware/rateLimiter";

const createApp = () => {
  const app: Application = express();

  app.use(express.json());
  app.use(cors());
  app.use(rateLimiters.global);
  app.use(cookieParser());

  app.get("/", (_req: Request, res: Response) => {
    res.send({
      status: "ok",
      message: "server is running",
      uptime: process.uptime(),
      time: new Date().toISOString(),
    });
  });

  app.use("/api/v1/auth", AuthRoutes);

  app.use(notFound);
  app.use(globalError);

  return app;
};

export default createApp;
