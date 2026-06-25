import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import pool from "../config/db.js";

const router = express.Router();

/* =========================
   📁 UPLOAD CONFIG
========================= */

const uploadDir = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || ".jpg");
    cb(
      null,
      `plant-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Format image uniquement"));
    }
    cb(null, true);
  },
});

/* =========================
   🌱 GET HISTORY
========================= */

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
  } catch (err) {
    console.error("GET /plants error:", err);
    res.status(500).json({
      message: "Erreur chargement historique",
      details: err.message,
    });
  }
});

/* =========================
   🗑 DELETE HISTORY ITEM
========================= */

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      "DELETE FROM history WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Analyse introuvable",
      });
    }

    res.json({
      message: "Supprimé avec succès",
      id,
    });
  } catch (err) {
    console.error("DELETE /plants error:", err);

    res.status(500).json({
      message: "Erreur suppression",
      details: err.message,
    });
  }
});

/* =========================
   🌿 IDENTIFY PLANT
========================= */

function formatResults(data) {
  const results = Array.isArray(data?.results) ? data.results : [];

  return results.slice(0, 5).map((item, index) => {
    const species =
      item.species?.scientificNameWithoutAuthor ||
      item.species?.scientificName ||
      "Unknown";

    const common = item.species?.commonNames || [];

    return {
      id: `${Date.now()}-${index}`,
      name: common[0] || species,
      species,
      confidence: Number(((item.score || 0) * 100).toFixed(2)),
      family: item.species?.family?.scientificNameWithoutAuthor || "",
      genus: item.species?.genus?.scientificNameWithoutAuthor || "",
    };
  });
}

router.post("/identify", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image manquante" });
    }

    const apiKey = process.env.PLANTNET_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        message: "API key manquante",
      });
    }

    const form = new FormData();

    form.append("images", fs.createReadStream(req.file.path));
    form.append("organs", "auto");

    const response = await axios.post(
      "https://my-api.plantnet.org/v2/identify/all",
      form,
      {
        params: { "api-key": apiKey, lang: "fr" },
        headers: form.getHeaders(),
      }
    );

    const results = formatResults(response.data);

    if (!results.length) {
      return res.status(404).json({
        message: "Aucune plante reconnue",
      });
    }

    const best = results[0];
    const imagePath = `/uploads/${req.file.filename}`;

    const [insert] = await pool.execute(
      `
      INSERT INTO history (
        plant_name,
        scientific_name,
        confidence,
        image_path
      ) VALUES (?, ?, ?, ?)
      `,
      [best.name, best.species, best.confidence, imagePath]
    );

    res.json({
      message: "OK",
      historyId: insert.insertId,
      results,
    });
  } catch (err) {
    console.error("IDENTIFY ERROR:", err);

    res.status(500).json({
      message: "Erreur identification",
      details: err.message,
    });
  }
});

export default router;