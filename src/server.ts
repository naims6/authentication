import { Server } from "http";
import app from "./app";
import config from "./config/env";
import { prisma } from "./lib/prisma";
import { startCronJobs } from "./schedulers/cron.scheduler";
import connectRedis from "./config/redis";

const bootstrap = async () => {
  let server: Server;
  try {
    await prisma.$connect();
    console.log("Connected to the database");

    // connect to redis
    await connectRedis();

    server = app.listen(config.port, () => {
      console.log(`Server is running on http://localhost:${config.port}`);
    });

    // start cron jobs
    startCronJobs();
  } catch (error) {
    console.log("Server Error", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

bootstrap();
