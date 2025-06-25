const express = require("express");
const router = express.Router();
const authenticateUser = require("../../middlewares/authorizedUser");

const reviewController = require("../../controllers/worker/workerReviewController")

router.get(
    "/",
    authenticateUser.authenticateUser,
    authenticateUser.isWorker,
    reviewController.getWorkerReviews
);

// Soft delete a specific review by the worker
router.delete(
    "/delete/:reviewId",
    authenticateUser.authenticateUser,
    authenticateUser.isWorker,
    reviewController.softDeleteReviewByWorker
);

module.exports = router;