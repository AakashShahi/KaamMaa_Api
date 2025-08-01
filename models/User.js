const mongoose = require("mongoose");

//User model schema
const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
        },
        name: {
            type: String,
            trim: true,
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
            ref: "ProfessionCategory",
        },
        skills: {
            type: [String],
            default: [],
        },
        location: {
            type: String,
        },
        availability: {
            type: Boolean,
            default: true,
        },
        certificateUrl: {
            type: String,
            default: "",
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        profilePic: {
            type: String,
            default: "",
        },
        phone: {
            type: String,
            required: true,
        },
        verificationRequest: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", UserSchema);
