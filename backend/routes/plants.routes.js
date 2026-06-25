import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/db.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDirectory = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase() || ".jpg";
    const filename = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}${extension}`;
    callback(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error("Format invalide. Utilise JPG, PNG ou WEBP."));
    }

    return callback(null, true);
  },
});

function getPlantNetUrl() {
  const apiKey = process.env.PLANTNET_API_KEY;

  if (!apiKey) {
    throw new Error("PLANTNET_API_KEY est absent du fichier backend/.env");
  }

  return `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}`;
}

function normalizeResults(plantNetData) {
  const rawResults = Array.isArray(plantNetData?.results)
    ? plantNetData.results
    : [];

  return rawResults.slice(0, 5).map((item, index) => {
    const species =
      item?.species?.scientificNameWithoutAuthor ||
      item?.species?.scientificName ||
      "Espèce inconnue";

    const name = item?.species?.commonNames?.[0] || species;

    return {
      id: `result-${Date.now()}-${index}`,
      name,
      species,
      confidence: Math.round(Number(item?.score || 0) * 1000) / 10,
      family: item?.species?.family?.scientificNameWithoutAuthor || "",
      genus: item?.species?.genus?.scientificNameWithoutAuthor || "",
    };
  });
}

function optionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * GET /plants
 * Liste les identifications enregistrées.
 */
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        id,
        user_id,
        name,
        species,
        confidence,
        image_url AS imageUrl,
        latitude,
        longitude,
        created_at AS createdAt
      FROM plant_identifications
      ORDER BY created_at DESC
    `);

    return res.json(rows);
  } catch (error) {
    console.error("GET /plants:", error.message);

    return res.status(500).json({
      message: "Impossible de charger l'historique des plantes.",
    });
  }
});

/**
 * DELETE /plants/:id
 * Supprime une identification.
 */
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Identifiant de plante invalide.",
    });
  }

  try {
    const [result] = await pool.execute(
      "DELETE FROM plant_identifications WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Identification introuvable.",
      });
    }

    return res.json({
      message: "Identification supprimée.",
      id,
    });
  } catch (error) {
    console.error("DELETE /plants/:id:", error.message);

    return res.status(500).json({
      message: "Impossible de supprimer cette identification.",
    });
  }
});

/**
 * POST /plants/identify
 * Champ multipart requis : image
 * Champs optionnels : latitude, longitude
 */
router.post("/identify", (req, res) => {
  upload.single("image")(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        message: uploadError.message || "Erreur lors de l'envoi de l'image.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Aucune image reçue. Le champ doit s'appeler image.",
      });
    }

    try {
      const plantNetFormData = new FormData();

      plantNetFormData.append("images", fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      plantNetFormData.append("organs", "auto");

      const plantNetResponse = await axios.post(
        getPlantNetUrl(),
        plantNetFormData,
        {
          headers: plantNetFormData.getHeaders(),
          timeout: 45_000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );

      const results = normalizeResults(plantNetResponse.data);

      if (results.length === 0) {
        return res.status(404).json({
          message:
            "Aucune plante reconnue. Utilise une photo plus nette d’une feuille, fleur ou plante entière.",
        });
      }

      const bestPlant = results[0];
      const imageUrl = `/uploads/${req.file.filename}`;
      const latitude = optionalNumber(req.body.latitude);
      const longitude = optionalNumber(req.body.longitude);

      // Fonctionne avec ou sans connexion : user_id reste NULL sans utilisateur.
      const userId = req.user?.id ?? null;

      const [insertResult] = await pool.execute(
        `INSERT INTO plant_identifications
          (user_id, name, species, confidence, image_url, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          bestPlant.name,
          bestPlant.species,
          bestPlant.confidence,
          imageUrl,
          latitude,
          longitude,
        ]
      );

      const [savedRows] = await pool.execute(
        `SELECT
          id,
          user_id,
          name,
          species,
          confidence,
          image_url AS imageUrl,
          latitude,
          longitude,
          created_at AS createdAt
        FROM plant_identifications
        WHERE id = ?`,
        [insertResult.insertId]
      );

      return res.status(201).json({
        message: "Identification terminée et enregistrée.",
        results,
        savedPlant: savedRows[0],
      });
    } catch (error) {
      console.error("POST /plants/identify:", {
        message: error.message,
        status: error.response?.status,
        plantNetError: error.response?.data,
      });

      if (error.response?.status === 401 || error.response?.status === 403) {
        return res.status(502).json({
          message:
            "La clé Pl@ntNet est invalide ou refusée. Vérifie PLANTNET_API_KEY dans backend/.env.",
        });
      }

      if (error.response?.status === 400) {
        return res.status(400).json({
          message:
            error.response?.data?.message ||
            "Pl@ntNet refuse cette image ou les paramètres envoyés.",
        });
      }

      if (error.code === "ECONNABORTED") {
        return res.status(504).json({
          message:
            "L’analyse a pris trop de temps. Essaie une image plus légère.",
        });
      }

      return res.status(500).json({
        message: "Erreur pendant l’identification de la plante.",
      });
    }
  });
});

export default router;