const User = require("../../models/User");
const bcrypt = require("bcrypt");


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

        const updates = {};

        // Update name if provided
        if (req.body.name) {
            updates.name = req.body.name;
        }

        // Update password if provided and hash it
        if (req.body.password) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            updates.password = hashedPassword;
        }

        // Update profile picture if uploaded
        if (req.file?.path) {
            updates.profilePic = req.file.path;
        }

        // Update only allowed fields
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
        console.error("Update Error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to update user",
            error: err.message,
        });
    }
};