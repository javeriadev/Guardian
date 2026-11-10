
const express = require("express");

const router = express.Router();

const incidentController = require(
  "../controllers/incidentController"
);

const authenticateToken = require(
  "../middleware/authMiddleware"
);

// Protect all incident routes.
router.use(authenticateToken);

router.get('/active', incidentController.getActiveIncident);

// CREATE INCIDENT
router.post(
  "/",
  incidentController.createIncident
);

module.exports = router;
