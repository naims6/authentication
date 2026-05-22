import { Server } from "http";
import config from "./config/env";
import { prisma } from "./lib/prisma";
import { startCronJobs } from "./schedulers/cron.scheduler";
import connectRedis, { redisClient } from "./config/redis";

const bootstrap = async () => {
  let server: Server;
  try {
    await prisma.$connect();
    console.log("Connected to the database");
    // connect to redis
    await connectRedis();

    // Dynamically import createApp after Redis is connected
    const createApp = (await import("./app")).default;
    const app = createApp();

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
