const Review = require("../../models/Review");

exports.getWorkerReviews = async (req, res) => {
    const workerId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const filter = {
            workerId,
            $or: [{ deletedByWorker: false }, { deletedByWorker: { $exists: false } }],
        };

        const total = await Review.countDocuments(filter);
        const reviews = await Review.find(filter)
            .populate("jobId", "description date time icon location")
            .populate("customerId", "name")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: reviews,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch reviews", error: err.message });
    }
};

exports.softDeleteReviewByWorker = async (req, res) => {
    const { reviewId } = req.params;

    try {
        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        review.deletedByWorker = true;
        await review.save();

        res.status(200).json({ message: "Review marked as deleted by worker." });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete review", error: err.message });
    }
};

