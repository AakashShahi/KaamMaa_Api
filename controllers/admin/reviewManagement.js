const Review = require("../../models/Review");

exports.getAllReviewsForAdmin = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    try {
        // Fetch all reviews first (no filter yet)
        let reviews = await Review.find({})
            .populate("workerId", "name email")
            .populate("customerId", "name email")
            .populate("jobId", "description date time icon location status")
            .sort({ createdAt: -1 });

        // Apply filtering manually after population
        if (search) {
            const regex = new RegExp(search, "i");
            reviews = reviews.filter((review) => {
                const commentMatch = regex.test(review.comment || "");
                const workerNameMatch = regex.test(review.workerId?.name || "");
                return commentMatch || workerNameMatch;
            });
        }

        const total = reviews.length;
        const paginatedReviews = reviews.slice((page - 1) * limit, page * limit);

        res.status(200).json({
            success: true,
            data: paginatedReviews,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch reviews",
            error: err.message,
        });
    }
};

exports.deleteReviewByAdmin = async (req, res) => {
    const { reviewId } = req.params;

    try {
        const deleted = await Review.findByIdAndDelete(reviewId);

        if (!deleted) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        res.status(200).json({ success: true, message: "Review permanently deleted." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to delete review", error: err.message });
    }
};
