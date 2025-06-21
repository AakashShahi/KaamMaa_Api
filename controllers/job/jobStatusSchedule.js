const cron = require("node-cron");
const Job = require("../../models/Job");

function startJobExpiryCron() {
    cron.schedule("*/10 * * * *", async () => {
        console.log("⏰ Checking for expired jobs...");

        const now = new Date();

        try {
            // Get candidate jobs
            const jobs = await Job.find({
                status: { $in: ["assigned", "in-progress", "requested"] },
            });

            let failedCount = 0;

            for (const job of jobs) {
                // Combine date + time into one Date object
                const jobDateTime = new Date(`${job.date}T${job.time}`);

                if (jobDateTime < now) {
                    job.status = "failed";
                    await job.save();
                    failedCount++;
                }
            }

            console.log(`✅ ${failedCount} job(s) marked as failed.`);
        } catch (error) {
            console.error("❌ Failed to update expired jobs:", error);
        }
    });
}

module.exports = startJobExpiryCron;
