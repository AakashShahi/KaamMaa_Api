const User = require("../../models/User");


exports.getMatchingWorkers = async (req, res) => {
    try {
        const { category } = req.query;

        if (!category) {
            return res.status(400).json({ error: "Category is required." });
        }

        // Fetch workers with populated profession
        const workers = await User.find({
            role: "worker",
            availability: true,
        }).populate("profession");


        const matchedWorkers = workers.filter(
            (worker) =>
                worker.profession &&
                worker.profession.category === category
        );

        return res.status(200).json({
            success: true,
            message: "Matching workers fetched successfully",
            data: matchedWorkers,
        });
    } catch (error) {
        console.error("Error fetching matching workers:", error);
        return res.status(500).json({ error: "Server error" });
    }
};