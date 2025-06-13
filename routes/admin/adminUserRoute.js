const express = require("express")
const router = express.Router()
const upload = require("../../middlewares/fileUpload")
const authenticateUser = require("../../middlewares/authorizedUser")
const userController = require("../../controllers/admin/userManagementController")

router.post(
    "/create",
    upload.single("profile_pic"),
    authenticateUser.authenticateUser,
    authenticateUser.isAdmin,
    userController.createUsers
)

router.get(
    "/",
    authenticateUser.authenticateUser,
    authenticateUser.isAdmin,
    userController.getUsers
)

router.get(
    "/:id",// req.params.id
    authenticateUser.authenticateUser,
    authenticateUser.isAdmin,
    userController.getOneUser
)

router.put(
    "/:id",
    authenticateUser.authenticateUser,
    authenticateUser.isAdmin,
    userController.updateOneUser
)

router.delete(
    "/:id",
    authenticateUser.authenticateUser,
    authenticateUser.isAdmin,
    userController.deleteOneUser
)

module.exports = router