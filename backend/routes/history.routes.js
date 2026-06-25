import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/*
  GET /history
  Retourne les dernières analyses enregistrées.
*/
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        plant_name AS name,
        scientific_name AS species,
        confidence,
        image_path AS imagePath,
        created_at AS createdAt
      FROM history
      ORDER BY created_at DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Erreur GET /history :", error);

    res.status(500).json({
      message: "Impossible de charger l'historique",
    });
  }
});

export default router;