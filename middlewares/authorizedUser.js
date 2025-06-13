const jwt = require("jsonwebtoken")
const User = require("../models/User")

exports.authenticateUser = async (req, res, next) => {
    try {
        //Get token from header
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith("Bearer")) {
            return res.status(401).json(
                {
                    "sucess": false,
                    "message": "Auhthentication require"
                }
            )
        }
        const token = authHeader.split(" ")[1]// get token after Bearer prefix
        const decoded = jwt.verify(token, process.env.SECRET)
        const user = await User.findOne({ "_id": decoded._id })

        if (!user) {
            return res.status(401).json(
                {
                    "sucess": false,
                    "message": "Token mismatch"
                }
            )
        }

        //attach user to request for further use
        req.user = user
        next()//continue to next function

    } catch (error) {
        console.log(error);
        return res.status(500).json(
            {
                "sucess": false,
                "message": "Auhthentication failed"
            }
        )
    }
}

exports.isAdmin = async (req, res, next) => {
    if (req.user && req.user.role == "admin") {
        next()
    }
    else {
        return res.status(403).json(
            {
                "sucess": false,
                "message": "Admin privilage required"
            }
        )
    }
}

exports.isCustomer = async (req, res, next) => {
    if (req.user && req.user.role == "customer") {
        next()
    }
    else {
        return res.status(403).json(
            {
                "sucess": false,
                "message": "Customer privilage required"
            }
        )
    }
}