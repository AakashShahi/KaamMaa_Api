const User = require("../models/User")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

//Registration COntroller
exports.regiterUser = async (req, res) => {
    const { username, email, name, password, role, profession, skills, location, availability, certificateUrl, isVerified } = req.body

    try {
        const existingUser = await User.findOne(
            {
                $or: [{ username: username }, { email: email }]
            }
        )

        if (existingUser) {
            return res.status(400).json(
                {
                    "success": false, "message": "Email or username already in use"
                }
            )
        }

        const hashedPass = await bcrypt.hash(password, 10)
        const profilePic = req.file?.path


        const newUser = new User(
            {
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
                profilePic: profilePic
            }
        )

        await newUser.save()

        return res.status(200).json(
            { "success": true, "message": `${role} registered` }
        )

    } catch (error) {
        console.log(error);
        return res.status(500).json(
            { "success": false, "message": "Server Error" }
        )

    }
}

// Login COntroller
exports.loginUser = async (req, res) => {
    const { email, password, username } = req.body
    if (!password || (!email && !username)) {
        return res.status(400).json(
            {
                "success": false,
                "message": "Missing field"
            }
        )
    }
    try {
        const getUser = await User.findOne(
            {
                $or: [{ "email": email }, { "username": username }]
            }
        )

        if (!getUser) {
            return res.status(400).json(
                { "success": false, "message": "User not found" }
            )


        }

        const passwordCheck = await bcrypt.compare(password, getUser.password)
        if (!passwordCheck) {
            return res.status(400).json(
                { "success": false, "message": "Invalid Credentials" }
            )

        }

        const payload = {
            "_id": getUser._id,
            "email": getUser.email,
            "username": getUser.username,
            "name": getUser.name,

        }

        const token = jwt.sign(payload, process.env.SECRET, { expiresIn: "7d" })
        return res.status(200).json(
            {
                "success": true,
                "message": "Login Successful",
                "data": getUser,
                "token": token
            }
        )

    } catch (error) {
        return res.status(500).json(
            { "success": false, "message": "Server error" }
        )
    }
}