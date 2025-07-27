const Job = require("../../models/Job");

// @desc   Get all jobs
// @route  GET /api/jobs
exports.getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find()
            .populate("postedBy", "name email")
            .populate("assignedTo", "name email")
            .populate("category", "name icon category");

        res.status(200).json({
            success: true,
            count: jobs.length,
            data: jobs,
        });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// @desc   Delete a single job by ID
// @route  DELETE /api/jobs/:id
exports.deleteJobById = async (req, res) => {
    const { id } = req.params;

    try {
        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }

        await Job.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Job deleted successfully" });
    } catch (error) {
        console.error("Error deleting job:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// @desc   Delete all jobs (use with caution - admin-only route suggested)
// @route  DELETE /api/jobs
exports.deleteAllJobs = async (req, res) => {
    try {
        await Job.deleteMany();

        res.status(200).json({ success: true, message: "All jobs deleted successfully" });
    } catch (error) {
        console.error("Error deleting all jobs:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
