const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const upload = require("../middlewares/fileUpload")

//route for register
router.post(
    "/register",
    upload.single("profile_pic"),
    userController.regiterUser
)

//route for login
router.post(
    "/login",
    userController.loginUser
)

router.post(
    "/request-reset",
    userController.sendResetLink
)

router.post(
    "/reset-password/:token",
    userController.resetPassword
)

module.exports = router