const cron = require("node-cron");
const Job = require("../../models/Job"); // adjust path if needed

// Runs every 10 minutes
cron.schedule("*/10 * * * *", async () => {
    console.log("⏰ Checking for expired jobs...");

    const now = new Date();

    try {
        // Find jobs that are in-progress or assigned or requested and time has passed
        const expiredJobs = await Job.find({
            status: { $in: ["assigned", "in-progress", "requested"] },
            date: { $lt: now }, // if you're storing full DateTime in date field
            // OR: time: { $lt: now } if time is stored separately
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
