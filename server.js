// 📄 server.js
require("dotenv").config();
const app = require("./index");
const http = require("http");
const { Server } = require("socket.io");
const startJobExpiryCron = require("./controllers/job/jobStatusSchedule"); // adjust path
const startWorkerAvailabilityCron = require("./controllers/job/startWorkerAvailabiliyCron"); // adjust path

const server = http.createServer(app);

// Use this to share io instance globally
app.set("io", io);

// Socket connection setup
io.on("connection", (socket) => {
    console.log("🟢 New user connected:", socket.id);

    socket.on("joinRoom", ({ jobId }) => {
        socket.join(jobId);
        console.log(`User joined room: ${jobId}`);
    });

    socket.on("sendMessage", (message) => {
        io.to(message.jobId).emit("receiveMessage", message); // Broadcast to room
    });

    socket.on("disconnect", () => {
        console.log("🔴 User disconnected:", socket.id);
    });
});

const io = new Server(server, {
    cors: {
        origin: "*", // you can specify frontend URL here instead of *
        methods: ["GET", "POST"]
    }
});


// Start your cron job
startJobExpiryCron();
startWorkerAvailabilityCron();

const PORT = process.env.PORT;
app.listen(PORT, '0.0.0.0', () => {
    console.log("🚀 Server Running on port", PORT);
});