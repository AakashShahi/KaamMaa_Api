const Chat = require("../../models/Chat");

exports.saveMessage = async (req, res) => {
    try {
        const { jobId, content } = req.body;
        const senderId = req.user._id;

        // Find chat by jobId
        let chat = await Chat.findOne({ jobId });

        // If chat doesn't exist, create one
        if (!chat) {
            chat = new Chat({
                jobId,
                participants: [senderId],
                messages: [],
            });
        } else {
            // Add sender to participants if not already included
            const isAlreadyParticipant = chat.participants.some(id =>
                id.equals(senderId)
            );
            if (!isAlreadyParticipant) {
                chat.participants.push(senderId);
            }
        }

        // Add new message
        chat.messages.push({
            senderId,
            content,
        });

        await chat.save();

        res.status(200).json({
            success: true,
            message: "Message saved",
            chat,
        });
    } catch (err) {
        console.error("❌ Error saving message:", err);
        res.status(500).json({
            success: false,
            message: "Error saving message",
            error: err.message,
        });
    }
};

exports.getChatHistory = async (req, res) => {
    try {
        const { jobId } = req.params;

        const chat = await Chat.findOne({ jobId }).populate(
            "messages.senderId",
            "name profilePic role"
        );

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found",
            });
        }

        // Sort messages by createdAt (oldest first)
        chat.messages.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        res.status(200).json({
            success: true,
            chat,
        });
    } catch (err) {
        console.error("❌ Error fetching chat:", err);
        res.status(500).json({
            success: false,
            message: "Error fetching chat",
            error: err.message,
        });
    }
};
