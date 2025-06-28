const express = require("express");
const router = express.Router();
const authorizeUser = require("../../middlewares/authorizedUser");
const professionController = require("../../controllers/customer/customerProfessionController");

// Get all professions
router.get("/", authorizeUser.authenticateUser, authorizeUser.isCustomer, professionController.getProfession);

module.exports = router;