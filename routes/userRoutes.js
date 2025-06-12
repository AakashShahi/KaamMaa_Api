const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")

//route for register
router.post(
    "/register",
    userController.regiterUser
)

//route for login
router.post(
    "/login",
    userController.loginUser
)

module.exports = router