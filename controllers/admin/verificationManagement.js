const User = require("../../models/User"); // Adjust the path if needed

// Get all workers who have requested verification
exports.getVerificationRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [workers, total] = await Promise.all([
            User.find({
                role: "worker",
                verificationRequest: true,
                isVerified: false,
            })
                .select("-password")
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),

            User.countDocuments({
                role: "worker",
                verificationRequest: true,
                isVerified: false,
            }),
        ]);

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            data: workers,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                limit,
            },
        });
    } catch (error) {
        console.error("Error fetching verification requests:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Accept a worker's verification request
exports.acceptVerification = async (req, res) => {
    try {
        const { workerId } = req.params;

        const worker = await User.findById(workerId);
        if (!worker || worker.role !== "worker") {
            return res.status(404).json({ success: false, message: "Worker not found" });
        }

        worker.isVerified = true;
        worker.verificationRequest = false;
        await worker.save();

        res.status(200).json({ success: true, message: "Worker verified successfully" });
    } catch (error) {
        console.error("Error accepting verification:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Reject a worker's verification request
exports.rejectVerification = async (req, res) => {
    try {
        const { workerId } = req.params;

        const worker = await User.findById(workerId);
        if (!worker || worker.role !== "worker") {
            return res.status(404).json({ success: false, message: "Worker not found" });
        }

        worker.verificationRequest = false;
        worker.isVerified = false;
        await worker.save();

        res.status(200).json({ success: true, message: "Verification request rejected" });
    } catch (error) {
        console.error("Error rejecting verification:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
