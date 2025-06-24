const express = require("express");
const router = express.Router();
const authenticateUser = require("../../middlewares/authorizedUser");

const jobController = require("../../controllers/worker/workerJobController");

// Get public jobs that match worker’s profession & location
router.get("/jobs/public", authenticateUser.authenticateUser, authenticateUser.isWorker, jobController.getPublicJobs);

// Worker requests to accept a public job
router.post("/jobs/public/:jobId/accept", authenticateUser.authenticateUser, authenticateUser.isWorker, jobController.acceptPublicJob);

// View assigned jobs (manually assigned, status: "assigned")
router.get("/jobs/assigned", authenticateUser.authenticateUser, authenticateUser.isWorker, jobController.getAssignedJobs);

// Worker cancels a requested job
router.patch("/jobs/requested/cancel/:jobId", authenticateUser.authenticateUser, authenticateUser.isWorker, jobController.cancelRequestedJob);

// View requested jobs (status: "requested")
router.get("/jobs/requested", authenticateUser.authenticateUser, authenticateUser.isWorker, jobController.getRequestedJobs);


// Worker accepts manually assigned job
router.put("/jobs/assigned/:jobId/accept", authenticateUser.authenticateUser, authenticateUser.isWorker, jobController.acceptAssignedJob);

// Worker rejects manually assigned job
router.put("/jobs/assigned/:jobId/reject", authenticateUser.authenticateUser, authenticateUser.isWorker, jobController.rejectAssignedJob);

// View in-progress jobs (status: "in-progress")
router.get("/jobs/in-progress", authenticateUser.authenticateUser, authenticateUser.isWorker, jobController.getInProgressJobs);

// View failed jobs
router.get("/jobs/failed", authenticateUser.authenticateUser, authenticateUser.isWorker, jobController.getFailedJobsForWorker);

// Soft delete job (hide from worker view)
router.delete("/jobs/:jobId/soft-delete", authenticateUser.authenticateUser, authenticateUser.isWorker, jobController.softDeleteJobByWorker);

router.get(
    "/jobs/completed",
    authenticateUser.authenticateUser,
    authenticateUser.isWorker,
    jobController.getCompletedJobs
);

module.exports = router;
