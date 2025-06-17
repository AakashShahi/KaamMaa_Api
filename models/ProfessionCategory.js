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
            type: String,
            default: "",
        },
        category: {
            type: String,
        },
        description: {
            type: String
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("ProfessionCategory", ProfessionCategorySchema);