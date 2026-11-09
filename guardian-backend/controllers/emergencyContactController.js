const db = require("../db");

// Maximum number of emergency contacts
const MAX_CONTACTS = 5;

// ------------------------------------------
// HELPER: Validate contact name
// ------------------------------------------

function validateName(name) {
    return (
        typeof name === "string" &&
        name.trim().length > 0 &&
        name.trim().length <= 150
    );
}

// ------------------------------------------
// HELPER: Normalize Pakistani phone number
// ------------------------------------------

function normalizePhone(phone) {
    if (typeof phone !== "string") {
        return null;
    }

    // Remove spaces, hyphens and brackets
    let cleaned = phone.replace(/[\s\-()]/g, "");

    // Local format: 03XXXXXXXXX
    if (/^03\d{9}$/.test(cleaned)) {
        cleaned = "+92" + cleaned.substring(1);
    }

    // International format: 923XXXXXXXXX
    else if (/^923\d{9}$/.test(cleaned)) {
        cleaned = "+" + cleaned;
    }

    // International format: +923XXXXXXXXX
    else if (/^\+923\d{9}$/.test(cleaned)) {
        // Already normalized
    }

    else {
        return null;
    }

    return cleaned;
}

// ------------------------------------------
// HELPER: Get authenticated user's contacts
// ------------------------------------------

async function getUserContacts(userId) {
    const [contacts] = await db.query(
        `SELECT
            contact_id,
            contact_name,
            phone_number,
            priority,
            created_at,
            updated_at
         FROM EMERGENCY_CONTACTS
         WHERE user_id = ?
         ORDER BY priority ASC`,
        [userId]
    );

    return contacts;
}

// ------------------------------------------
// HELPER: Return database errors
// ------------------------------------------

function handleDatabaseError(error, res) {
    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            message: "Duplicate contact phone number or priority."
        });
    }

    console.error("Emergency contact error:", error);

    return res.status(500).json({
        message: "Internal server error."
    });
}

// ==========================================
// CREATE CONTACT
// POST /api/emergency-contacts
// ==========================================

exports.createContact = async (req, res) => {
    const userId = req.user.user_id;
    const { contact_name, phone_number } = req.body || {};

    // Validate contact name
    if (!validateName(contact_name)) {
        return res.status(400).json({
            message: "Contact name is required and must not exceed 150 characters."
        });
    }

    // Validate phone number
    const normalizedPhone = normalizePhone(phone_number);

    if (!normalizedPhone) {
        return res.status(400).json({
            message: "Enter a valid Pakistani mobile number."
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Lock user row to serialize contact changes
        await connection.query(
            "SELECT user_id FROM USERS WHERE user_id = ? FOR UPDATE",
            [userId]
        );

        // Count user's existing contacts
        const [countRows] = await connection.query(
            `SELECT COUNT(*) AS total
             FROM EMERGENCY_CONTACTS
             WHERE user_id = ?`,
            [userId]
        );

        const total = countRows[0].total;

        if (total >= MAX_CONTACTS) {
            await connection.rollback();

            return res.status(400).json({
                message: "You can add a maximum of 5 emergency contacts."
            });
        }

        // Check duplicate phone number
        const [duplicates] = await connection.query(
            `SELECT contact_id
             FROM EMERGENCY_CONTACTS
             WHERE user_id = ?
             AND phone_number = ?`,
            [userId, normalizedPhone]
        );

        if (duplicates.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                message: "This phone number is already in your emergency contacts."
            });
        }

        // New contact automatically gets next priority
        const nextPriority = total + 1;

        const [result] = await connection.query(
            `INSERT INTO EMERGENCY_CONTACTS
             (user_id, contact_name, phone_number, priority)
             VALUES (?, ?, ?, ?)`,
            [
                userId,
                contact_name.trim(),
                normalizedPhone,
                nextPriority
            ]
        );

        await connection.commit();

        return res.status(201).json({
            message: "Emergency contact added successfully.",
            contact: {
                contact_id: result.insertId,
                contact_name: contact_name.trim(),
                phone_number: normalizedPhone,
                priority: nextPriority
            }
        });

    } catch (error) {
        await connection.rollback();
        return handleDatabaseError(error, res);

    } finally {
        connection.release();
    }
};

// ==========================================
// READ CONTACTS
// GET /api/emergency-contacts
// ==========================================

exports.getContacts = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const contacts = await getUserContacts(userId);

        return res.status(200).json({
            message: "Emergency contacts retrieved successfully.",
            total: contacts.length,
            contacts: contacts
        });

    } catch (error) {
        return handleDatabaseError(error, res);
    }
};

// ==========================================
// UPDATE CONTACT
// PUT /api/emergency-contacts/:id
// ==========================================

