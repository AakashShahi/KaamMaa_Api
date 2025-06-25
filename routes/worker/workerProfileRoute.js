const express = require("express");
const router = express.Router();
const authenticateUser = require("../../middlewares/authorizedUser");
const profileController = require("../../controllers/worker/workerController")
const upload = require("../../middlewares/fileUpload");

// Get profile of logged-in worker
router.get("/", authenticateUser.authenticateUser, authenticateUser.isWorker, profileController.getWorkerProfile);

// Update profile of logged-in worker
router.put("/", upload.fields([
    { name: "profile_pic", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
]), authenticateUser.authenticateUser, authenticateUser.isWorker, profileController.updateWorkerProfile);

// Change password for logged-in worker
router.put("/change-password", authenticateUser.authenticateUser, authenticateUser.isWorker, profileController.changeWorkerPassword);

// Apply for verification
router.post(
    "/apply-verification",
    authenticateUser.authenticateUser,
    authenticateUser.isWorker,
    profileController.applyForVerification
);

// Cancel verification request
router.post(
    "/cancel-verification",
    authenticateUser.authenticateUser,
    authenticateUser.isWorker,
    profileController.cancelVerificationRequest
);


module.exports = router;

