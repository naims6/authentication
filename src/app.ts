import express, { Application, Request, Response } from "express";
import cors from "cors";
const app: Application = express();

app.use(express.json());
app.use(cors());

app.get("/", (_req: Request, res: Response) => {
  res.send({
    status: "ok",
    message: "server is running",
    uptime: process.uptime(),
    time: new Date().toISOString(),
  });
});

export default app;
