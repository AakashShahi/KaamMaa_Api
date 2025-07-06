const express = require("express");
const router = express.Router();
const { saveMessage, getChatHistory } = require("../../controllers/chat/chatController");

router.post("/message", saveMessage);
router.get("/:jobId", getChatHistory);

module.exports = router;