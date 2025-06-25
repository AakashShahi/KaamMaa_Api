const express = require("express")
const router = express.Router()
const authenticateUser = require("../../middlewares/authorizedUser")
const verificationController = require("../../controllers/admin/verificationManagement")

router.get("/worker", authenticateUser.authenticateUser, authenticateUser.isAdmin, verificationController.getVerificationRequests);
router.post("/worker/accept/:workerId", authenticateUser.authenticateUser, authenticateUser.isAdmin, verificationController.acceptVerification);
router.post("/worker/reject/:workerId", authenticateUser.authenticateUser, authenticateUser.isAdmin, verificationController.rejectVerification);

module.exports = router