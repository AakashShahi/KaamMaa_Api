const User = require("../../models/User");

exports.getLoggedInUser = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).populate("profession");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "User fetched successfully",
            data: user,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message,
        });
    }
};

exports.updateLoggedInUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const updates = req.body;

        const updatedUser = await User.findByIdAndUpdate(userId, updates, {
            new: true,
            runValidators: true,
        }).populate("profession");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: updatedUser,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to update user",
            error: err.message,
        });
    }
};