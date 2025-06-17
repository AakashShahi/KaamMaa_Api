const Profession = require("../../models/ProfessionCategory");

// Create Profession
exports.createProfession = async (req, res) => {
    const { name, category, description } = req.body;

    try {
        const existingProfession = await Profession.findOne({ name });

        if (existingProfession) {
            return res.status(400).json({
                success: false,
                message: "Profession already exists",
            });
        }

        const icon = req.file?.path;

        const newProfession = new Profession({
            name,
            icon,
            category,
            description,
        });

        await newProfession.save();

        return res.status(201).json({
            success: true,
            message: `Profession "${name}" added successfully`,
            data: newProfession
        });
    } catch (e) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: e.message
        });
    }
};

// Get All Professions
exports.getProfession = async (req, res) => {
    try {
        const professions = await Profession.find();
        return res.status(200).json({
            success: true,
            message: "Professions fetched successfully",
            data: professions
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Get One Profession by ID
exports.getOneProfession = async (req, res) => {
    try {
        const _id = req.params.id;
        const profession = await Profession.findById(_id);

        if (!profession) {
            return res.status(404).json({
                success: false,
                message: "Profession not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profession fetched successfully",
            data: profession
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Update One Profession
exports.updateOneProfession = async (req, res) => {
    const _id = req.params.id;
    const { name, category, description } = req.body;
    const icon = req.file?.path;

    try {
        const updatedProfession = await Profession.findByIdAndUpdate(
            _id,
            {
                name,
                category,
                description,
                ...(icon && { icon })
            },
            { new: true } // return updated document
        );

        if (!updatedProfession) {
            return res.status(404).json({
                success: false,
                message: "Profession not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profession updated successfully",
            data: updatedProfession
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Delete One Profession
exports.deleteOneProfession = async (req, res) => {
    const _id = req.params.id;

    try {
        const deleted = await Profession.findByIdAndDelete(_id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Profession not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profession deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};
