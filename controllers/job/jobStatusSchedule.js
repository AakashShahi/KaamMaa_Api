const Job = require("../../models/Job");
const cron = require("node-cron");
const moment = require("moment");

function startJobExpiryCron() {
    cron.schedule("*/10 * * * *", async () => {
        console.log("⏰ Checking for expired jobs...");

        const now = new Date();

        try {
            const jobs = await Job.find({
                status: { $in: ["assigned", "in-progress", "requested"] },
            });

            let failedCount = 0;

            for (const job of jobs) {
                const jobDateTime = moment(`${job.date} ${job.time}`, "YYYY-M-D HH:mm").toDate();
                console.log(`Checking job at ${jobDateTime}, now is ${now}`);

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

