const Chat = require("../../models/Chat");

exports.saveMessage = async (req, res) => {
    try {
        const { jobId, content } = req.body;
        const senderId = req.user._id; // This is the actual user ID (string)

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
            senderId, // This is the string ID
            content,
        });

        await chat.save();

        // --- NEW: Fetch the newly saved message with populated sender details ---
        // Find the chat again, but this time populate the last message's senderId
        // This ensures the emitted message has the same structure as history messages
        const updatedChat = await Chat.findOne({ jobId }).populate({
            path: 'messages.senderId',
            select: 'name profilePic role _id' // Select the fields needed by Flutter
        });

        // Get the last message, which is the one just saved
        const newMessage = updatedChat.messages[updatedChat.messages.length - 1];

        // --- NEW: Emit the fully populated message via Socket.IO ---
        // Access the `io` instance from the Express app
        const io = req.app.get("io");
        if (io) {
            io.to(jobId).emit("receiveMessage", {
                jobId: jobId,
                content: newMessage.content,
                senderId: newMessage.senderId, // This is now the populated user object
                createdAt: newMessage.createdAt,
                _id: newMessage._id // Include message ID if needed by client
            });
            console.log(`📡 Emitted new message to room ${jobId}:`, newMessage.content);
        } else {
            console.warn("Socket.IO instance not found on app. Skipping real-time emit.");
        }
        // --- END NEW ---

        res.status(200).json({
            success: true,
            message: "Message saved",
            chat: updatedChat, // Respond with the updated chat, including populated sender
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
            "name profilePic role _id" // Ensure _id is selected for consistency
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