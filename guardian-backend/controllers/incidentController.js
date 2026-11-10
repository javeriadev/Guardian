
const db = require("../db");

// ==========================================
// CREATE INCIDENT
// POST /api/incidents
// ==========================================

exports.createIncident = async (req, res) => {
  const userId = req.user.user_id;
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Lock this user's row to prevent two
    // simultaneous SOS requests creating duplicates.
    await connection.query(
      `SELECT user_id
       FROM USERS
       WHERE user_id = ?
       FOR UPDATE`,
      [userId]
    );

    // Check for an existing active incident.
    const [existing] = await connection.query(
      `SELECT incident_id, status, created_at
       FROM INCIDENTS
       WHERE user_id = ?
       AND status = 'ACTIVE'
       LIMIT 1`,
      [userId]
    );

    if (existing.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "You already have an active incident.",
        code: "ACTIVE_INCIDENT_EXISTS",
        incident: existing[0]
      });
    }

    // In-app SOS has no wearable device.
    // The database supplies the ACTIVE status
    // and creation timestamp defaults.
    const [result] = await connection.query(
      `INSERT INTO INCIDENTS
       (user_id, device_id, source)
       VALUES (?, NULL, 'APP')`,
      [userId]
    );

    // Retrieve the saved incident.
    const [incidents] = await connection.query(
      `SELECT
         incident_id,
         user_id,
         device_id,
         source,
         status,
         created_at,
         closed_at,
         resolution_type
       FROM INCIDENTS
       WHERE incident_id = ?
       AND user_id = ?`,
      [result.insertId, userId]
    );

    await connection.commit();

    return res.status(201).json({
      message: "SOS incident created successfully. Emergency contacts have not been notified.",
      incident: incidents[0]
    });

  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Incident rollback error:", rollbackError);
      }
    }

    console.error("Incident creation error:", error);

    return res.status(500).json({
      message: "Unable to create SOS incident. Please try again."
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.getActiveIncident = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const [incidents] = await db.query(
      `SELECT
         incident_id,
         user_id,
         device_id,
         source,
         status,
         created_at,
         closed_at,
         resolution_type
       FROM INCIDENTS
       WHERE user_id = ?
         AND status = 'ACTIVE'
       ORDER BY created_at DESC, incident_id DESC
       LIMIT 1`,
      [userId]
    );

    if (incidents.length === 0) {
      return res.status(200).json({
        active: false,
        incident: null
      });
    }

    return res.status(200).json({
      active: true,
      incident: incidents[0]
    });

  } catch (error) {
    console.error('Get active incident error:', error);

    return res.status(500).json({
      message: 'Unable to retrieve active incident.'
    });
  }
};
