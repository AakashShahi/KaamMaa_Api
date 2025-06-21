const Job = require("../../models/Job")
const Review = require("../../models/Review")

const ProfessionCategory = require("../../models/ProfessionCategory"); // ⬅️ Add this at the top if not already imported

exports.postPublicJob = async (req, res) => {
    try {
        const { category, description, location, time, date } = req.body;

        // Get the profession category to extract icon
        const profession = await ProfessionCategory.findById(category);
        if (!profession) {
            return res.status(404).json({ message: "Profession category not found" });
        }

        const job = new Job({
            postedBy: req.user._id,
            category,
            description,
            date,
            location,
            time,
            icon: profession.icon, // ✅ Set the icon from category
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
        if (job.assignedTo) return res.status(400).json({ message: "Job already assigned" });

        job.assignedTo = workerId;
        job.status = "assigned";
        await job.save();

        res.status(200).json({ message: "Job assigned. Waiting for worker to accept.", job });
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

exports.submitReview = async (req, res) => {
    try {
        const { jobId, rating, comment } = req.body;
        const job = await Job.findById(jobId);

        if (!job) return res.status(404).json({ message: "Job not found" });

        // Ensure the review is made by the job owner
        if (job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to review this job" });
        }

        // Check if review already exists
        if (job.review) {
            return res.status(400).json({ message: "Review already submitted" });
        }

        const newReview = new Review({
            jobId: job._id,
            workerId: job.assignedTo,
            customerId: req.user._id,
            rating,
            comment,
        });

        await newReview.save();

        job.status = "done";
        job.review = newReview._id;
        await job.save();

        res.status(200).json({
            message: "Review submitted successfully",
            review: newReview,
            jobId: job._id,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error submitting review", error: err.message });
    }
};

exports.getRequestedJobs = async (req, res) => {
    try {
        const jobs = await Job.find({
            postedBy: req.user._id,
            status: "requested",
            assignedTo: { $ne: null }
        })
            .populate("assignedTo", "name email location profilePic") // info about requesting worker
            .populate("category", "name")
            .sort({ createdAt: -1 });

        res.status(200).json(jobs);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch requested jobs", details: err.message });
    }
};

exports.getFailedJobsForCustomer = async (req, res) => {
    try {
        const jobs = await Job.find({
            postedBy: req.user._id,
            status: 'failed',
            deletedByCustomer: false
        })
            .populate("assignedTo", "name email")
            .populate("category", "name")
            .sort({ createdAt: -1 });

        res.status(200).json(jobs);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch failed jobs", error: err.message });
    }
};

//delete rejected job only for customer
exports.softDeleteJobByCustomer = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId);
        if (!job || job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: "Job not found or unauthorized" });
        }

        job.deletedByCustomer = true;
        await job.save();

        res.status(200).json({ message: "Job deleted from customer view" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /jobs/unassign/:jobId
exports.cancelJobAssignment = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId);
        if (!job || job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: "Job not found or unauthorized" });
        }

        if (!job.assignedTo || job.status === "open") {
            return res.status(400).json({ message: "Job is already unassigned or open." });
        }

        job.assignedTo = null;
        job.status = "open";
        await job.save();

        res.status(200).json({ message: "Job assignment cancelled. Job is now open.", job });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /jobs/:jobId
exports.deleteOpenJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId);
        if (!job || job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: "Job not found or unauthorized" });
        }

        if (job.status !== "open") {
            return res.status(400).json({ message: "Only open jobs can be deleted." });
        }

        await Job.findByIdAndDelete(jobId);
        res.status(200).json({ message: "Open job permanently deleted." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /jobs/open/customer
exports.getOpenJobsByCustomer = async (req, res) => {
    try {
        const jobs = await Job.find({
            postedBy: req.user._id,
            status: "open",
            deletedByCustomer: { $ne: true }
        })
            .populate("category", "name")
            .sort({ createdAt: -1 });

        res.status(200).json(jobs);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch open jobs", details: err.message });
    }
};

//get all rejected job
exports.getRejectedJobsForCustomer = async (req, res) => {
    try {
        const jobs = await Job.find({
            postedBy: req.user._id,
            status: "rejected",
            deletedByCustomer: false
        })
            .populate("assignedTo", "name email")
            .populate("category", "name")
            .sort({ createdAt: -1 });

        res.status(200).json(jobs);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch rejected jobs", error: err.message });
    }
};

exports.updateJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { category, description, location, time, date } = req.body;

        const job = await Job.findById(jobId);

        if (!job || job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: "Job not found or unauthorized" });
        }

        if (job.status !== "open") {
            return res.status(400).json({ message: "Only open jobs can be updated." });
        }

        // If category is updated, fetch the new icon
        if (category && category !== job.category.toString()) {
            const profession = await ProfessionCategory.findById(category);
            if (!profession) {
                return res.status(404).json({ message: "Profession category not found" });
            }
            job.category = category;
            job.icon = profession.icon;
        }

        if (description) job.description = description;
        if (location) job.location = location;
        if (time) job.time = time;
        if (date) job.date = date;

        await job.save();
        res.status(200).json({ message: "Job updated successfully", job });
    } catch (err) {
        res.status(500).json({ message: "Failed to update job", error: err.message });
    }
};