const express = require("express");

const router = express.Router();

const emergencyContactController = require(
    "../controllers/emergencyContactController"
);

const authenticateToken = require("../middleware/authMiddleware");

// Protect all emergency contact routes
router.use(authenticateToken);

// CREATE
router.post(
    "/",
    emergencyContactController.createContact
);

// READ
router.get(
    "/",
    emergencyContactController.getContacts
);

// REORDER
router.put(
    "/reorder",
    emergencyContactController.reorderContacts
);

// UPDATE
router.put(
    "/:id",
    emergencyContactController.updateContact
);

// DELETE
router.delete(
    "/:id",
    emergencyContactController.deleteContact
);

module.exports = router;
