const mongoose = require("mongoose");

const PaymentTransactionSchema = new mongoose.Schema(
    {
        jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
        paidBy: { type: Schema.Types.ObjectId, ref: 'User' },
        paidTo: { type: Schema.Types.ObjectId, ref: 'User' },
        amount: Number,
        method: { type: String, enum: ['Khalti', 'Cash'], required: true },
        khaltiTxnId: String, // Only for Khalti payments
        status: { type: String, enum: ['success', 'failed'] },
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model("PaymentTransaction", PaymentTransactionSchema)