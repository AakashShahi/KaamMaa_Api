const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")

router.post(
    "/register",
    userController.regiterUser
)

router.post(
    "/login",
    userController.loginUser
)

module.exports = router