const express = require("express");
const router = express.Router();
const authenticateUser = require("../../middlewares/authorizedUser");
const adminJobController = require("../../controllers/admin/adminJobController");

// Get all jobs
router.get(
    "/",
    authenticateUser.authenticateUser,
    authenticateUser.isAdmin,
    adminJobController.getAllJobs
);

// Delete a single job by ID
router.delete(
    "/:id",
    authenticateUser.authenticateUser,
    authenticateUser.isAdmin,
    adminJobController.deleteJobById
);

// Delete all jobs (admin-only route)
router.delete(
    "/",
    authenticateUser.authenticateUser,
    authenticateUser.isAdmin,
    adminJobController.deleteAllJobs
);

module.exports = router;