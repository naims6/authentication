import cron from "node-cron";
import { permanentDeleteUser } from "../jobs/userCleanup.job";

export const startCronJobs = () => {
  cron.schedule("* 2 * * *", async () => {
    const result = await permanentDeleteUser();
    console.log("Deleted users:", result.count);
  });
};
