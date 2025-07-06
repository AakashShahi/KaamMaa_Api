const Chat = require("../../models/Chat");

exports.saveMessage = async (req, res) => {
    try {
        const { jobId, senderId, content } = req.body;

        let chat = await Chat.findOne({ jobId });

        if (!chat) {
            chat = new Chat({
                jobId,
                participants: [senderId], // you can push customer/worker dynamically too
                messages: []
            });
        }

        chat.messages.push({ senderId, content });
        await chat.save();

        res.status(200).json({ success: true, message: "Message saved", chat });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error saving message", error: err.message });
    }
};

exports.getChatHistory = async (req, res) => {
    try {
        const { jobId } = req.params;
        const chat = await Chat.findOne({ jobId })
            .populate("messages.senderId", "name profilePic role")
            .sort({ createdAt: 1 });

        res.status(200).json({ success: true, chat });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching chat", error: err.message });
    }
};