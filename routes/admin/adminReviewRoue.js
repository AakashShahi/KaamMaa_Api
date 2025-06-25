const express = require("express")
const router = express.Router()
const authenticateUser = require("../../middlewares/authorizedUser")
const reviewController = require("../../controllers/admin/reviewManagement")

router.get("/", authenticateUser.authenticateUser, authenticateUser.isAdmin, reviewController.getAllReviewsForAdmin)

router.delete("/delete/:reviewId", authenticateUser.authenticateUser, authenticateUser.isAdmin, reviewController.deleteReviewByAdmin)

module.exports = router