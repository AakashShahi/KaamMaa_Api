const Job = require("../../models/Job");
const ProfessionCategory = require("../../models/ProfessionCategory");

// Worker sees available public jobs
exports.getPublicJobs = async (req, res) => {
    try {
        const worker = req.user;

        if (!worker.profession || !worker.location) {
            return res.status(400).json({
                message: "Worker must have both profession and location set to see matching jobs.",
            });
        }

        const filter = {
            assignedTo: null,
            status: "open",
            category: worker.profession,
            location: { $regex: worker.location, $options: "i" }, // fuzzy match for city/area
        };

        const publicJobs = await Job.find(filter)
            .populate("category", "name")
            .populate("postedBy", "name location")
            .sort({ createdAt: -1 });

        res.status(200).json(publicJobs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch matching jobs", details: err.message });
    }
};

// Worker requests to accept a public job
exports.acceptPublicJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await Job.findById(jobId);

        if (!job || job.status !== "open" || job.assignedTo) {
            return res.status(400).json({ message: "Job is not available for acceptance." });
        }

        job.assignedTo = req.user._id;
        job.status = "requested";
        await job.save();

        res.status(200).json({ message: "Job request sent. Awaiting customer approval.", job });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// View assigned jobs
exports.getAssignedJobs = async (req, res) => {
    try {
        const jobs = await Job.find({
            assignedTo: req.user._id,
            status: "assigned",
            deletedByWorker: false
        })
            .populate("postedBy", "name location")
            .populate("category", "name")
            .sort({ createdAt: -1 });

        res.status(200).json(jobs);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch assigned jobs", error: err.message });
    }
};

// Get in-progress jobs (status: "in-progress")
exports.getInProgressJobs = async (req, res) => {
    try {
        const jobs = await Job.find({
            assignedTo: req.user._id,
            status: "in-progress",
            deletedByWorker: false
        })
            .populate("postedBy", "name location")
            .populate("category", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json(
            {
                success: true,
                message: "In progress Jobs fetched successfully",
                data: jobs
            }
        );
    } catch (err) {
        return res.status(500).json({ message: "Failed to fetch in-progress jobs", error: err.message });
    }
};

// Worker accepts a job that was assigned to them manually
exports.acceptAssignedJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await Job.findById(jobId);

        if (!job || job.status !== "assigned") {
            return res.status(400).json({ message: "No assigned job found to accept." });
        }

        if (job.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized for this job." });
        }

        job.status = "in-progress";
        await job.save();

        res.status(200).json({ message: "Job accepted and now in progress", job });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Worker rejects an assigned job
exports.rejectAssignedJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await Job.findById(jobId);

        if (!job || job.status !== "assigned") {
            return res.status(400).json({ message: "No assigned job found to reject." });
        }

        if (job.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized for this job." });
        }

        job.status = "rejected";
        job.assignedTo = null;
        await job.save();

        res.status(200).json({ message: "Job rejected", job });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFailedJobsForWorker = async (req, res) => {
    try {
        const jobs = await Job.find({
            assignedTo: req.user._id,
            status: 'failed',
            deletedByWorker: false
        })
            .populate("postedBy", "name email")
            .populate("category", "name")
            .sort({ createdAt: -1 });

        res.status(200).json(jobs);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch failed jobs", error: err.message });
    }
};

exports.softDeleteJobByWorker = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId);
        if (!job || job.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: "Job not found or unauthorized" });
        }

        job.deletedByWorker = true;
        await job.save();

        res.status(200).json({ message: "Job deleted from worker view" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};