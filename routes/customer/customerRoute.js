const express = require("express");
const router = express.Router();
const {
    getLoggedInUser,
    updateLoggedInUser,
} = require("../../controllers/customer/customerController");
const authenticate = require("../../middlewares/authorizedUser");

router.get("/me", authenticate.authenticateUser, authenticate.isCustomer, getLoggedInUser);
router.put("/me", authenticate.authenticateUser, authenticate.isCustomer, updateLoggedInUser);

module.exports = router;