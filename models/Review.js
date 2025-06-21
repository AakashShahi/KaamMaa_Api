const mongoose = require("mongoose");

//Review Model
const ReviewSchema = new mongoose.Schema(
    {
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
        workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, required: true },
        comment: String,
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model("Review", ReviewSchema);