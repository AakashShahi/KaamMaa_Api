const User = require("../models/User")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer")

//Registration COntroller
exports.regiterUser = async (req, res) => {
    const { username, email, name, password, role, profession, skills, location, availability, certificateUrl, isVerified, phone } = req.body

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
                profilePic: profilePic,
                phone: phone
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

const transporter = nodemailer.createTransport(
    {
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    }
)

exports.sendResetLink = async (req, res) => {
    const { email } = req.body
    try {
        const user = await User.findOne({ email })
        if (!user) return res.status(404).json({
            success: false,
            message: "User not"
        })
        const token = jwt.sign({ id: user._id }, process.env.SECRET, { expiresIn: "15m" })
        const resetUrl = process.env.CLIENT_URL + "/reset/password/" + token
        const mailOptions = {
            from: `"My App" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Reset your password",
            html: `<p>Reset your password.. ${resetUrl}</p>`
        }
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log(err);
                return res.status(403).json({
                    success: false,
                    message: "Failed"
                })
            }
            if (info) console.log(info);
            return res.status(200).json({
                success: true,
                message: "Success"
            })
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}

exports.resetPassword = async (req, res) => {
    const { token } = req.params
    const { password } = req.body

    try {
        const decoded = jwt.verify(token, process.env.SECRET)
        const hased = await bcrypt.hash(password, 10)

        await User.findByIdAndUpdate(decoded.id, { password: hased })
        return res.status(200).json({ sucess: true, message: "Password updated" })
    } catch (error) {
        return res.status(500).json(
            { "success": false, "message": "Server error/Token invalid" }
        )
    }
}