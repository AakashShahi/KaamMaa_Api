const mongoose = require("mongoose");

const ChatSchema = mongoose.Schema(
    {
        jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
        participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        messages: [
            {
                senderId: { type: Schema.Types.ObjectId, ref: 'User' },
                content: String,
                createdAt: { type: Date, default: Date.now },
            },
        ],
    }
)

module.exports = mongoose.model("Chat", ChatSchema)