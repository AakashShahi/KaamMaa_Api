const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
        },
        firstName: {
            type: String,
            trim: true,
            required: true,
        },
        lastName: {
            type: String,
            trim: true,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["worker", "customer", "admin"],
            required: true,
        },
        profession: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProfessionCategory", // make sure model name matches your category collection
            required: function () {
                return this.role === "worker";
            },
        },
        skills: {
            type: [String],
            default: [], // Only relevant if role is worker
        },
        location: {
            type: String,
            required: true,
        },
        availability: {
            type: Boolean,
            default: true,
        },
        certificateUrl: {
            type: String,
            default: "", // URL or path to uploaded certificate, worker only
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        profilePic: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", UserSchema);
