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

    // handle server shutdown gracefully
    const exitHandler = () => {
      if (server) {
        server.close(() => {
          console.log("Server closed gracefully.");
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    };

    process.on("SIGINT", exitHandler);
    process.on("SIGTERM", exitHandler);

    // handle unhandled promise rejections
    process.on("unhandledRejection", (error) => {
      console.log(
        "Unhandled Rejection is detected, we are closing our server...",
      );
      console.error("Error:", error);
      console.error("Stack:", (error as Error).stack);
      if (server) {
        server.close(() => {
          console.log(error);
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    });
  } catch (error) {
    console.log("Server Error", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

bootstrap();
