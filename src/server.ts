import { Server } from "http";
import app from "./app";
import config from "./config/env";
import { prisma } from "./lib/prisma";

const bootstrap = async () => {
  let server: Server;
  try {
    await prisma.$connect();
    console.log("Connected to the database");
    server = app.listen(config.port, () => {
      console.log(`Server is running on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.log("Server Error", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

bootstrap();
