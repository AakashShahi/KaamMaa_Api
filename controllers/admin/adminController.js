const User = require("../../models/User");
const bcrypt = require("bcrypt");

exports.getAdminProfile = async (req, res) => {
    try {
        const admin = await User.findById(req.user._id)
            .select("-password");

        if (!admin || admin.role !== "admin") {
            return res.status(404).json({ message: "Admin not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Successfully fetched admin profile",
            data: admin,
        });
    } catch (err) {
        console.error("Error getting admin profile:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.updateAdminProfile = async (req, res) => {
    try {
        const allowedUpdates = ["name"];
        const updates = {};

        for (let key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        // Fix here: Use req.file, not req.files
        if (req.file) {
            updates.profilePic = req.file.path;
        }

        const updatedAdmin = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true,
            context: "query",
        }).select("-password");

        if (!updatedAdmin || updatedAdmin.role !== "admin") {
            return res.status(404).json({ message: "Admin not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Admin profile updated successfully",
            data: updatedAdmin,
        });
    } catch (err) {
        console.error("Error updating admin profile:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.changeAdminPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const admin = await User.findById(req.user._id);

        if (!admin || admin.role !== "admin") {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect current password" });
        }

        const isSameAsOld = await bcrypt.compare(newPassword, admin.password);
        if (isSameAsOld) {
            return res.status(400).json({ success: false, message: "New password cannot be the same as the old password" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        admin.password = hashedNewPassword;
        await admin.save();

        return res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (err) {
        console.error("Error changing admin password:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
