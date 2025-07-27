const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/fileUpload");

const {
    getLoggedInUser,
    updateLoggedInUser,
} = require("../../controllers/customer/customerController");
const authenticate = require("../../middlewares/authorizedUser");

router.get("/me", authenticate.authenticateUser, authenticate.isCustomer, getLoggedInUser);
router.put("/me", upload.single("profile_Pic"), authenticate.authenticateUser, authenticate.isCustomer, updateLoggedInUser);

module.exports = router;