const User = require("../../models/User")
const bcrypt = require("bcrypt")

exports.getWorkerProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user || user.role !== "worker") {
            return res.status(404).json({ message: "Worker not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Successfully fetched worker",
            data: user
        });
    } catch (err) {
        console.error("Error getting worker profile:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.updateWorkerProfile = async (req, res) => {
    try {
        const allowedUpdates = [
            "name", "skills", "location", "availability",
            "certificateUrl", "phone", "profilePic", "profession"
        ];

        const updates = {};
        for (let key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
            new: true,
            runValidators: true,
            context: "query"
        }).select("-password");

        if (!updatedUser || updatedUser.role !== "worker") {
            return res.status(404).json({ message: "Worker not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Worker details updated",
            data: updatedUser
        });
    } catch (err) {
        console.error("Error updating worker profile:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.changeWorkerPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);
        if (!user || user.role !== "worker") {
            return res.status(404).json({ success: false, message: "Worker not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect current password" });
        }

        const isSameAsOld = await bcrypt.compare(newPassword, user.password);
        if (isSameAsOld) {
            return res.status(400).json({ success: false, message: "New password cannot be the same as the old password" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedNewPassword;
        await user.save();

        return res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (err) {
        console.error("Error changing password:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
