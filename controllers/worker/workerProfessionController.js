const Profession = require("../../models/ProfessionCategory");

// Get All Profession
exports.getProfession = async (req, res) => {
    try {
        const professions = await Profession.find();
        return res.status(200).json({
            success: true,
            message: "Professions fetched successfully",
            data: professions
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};