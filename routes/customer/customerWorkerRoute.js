const express = require("express");
const router = express.Router();
const authorizeUser = require("../../middlewares/authorizedUser");
const workerController = require("../../controllers/customer/customerWorkerController");

router.get("/",
    authorizeUser.authenticateUser,
    authorizeUser.isCustomer,
    workerController.getMatchingWorkers)

module.exports = router;