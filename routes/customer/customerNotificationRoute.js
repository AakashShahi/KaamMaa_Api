const express = require("express");
const router = express.Router();
const authorizeUser = require("../../middlewares/authorizedUser");
const notController = require("../../controllers/customer/customerNotificationController");

// Get all notifications for a customer
router.get("/notifications", authorizeUser.authenticateUser, authorizeUser.isCustomer, notController.getNotifications);

module.exports = router;