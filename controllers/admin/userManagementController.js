const User = require("../../models/User")
const bcrypt = require("bcrypt")

// Create User
exports.createUsers = async (req, res) => {
    const {
        username, email, name, password, role, profession,
        skills, location, availability, certificateUrl, isVerified, phone
    } = req.body;

    try {
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email or username already in use"
            });
        }

        const hashedPass = await bcrypt.hash(password, 10);
        const profilePic = req.file?.path;

        const newUser = new User({
            username,
            name,
            email,
            password: hashedPass,
            role,
            profession,
            skills,
            location,
            availability,
            certificateUrl,
            isVerified,
            profilePic,
            phone
        });

        await newUser.save();

        return res.status(201).json({
            success: true,
            message: `${role} registered`,
            data: newUser
        });

    } catch (e) {
        console.log(e);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: e.message
        });
    }
};

// Get All Users with Pagination
exports.getUsers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    const searchQuery = search
        ? {
            $or: [
                { username: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { name: { $regex: search, $options: "i" } }
            ]
        }
        : {};

    try {
        const [users, total] = await Promise.all([
            User.find(searchQuery).populate("profession", "category").skip(skip).limit(limit),
            User.countDocuments(searchQuery)
        ]);

        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data: users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};



// Get One User
exports.getOneUser = async (req, res) => {
    try {
        const _id = req.params.id;
        const user = await User.findById(_id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User found",
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Update One User
exports.updateOneUser = async (req, res) => {
    const _id = req.params.id;
    const updateData = {
        ...req.body,
        ...(req.file?.path && { profilePic: req.file.path })
    };

    try {
        const user = await User.findByIdAndUpdate(_id, updateData, { new: true });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Delete One User
exports.deleteOneUser = async (req, res) => {
    const _id = req.params.id;

    try {
        const user = await User.findByIdAndDelete(_id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};
