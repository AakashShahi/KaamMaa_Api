const mongoose = require("mongoose");

//Review Model
const ReviewSchema = mongoose.Schema(
    {
        jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
        workerId: { type: Schema.Types.ObjectId, ref: 'User' },
        customerId: { type: Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, required: true },
        comment: String,
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model("Review", ReviewSchema);