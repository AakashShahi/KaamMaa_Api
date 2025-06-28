const Job = require("../../models/Job")
const Review = require("../../models/Review")

const ProfessionCategory = require("../../models/ProfessionCategory");

exports.postPublicJob = async (req, res) => {
    try {
        const { category, description, location, time, date } = req.body;

        // Check if date and time are valid and not in the past
        if (!date || !time) {
            return res.status(400).json({ success: false, message: "Date and time are required" });
        }

        // Combine date and time strings into a Date object
        const jobDateTime = new Date(`${date}T${time}`);

        // Get current date and time
        const now = new Date();

        // Check if jobDateTime is in the past
        if (jobDateTime < now) {
            return res.status(400).json({ success: false, message: "You cannot set a past date and time for the job" });
        }

        // Get the profession category to extract icon
        const profession = await ProfessionCategory.findById(category);
        if (!profession) {
            return res.status(404).json({ success: false, message: "Profession category not found" });
        }

        const job = new Job({
            postedBy: req.user._id,
            category,
            description,
            date,
            location,
            time,
            icon: profession.icon,
        });

        await job.save();
        res.status(201).json({
            success: true,
            data: job,
            message: "Job Posted Successfully"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to post Job", error: err.message });
    }
};

// Assign job to a worker (manual assignment)
exports.assignJob = async (req, res) => {
    try {
        const { jobId, workerId } = req.body;
        const job = await Job.findById(jobId);

        if (!job) return res.status(404).json({ success: false, message: "Job not found" });
        if (job.assignedTo) return res.status(400).json({ success: false, message: "Job already assigned" });

        job.assignedTo = workerId;
        job.status = "assigned";
        await job.save();

        res.status(200).json({ success: true, message: "Job assigned. Waiting for worker to accept.", data: job });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to assign job", error: err.message });
    }
};

// Accept worker request (for publicly posted jobs)
exports.acceptWorkerForJob = async (req, res) => {
    try {
        const { jobId, workerId } = req.body;

        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ success: false, message: "Job not found" });

        if (job.assignedTo && job.status !== "open") {
            return res.status(400).json({ success: false, message: "Job already taken" });
        }

        job.assignedTo = workerId;
        job.status = "in-progress";
        await job.save();

        res.status(200).json({ success: true, message: "Worker accepted", data: job });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message, message: "Failde to accept the job request" });
    }
};

exports.submitReview = async (req, res) => {
    try {
        const { jobId, rating, comment } = req.body;
        const job = await Job.findById(jobId);

        if (!job) return res.status(404).json({ success: false, message: "Job not found" });

        // Ensure the review is made by the job owner
        if (job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to review this job" });
        }

        // Check if review already exists
        if (job.review) {
            return res.status(400).json({ success: false, message: "Review already submitted" });
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
            data: newReview,
            jobId: job._id,
            success: true,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error submitting review", error: err.message });
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

        res.status(200).json({
            success: true,
            data: jobs,
            message: "Requested Job fetched succesfully"
        });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to fetch requested jobs", error: err.message });
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

        res.status(200).json({
            success: true,
            data: jobs,
            message: "Failed jobs fetched"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch failed jobs", error: err.message });
    }
};

//delete rejected job only for customer
exports.softDeleteJobByCustomer = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId);
        if (!job || job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(404).json({ success: false, message: "Job not found or unauthorized" });
        }

        job.deletedByCustomer = true;
        await job.save();

        res.status(200).json({ success: true, message: "Job deleted from customer view" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message, message: "Failed to delete jobs" });
    }
};

// PUT /jobs/unassign/:jobId
exports.cancelJobAssignment = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId);
        if (!job || job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(404).json({ success: false, message: "Job not found or unauthorized" });
        }

        if (!job.assignedTo || job.status === "open") {
            return res.status(400).json({ success: false, message: "Job is already unassigned or open." });
        }

        job.assignedTo = null;
        job.status = "open";
        await job.save();

        res.status(200).json({ success: true, message: "Job assignment cancelled. Job is now open.", data: job });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message, message: "Failed to cancel" });
    }
};

// DELETE /jobs/:jobId
exports.deleteOpenJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId);
        if (!job || job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(404).json({ success: false, message: "Job not found or unauthorized" });
        }

        if (job.status !== "open") {
            return res.status(400).json({ success: false, message: "Only open jobs can be deleted." });
        }

        await Job.findByIdAndDelete(jobId);
        res.status(200).json({ success: true, message: "Open job permanently deleted." });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message, message: "Failed to delete open job" });
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
            .populate("category", "name icon")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: jobs,
            message: "Successfully fetched open job"
        });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to fetch open jobs", error: err.message });
    }
};

exports.updateJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { category, description, location, time, date } = req.body;

        const job = await Job.findById(jobId);

        if (!job || job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(404).json({ success: false, message: "Job not found or unauthorized" });
        }

        if (job.status !== "open") {
            return res.status(400).json({ success: false, message: "Only open jobs can be updated." });
        }

        // If category is updated, fetch the new icon
        if (category && category !== job.category.toString()) {
            const profession = await ProfessionCategory.findById(category);
            if (!profession) {
                return res.status(404).json({ success: false, message: "Profession category not found" });
            }
            job.category = category;
            job.icon = profession.icon;
        }

        if (description) job.description = description;
        if (location) job.location = location;
        if (time) job.time = time;
        if (date) job.date = date;

        await job.save();
        res.status(200).json({ success: true, message: "Job updated successfully", data: job });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to update job", error: err.message });
    }
};