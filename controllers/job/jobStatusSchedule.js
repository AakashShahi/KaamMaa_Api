// 📄 src/utils/cronJobs/jobExpiryCron.js
const cron = require("node-cron");
const Job = require("../../models/Job"); // adjust if path differs

function startJobExpiryCron() {
    cron.schedule("*/10 * * * *", async () => {
        console.log("⏰ Checking for expired jobs...");

        const now = new Date();

        try {
            const expiredJobs = await Job.find({
                status: { $in: ["assigned", "in-progress", "requested"] },
                date: { $lt: now },
            });

            for (const job of expiredJobs) {
                job.status = "failed";
                await job.save();
            }

            console.log(`✅ ${expiredJobs.length} job(s) marked as failed.`);
        } catch (error) {
            console.error("❌ Failed to update expired jobs:", error);
        }
    });
}

module.exports = startJobExpiryCron;