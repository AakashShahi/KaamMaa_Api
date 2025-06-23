const express = require("express");
const router = express.Router();
const authenticateUser = require("../../middlewares/authorizedUser");
const profileController = require("../../controllers/worker/workerController")

// Get profile of logged-in worker
router.get("/", authenticateUser.authenticateUser, authenticateUser.isWorker, profileController.getWorkerProfile);

// Update profile of logged-in worker
router.put("/", authenticateUser.authenticateUser, authenticateUser.isWorker, profileController.updateWorkerProfile);

// Change password for logged-in worker
router.put("/change-password", authenticateUser.authenticateUser, authenticateUser.isWorker, profileController.changeWorkerPassword);

module.exports = router;

