// CRUD
const User = require("../../models/User")
const bcrypt = require("bcrypt")

//Create
exports.createUsers = async (req, res) => {
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

    } catch (e) {
        return res.status(500).json(
            {
                "success": false,
                "message": "Server error"
            }
        )
    }
}

//Read All
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        return res.status(200).json(
            {
                "success": true,
                "message": "data fetched",
                "data": users
            }
        )
    } catch (error) {
        return res.status(500).json(

            {
                "success": false,
                "message": "Server error"
            }
        )
    }
}

//Read One
exports.getOneUser = async (req, res) => {
    try {
        const _id = req.params.id // use mongo id
        const user = await User.findById(_id)
        return res.status(200).json(
            {
                "success": true,
                "message": "One User found",
                "data": user
            }
        )
    } catch (error) {
        return res.status(500).json(
            {
                "success": false,
                "message": "Server error"
            }
        )
    }
}

//update 
exports.updateOneUser = async (req, res) => {
    const { name } = req.body
    const _id = req.params.id
    try {
        const user = await User.updateOne(
            {
                "_id": _id
            },
            {
                $set: {
                    "name": name
                }
            }
        )

        return res.status(200).json(
            {
                "success": true,
                "message": "One User Updated",
                "data": user
            }
        )
    } catch (error) {
        return res.status(500).json(
            {
                "success": false,
                "message": "Server error"
            }
        )
    }
}

//delete

exports.deleteOneUser = async (req, res) => {
    try {
        const _id = req.params.id
        const user = await User.deleteOne(
            {
                "_id": _id
            }
        )
        return res.status(200).json(
            {
                "success": true,
                "message": "One User deleted",
            }
        )

    } catch (error) {
        return res.status(500).json(
            {
                "success": false,
                "message": "Server error"
            }
        )
    }
}
