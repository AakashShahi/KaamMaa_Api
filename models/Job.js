const mongoose = require("mongoose");

//Jobs schema
const JobSchema = mongoose.Schema(
    {
        postedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'ProfessionCategory'
        },
        description: String,
        location: String,
        time: Date,
        status: {
            type: String,
            enum: ['open', 'in-progress', 'done', 'failed'],
            default: 'open'
        },
        review: {
            rating: Number,
            comment: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Job", JobSchema);
