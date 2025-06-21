const express = require("express");
const router = express.Router();
const authenticateUser = require("../../middlewares/authorizedUser");

const jobController = require("../../controllers/customer/customerJobController");

// Post a new public job
router.post("/jobs", authenticateUser.authenticateUser, authenticateUser.isCustomer, jobController.postPublicJob);

// Get all open jobs for a customer
router.get("/jobs/open/customer", authenticateUser.authenticateUser, authenticateUser.isCustomer, jobController.getOpenJobsByCustomer);

// Get requested jobs (worker has requested, customer hasn't accepted yet)
router.get("/jobs/requested", authenticateUser.authenticateUser, authenticateUser.isCustomer, jobController.getRequestedJobs);

// Get failed jobs (not completed or rejected)
router.get("/jobs/failed", authenticateUser.authenticateUser, authenticateUser.isCustomer, jobController.getFailedJobsForCustomer);

// Get rejected jobs
router.get("/jobs/rejected", authenticateUser.authenticateUser, authenticateUser.isCustomer, jobController.getRejectedJobsForCustomer);

// Assign job manually to a worker
router.post("/jobs/assign", authenticateUser.authenticateUser, authenticateUser.isCustomer, jobController.assignJob);

// Accept worker for a public job (customer chooses a worker who requested)
router.post("/jobs/accept-worker", authenticateUser.authenticateUser, authenticateUser.isCustomer, jobController.acceptWorkerForJob);

// Submit a review after job completion
router.post("/jobs/review", authenticateUser.authenticateUser, authenticateUser.isCustomer, jobController.submitReview);

// Cancel assignment (make job open again)
router.put("/jobs/unassign/:jobId", authenticateUser.authenticateUser, authenticateUser.isCustomer, jobController.cancelJobAssignment);

// Soft delete rejected/failed job from customer's view
router.delete("/jobs/soft-delete/:jobId", authenticateUser.authenticateUser, authenticateUser.isCustomer, jobController.softDeleteJobByCustomer);

// Delete an open job (permanent)
router.delete("/jobs/:jobId", authenticateUser.authenticateUser, authenticateUser.isCustomer, jobController.deleteOpenJob);

module.exports = router;