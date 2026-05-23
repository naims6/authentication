import cron from "node-cron";
import { permanentDeleteUser } from "../jobs/userCleanup.job.js";

export const startCronJobs = () => {
  cron.schedule("0 2 * * *", async () => {
    try {
      const result = await permanentDeleteUser();
      console.log("Deleted users:", result.count);
    } catch (error) {
      console.error("Failed to delete users:", error);
    }
  });
};
