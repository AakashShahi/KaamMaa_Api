const Job = require("../../models/Job")
const User = require("../../models/User")

// Post a new job
exports.postJob = async (req, res) => {
    try {
        const { category, description, location, time } = req.body;
        const job = new Job({
            postedBy: req.user._id,
            category,
            description,
            location,
            time,
        });
        await job.save();
        res.status(201).json(job);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Assign job to a worker (manual assignment)
exports.assignJob = async (req, res) => {
    try {
        const { jobId, workerId } = req.body;
        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ message: "Job not found" });

        job.assignedTo = workerId;
        job.status = "in-progress";
        await job.save();

        res.status(200).json(job);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Accept worker request (for publicly posted jobs)
exports.acceptWorkerForJob = async (req, res) => {
    try {
        const { jobId, workerId } = req.body;

        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ message: "Job not found" });

        if (job.assignedTo && job.status !== "open") {
            return res.status(400).json({ message: "Job already taken" });
        }

        job.assignedTo = workerId;
        job.status = "in-progress";
        await job.save();

        res.status(200).json({ message: "Worker accepted", job });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Submit review after job is done
exports.submitReview = async (req, res) => {
    try {
        const { jobId, rating, comment } = req.body;
        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ message: "Job not found" });

        if (job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        job.status = "done";
        job.review = { rating, comment };
        await job.save();

        res.status(200).json({ message: "Review added", job });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
