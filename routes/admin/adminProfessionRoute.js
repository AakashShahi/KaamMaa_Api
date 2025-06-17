const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/fileUpload");
const authenticateUser = require("../../middlewares/authorizedUser");
const profController = require("../../controllers/admin/professionManagementController");

// Create a new profession
router.post(
    "/create",
    upload.single("icon"), // expects a file field named 'icon'
    authenticateUser.authenticateUser,
    authenticateUser.isAdmin,
    profController.createProfession
);

// Get all professions
router.get(
    "/",
    authenticateUser.authenticateUser,
    authenticateUser.isAdmin,
    profController.getProfession
);

// Get a single profession by ID
router.get(
    "/:id",
    authenticateUser.authenticateUser,
    authenticateUser.isAdmin,
    profController.getOneProfession
);

// Update a profession
router.put(
    "/:id",
    upload.single("icon"), // allow updating icon if a new one is uploaded
    authenticateUser.authenticateUser,
    authenticateUser.isAdmin,
    profController.updateOneProfession
);

// Delete a profession
router.delete(
    "/:id",
    authenticateUser.authenticateUser,
    authenticateUser.isAdmin,
    profController.deleteOneProfession
);

module.exports = router;
