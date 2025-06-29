const cron = require("node-cron");
const updateWorkerAvailability = require("./updateWorkerAvailability");

function startWorkerAvailabilityCron() {
    // ⏰ Runs at minute 0 every hour (e.g. 1:00, 2:00...)
    cron.schedule("*/5 * * * *", async () => {
        console.log("⏳ Running worker availability check...");
        await updateWorkerAvailability();
    });
}

module.exports = startWorkerAvailabilityCron;