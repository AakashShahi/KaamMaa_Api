const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
    {
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProfessionCategory',
        },
        description: String,
        location: String,
        date: {
            type: String, // Format: "YYYY-MM-DD"
            required: true,
        },
        time: {
            type: String, // Format: "HH:mm" or "HH:mm:ss"
            required: true,
        },

        status: {
            type: String,
            enum: ['open', 'assigned', 'requested', 'in-progress', 'done', 'rejected', 'failed'],
            default: 'open',
        },
        review: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review",
        },
        deletedByCustomer: {
            type: Boolean,
            default: false,
        },
        deletedByWorker: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Job", JobSchema);
