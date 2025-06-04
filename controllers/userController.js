const User = require("../models/User")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

exports.regiterUser = async (req, res) => {
    const { username, email, firstName, lastName, password, role, profession, skills, location, availability, certificateUrl, isVerified, profilePic } = req.body

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

        const newUser = new User(
            {
                username,
                firstName,
                lastName,
                email,
                password: hashedPass,
                role,
                profession,
                skills,
                location,
                availability,
                certificateUrl,
                isVerified,
                profilePic
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