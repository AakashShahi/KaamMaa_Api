const express = require("express");
const router = express.Router();
const ReviewController = require("../../controllers/customer/customerReviewController");
const authenticate = require("../../middlewares/authorizedUser");

router.get("/", authenticate.authenticateUser, authenticate.isCustomer, ReviewController.getCustomerReviews);
router.delete("/:id", authenticate.authenticateUser, authenticate.isCustomer, ReviewController.deleteCustomerReview);
router.delete("/", authenticate.authenticateUser, authenticate.isCustomer, ReviewController.deleteAllCustomerReviews);

module.exports = router;