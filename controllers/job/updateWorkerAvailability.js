const Job = require("../../models/Job");
const User = require("../../models/User");

async function updateWorkerAvailability() {
    try {
        const today = new Date().toISOString().split("T")[0];

        // Find workers with in-progress jobs today
        const jobsToday = await Job.find({
            status: "in-progress",
            date: today
        });

        const allWorkers = await User.find({ role: "worker" }).select("_id");

        const busyWorkerIds = jobsToday.map(job => job.assignedTo?.toString()).filter(Boolean);
        const allWorkerIds = allWorkers.map(w => w._id.toString());

        const freeWorkerIds = allWorkerIds.filter(id => !busyWorkerIds.includes(id));

        // 🔴 Make busy workers unavailable
        await User.updateMany(
            { _id: { $in: busyWorkerIds } },
            { $set: { availability: false } }
        );

        // ✅ Make free workers available
        await User.updateMany(
            { _id: { $in: freeWorkerIds } },
            { $set: { availability: true } }
        );

        console.log("🟢 Worker availability updated successfully.");
    } catch (err) {
        console.error("❌ Failed to update availability:", err.message);
    }
}

module.exports = updateWorkerAvailability;