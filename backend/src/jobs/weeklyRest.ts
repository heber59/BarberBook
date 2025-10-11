import { FastifyInstance } from "fastify";
import cron from "node-cron";

export function scheduleWeeklyReset(fastify: FastifyInstance) {
  // Run every Monday at 00:00
  cron.schedule("0 0 * * MON", async () => {
    // Logic to "open new week": could archive previous week's appointments, or set availability
    fastify.log.info("Weekly reset running");
    // Example: we could set statuses, send notifications, or rebuild availability
  });
}
