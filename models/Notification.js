const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        title: String,
        body: String,
        seen: { type: Boolean, default: false },
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Notification", NotificationSchema)