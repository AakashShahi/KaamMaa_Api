const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
    {
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
        participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        messages: [
            {
                senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                content: String,
                createdAt: { type: Date, default: Date.now },
            },
        ],
    }
)

module.exports = mongoose.model("Chat", ChatSchema)