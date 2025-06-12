const mongoose = require("mongoose");

//Profession Schema
const ProfessionCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        icon: {
            type: String, // Optional: URL or emoji/icon string
            default: "",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("ProfessionCategory", ProfessionCategorySchema);