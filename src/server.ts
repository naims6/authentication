import app from "./app";
import config from "./config/env";
import { prisma } from "./lib/prisma";

app.listen(config.port, async () => {
  await prisma.$connect();
  console.log("Connected to the database");
  console.log("Server is running on port", config.port);
});
