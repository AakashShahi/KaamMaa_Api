const express = require("express");
const router = express.Router();
const { saveMessage, getChatHistory } = require("../../controllers/chat/chatController");
const authenticate = require("../../middlewares/authorizedUser")

router.post("/message", authenticate.authenticateUser, saveMessage);
router.get("/:jobId", authenticate.authenticateUser, getChatHistory);

module.exports = router;