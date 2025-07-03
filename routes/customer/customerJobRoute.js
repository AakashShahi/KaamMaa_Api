const express = require("express");
const router = express.Router();
const authorizeUser = require("../../middlewares/authorizedUser");

const jobController = require("../../controllers/customer/customerJobController");

// Post a new public job------------------
router.post("/jobs", authorizeUser.authenticateUser, authorizeUser.isCustomer, jobController.postPublicJob);

// Get all open jobs for a customer-----------------
router.get("/jobs/open", authorizeUser.authenticateUser, authorizeUser.isCustomer, jobController.getOpenJobsByCustomer);

// Get requested jobs (worker has requested, customer hasn't accepted yet)
router.get("/jobs/requested", authorizeUser.authenticateUser, authorizeUser.isCustomer, jobController.getRequestedJobs);

// Get failed jobs (not completed or rejected)
router.get("/jobs/failed", authorizeUser.authenticateUser, authorizeUser.isCustomer, jobController.getFailedJobsForCustomer);

// Assign job manually to a worker---------------------
router.post("/jobs/assign", authorizeUser.authenticateUser, authorizeUser.isCustomer, jobController.assignJob);

// Accept worker for a public job (customer chooses a worker who requested)
router.post("/jobs/accept-worker", authorizeUser.authenticateUser, authorizeUser.isCustomer, jobController.acceptWorkerForJob);

// Reject worker for a public job (customer reject a worker who requested)
router.post("/jobs/reject-worker", authorizeUser.authenticateUser, authorizeUser.isCustomer, jobController.rejectWorkerForJob);

// Submit a review after job completion
router.post("/jobs/review", authorizeUser.authenticateUser, authorizeUser.isCustomer, jobController.submitReview);

// Cancel assignment (make job open again)
router.put("/jobs/unassign/:jobId", authorizeUser.authenticateUser, authorizeUser.isCustomer, jobController.cancelJobAssignment);

// Soft delete rejected/failed job from customer's view
router.delete("/jobs/soft-delete/:jobId", authorizeUser.authenticateUser, authorizeUser.isCustomer, jobController.softDeleteJobByCustomer);

// Delete an open job (permanent)
router.delete("/jobs/:jobId", authorizeUser.authenticateUser, authorizeUser.isCustomer, jobController.deleteOpenJob);

router.get("/jobs/assigned", authorizeUser.authenticateUser, authorizeUser.isCustomer, jobController.getAssignedJobsForCustomer)

router.get("/jobs/in-progress", authorizeUser.authenticateUser, authorizeUser.isCustomer, jobController.getInProgressJobsForCustomer)

module.exports = router;