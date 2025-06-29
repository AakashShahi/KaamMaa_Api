// 📄 server.js
require("dotenv").config();
const app = require("./index");
const startJobExpiryCron = require("./controllers/job/jobStatusSchedule"); // adjust path
const startWorkerAvailabilityCron = require("./controllers/job/startWorkerAvailabiliyCron"); // adjust path

// Start your cron job
startJobExpiryCron();
startWorkerAvailabilityCron();

const PORT = process.env.PORT;
app.listen(PORT, '0.0.0.0', () => {
    console.log("🚀 Server Running on port", PORT);
});
