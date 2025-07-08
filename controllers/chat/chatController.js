const Chat = require("../../models/Chat");

exports.saveMessage = async (req, res) => {
    try {
        const { jobId, content } = req.body;
        const senderId = req.user._id; // <-- get senderId from authenticated user

        let chat = await Chat.findOne({ jobId });

        if (!chat) {
            chat = new Chat({
                jobId,
                participants: [senderId], // you may want to add others dynamically later
                messages: [],
            });
        } else if (!chat.participants.includes(senderId)) {
            chat.participants.push(senderId); // add sender if not participant yet
        }

        chat.messages.push({ senderId, content });
        await chat.save();

        res.status(200).json({ success: true, message: "Message saved", chat });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error saving message", error: err.message });
    }
};

exports.getChatHistory = async (req, res) => {
    try {
        const { jobId } = req.params;
        const chat = await Chat.findOne({ jobId })
            .populate("messages.senderId", "name profilePic role");

        if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

        // Sort messages by createdAt ascending
        chat.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        res.status(200).json({ success: true, chat });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching chat", error: err.message });
    }
};