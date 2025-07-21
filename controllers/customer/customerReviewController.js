const Review = require("../../models/Review");

exports.getCustomerReviews = async (req, res) => {
    try {
        const reviews = await Review.find({
            customerId: req.user._id,
            deletedByCustomer: false,
        })
            .select("jobId workerId rating comment createdAt updatedAt")
            .populate({
                path: "workerId",
                select: "name phone",
            });

        res.status(200).json({
            success: true,
            message: "Customer reviews fetched successfully",
            data: reviews,
        });
    } catch (error) {
        console.error("Error fetching customer reviews:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch customer reviews",
            data: [],
        });
    }
};

exports.deleteCustomerReview = async (req, res) => {
    try {
        const review = await Review.findOne({
            _id: req.params.id,
            customerId: req.user._id,
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
                data: null,
            });
        }

        review.deletedByCustomer = true;
        await review.save();

        res.status(200).json({
            success: true,
            message: "Review deleted successfully",
            data: review,
        });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete review",
            data: null,
        });
    }
};

exports.deleteAllCustomerReviews = async (req, res) => {
    try {
        const result = await Review.updateMany(
            { customerId: req.user._id },
            { $set: { deletedByCustomer: true } }
        );

        res.status(200).json({
            success: true,
            message: "All customer reviews deleted successfully",
            data: result,
        });
    } catch (error) {
        console.error("Error deleting all customer reviews:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete all reviews",
            data: null,
        });
    }
};