exports.updateContact = async (req, res) => {
    const userId = req.user.user_id;
    const contactId = Number(req.params.id);

    const { contact_name, phone_number } = req.body || {};

    if (!Number.isSafeInteger(contactId) || contactId <= 0) {
        return res.status(400).json({
            message: "Invalid contact ID."
        });
    }

    if (!validateName(contact_name)) {
        return res.status(400).json({
            message: "Contact name is required and must not exceed 150 characters."
        });
    }

    const normalizedPhone = normalizePhone(phone_number);

    if (!normalizedPhone) {
        return res.status(400).json({
            message: "Enter a valid Pakistani mobile number."
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Serialize changes to this user's contacts
        await connection.query(
            "SELECT user_id FROM USERS WHERE user_id = ? FOR UPDATE",
            [userId]
        );

        // Find only a contact owned by this user
        const [contacts] = await connection.query(
            `SELECT contact_id
             FROM EMERGENCY_CONTACTS
             WHERE contact_id = ?
             AND user_id = ?`,
            [contactId, userId]
        );

        if (contacts.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Emergency contact not found."
            });
        }

        // Check duplicate number excluding current contact
        const [duplicates] = await connection.query(
            `SELECT contact_id
             FROM EMERGENCY_CONTACTS
             WHERE user_id = ?
             AND phone_number = ?
             AND contact_id <> ?`,
            [userId, normalizedPhone, contactId]
        );

        if (duplicates.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                message: "This phone number is already in your emergency contacts."
            });
        }

        await connection.query(
            `UPDATE EMERGENCY_CONTACTS
             SET contact_name = ?,
                 phone_number = ?
             WHERE contact_id = ?
             AND user_id = ?`,
            [
                contact_name.trim(),
                normalizedPhone,
                contactId,
                userId
            ]
        );

        const [updated] = await connection.query(
            `SELECT contact_id, contact_name,
                    phone_number, priority,
                    created_at, updated_at
             FROM EMERGENCY_CONTACTS
             WHERE contact_id = ?
             AND user_id = ?`,
            [contactId, userId]
        );

        await connection.commit();

        return res.status(200).json({
            message: "Emergency contact updated successfully.",
            contact: updated[0]
        });

    } catch (error) {
        await connection.rollback();
        return handleDatabaseError(error, res);

    } finally {
        connection.release();
    }
};

// ==========================================
// DELETE CONTACT
// DELETE /api/emergency-contacts/:id
// ==========================================

exports.deleteContact = async (req, res) => {
    const userId = req.user.user_id;
    const contactId = Number(req.params.id);

    if (!Number.isSafeInteger(contactId) || contactId <= 0) {
        return res.status(400).json({
            message: "Invalid contact ID."
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            "SELECT user_id FROM USERS WHERE user_id = ? FOR UPDATE",
            [userId]
        );

        const [contacts] = await connection.query(
            `SELECT contact_id, priority
             FROM EMERGENCY_CONTACTS
             WHERE user_id = ?
             ORDER BY priority ASC`,
            [userId]
        );

        const exists = contacts.some(
            contact => contact.contact_id === contactId
        );

        if (!exists) {
            await connection.rollback();

            return res.status(404).json({
                message: "Emergency contact not found."
            });
        }

        await connection.query(
            `DELETE FROM EMERGENCY_CONTACTS
             WHERE contact_id = ?
             AND user_id = ?`,
            [contactId, userId]
        );

        // Temporarily move priorities outside 1–5
        await connection.query(
            `UPDATE EMERGENCY_CONTACTS
             SET priority = priority + 10
             WHERE user_id = ?`,
            [userId]
        );

        // Reassign consecutive priorities
        const remaining = contacts.filter(
            contact => contact.contact_id !== contactId
        );

        for (let i = 0; i < remaining.length; i++) {
            await connection.query(
                `UPDATE EMERGENCY_CONTACTS
                 SET priority = ?
                 WHERE contact_id = ?
                 AND user_id = ?`,
                [i + 1, remaining[i].contact_id, userId]
            );
        }

        await connection.commit();

        return res.status(200).json({
            message: "Emergency contact deleted successfully."
        });

    } catch (error) {
        await connection.rollback();
        return handleDatabaseError(error, res);

    } finally {
        connection.release();
    }
};

// ==========================================
// REORDER CONTACTS
// PUT /api/emergency-contacts/reorder
// ==========================================

exports.reorderContacts = async (req, res) => {
    const userId = req.user.user_id;
    const { contact_ids } = req.body || {};

    if (
        !Array.isArray(contact_ids) ||
        contact_ids.length < 1 ||
        contact_ids.length > MAX_CONTACTS ||
        !contact_ids.every(
            id => Number.isSafeInteger(id) && id > 0
        ) ||
        new Set(contact_ids).size !== contact_ids.length
    ) {
        return res.status(400).json({
            message: "Provide a valid ordered list of unique contact IDs."
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            "SELECT user_id FROM USERS WHERE user_id = ? FOR UPDATE",
            [userId]
        );

        const [existing] = await connection.query(
            `SELECT contact_id
             FROM EMERGENCY_CONTACTS
             WHERE user_id = ?`,
            [userId]
        );

        // Must provide every contact exactly once
        const existingIds = new Set(
            existing.map(contact => contact.contact_id)
        );

        const valid =
            existing.length === contact_ids.length &&
            contact_ids.every(id => existingIds.has(id));

        if (!valid) {
            await connection.rollback();

            return res.status(400).json({
                message: "Contact list does not match your saved emergency contacts."
            });
        }

        // Move priorities temporarily to avoid unique collisions
        await connection.query(
            `UPDATE EMERGENCY_CONTACTS
             SET priority = priority + 10
             WHERE user_id = ?`,
            [userId]
        );

        // Save the new priority order
        for (let i = 0; i < contact_ids.length; i++) {
            await connection.query(
                `UPDATE EMERGENCY_CONTACTS
                 SET priority = ?
                 WHERE contact_id = ?
                 AND user_id = ?`,
                [i + 1, contact_ids[i], userId]
            );
        }

        await connection.commit();

        const contacts = await getUserContacts(userId);

        return res.status(200).json({
            message: "Emergency contact priorities updated successfully.",
            contacts: contacts
        });

    } catch (error) {
        await connection.rollback();
        return handleDatabaseError(error, res);

    } finally {
        connection.release();
    }
};