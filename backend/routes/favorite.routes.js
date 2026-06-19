const express = require("express");

const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

router.post(
  "/",
  auth,
  async (req, res) => {

    const {
      plante
    } = req.body;

    await db.query(
      `
      INSERT INTO favorites
      (
        user_id,
        plante
      )
      VALUES (?, ?)
      `,
      [
        req.user.id,
        plante
      ]
    );

    res.json({
      success: true
    });

  }
);

router.get(
  "/",
  auth,
  async (req, res) => {

    const [rows] =
    await db.query(
      `
      SELECT *
      FROM favorites
      WHERE user_id=?
      `,
      [
        req.user.id
      ]
    );

    res.json(rows);

  }
);

module.exports = router;