const express = require("express");
const router = express.Router();
const authenticateUser = require("../../middlewares/authorizedUser");
const professionController = require("../../controllers/worker/workerProfessionController")

router.get(
    "/",
    authenticateUser.authenticateUser,
    authenticateUser.isWorker,
    professionController.getProfession
)
module.exports = router