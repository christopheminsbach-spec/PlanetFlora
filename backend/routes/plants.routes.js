import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import pool from "../config/db.js";

const router = express.Router();

const uploadDirectory = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname || ".jpg").toLowerCase();
    const safeExtension = extension || ".jpg";
    const fileName = `plant-${Date.now()}-${Math.round(
      Math.random() * 1_000_000
    )}${safeExtension}`;

    callback(null, fileName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype?.startsWith("image/")) {
      callback(new Error("Le fichier doit être une image JPG, PNG ou WEBP."));
      return;
    }

    callback(null, true);
  },
});

function formatPlantNetResults(plantNetData) {
  const sourceResults = Array.isArray(plantNetData?.results)
    ? plantNetData.results
    : [];

  return sourceResults.slice(0, 5).map((item, index) => {
    const species =
      item.species?.scientificNameWithoutAuthor ||
      item.species?.scientificName ||
      "Espèce inconnue";

    const commonNames = Array.isArray(item.species?.commonNames)
      ? item.species.commonNames
      : [];

    return {
      id: `${Date.now()}-${index}`,
      name: commonNames[0] || species,
      species,
      confidence: Number(((item.score || 0) * 100).toFixed(2)),
      family: item.species?.family?.scientificNameWithoutAuthor || "",
      genus: item.species?.genus?.scientificNameWithoutAuthor || "",
    };
  });
}

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

    return res.status(200).json(rows);
  } catch (error) {
    console.error("GET /plants :", error);

    return res.status(500).json({
      message: "Impossible de charger les plantes depuis MySQL.",
      details: error.message,
    });
  }
});

router.post("/identify", (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      console.error("Erreur upload image :", error.message);

      return res.status(400).json({
        message: error.message || "Erreur lors de l'envoi de l'image.",
      });
    }

    next();
  });
}, async (req, res) => {
  let uploadedFilePath = "";

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Aucune image reçue. Le champ FormData doit s'appeler image.",
      });
    }

    uploadedFilePath = req.file.path;

    const apiKey = process.env.PLANTNET_API_KEY?.trim();

    if (!apiKey) {
      return res.status(500).json({
        message: "PLANTNET_API_KEY est absente dans le fichier backend/.env.",
      });
    }

    const form = new FormData();

    form.append("images", fs.createReadStream(req.file.path), {
      filename: req.file.filename,
      contentType: req.file.mimetype,
    });

    form.append("organs", "auto");

    console.log("Analyse Pl@ntNet en cours :", req.file.filename);

    const plantNetResponse = await axios.post(
      "https://my-api.plantnet.org/v2/identify/all",
      form,
      {
        params: {
          "api-key": apiKey,
          lang: "fr",
        },
        headers: form.getHeaders(),
        timeout: 45000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: () => true,
      }
    );

    if (plantNetResponse.status < 200 || plantNetResponse.status >= 300) {
      console.error("Erreur Pl@ntNet :", plantNetResponse.status, plantNetResponse.data);

      return res.status(plantNetResponse.status).json({
        message: "Pl@ntNet a refusé la demande d'identification.",
        details:
          plantNetResponse.data?.message ||
          plantNetResponse.data?.error ||
          "Erreur inconnue retournée par Pl@ntNet.",
      });
    }

    const results = formatPlantNetResults(plantNetResponse.data);

    if (results.length === 0) {
      return res.status(404).json({
        message: "Aucune espèce n'a été reconnue sur cette image.",
      });
    }

    const bestPlant = results[0];
    const imagePath = `/uploads/${req.file.filename}`;

    let historyId = null;
    let historyWarning = "";

    try {
      const [insertResult] = await pool.execute(
        `
          INSERT INTO history (
            plant_name,
            scientific_name,
            confidence,
            image_path
          )
          VALUES (?, ?, ?, ?)
        `,
        [
          bestPlant.name,
          bestPlant.species,
          bestPlant.confidence,
          imagePath,
        ]
      );

      historyId = insertResult.insertId;
      console.log("Historique sauvegardé :", historyId);
    } catch (databaseError) {
      console.error("Erreur MySQL history :", databaseError.message);

      historyWarning =
        "La plante a été identifiée, mais l'historique n'a pas été sauvegardé dans MySQL.";
    }

    return res.status(200).json({
      message: "Identification réussie.",
      historyId,
      imagePath,
      historyWarning,
      results,
    });
  } catch (error) {
    console.error("POST /plants/identify :", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      plantNetError: error.response?.data,
    });

    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        message:
          "Le délai Pl@ntNet est dépassé. Réessaie avec une autre image.",
      });
    }

    return res.status(error.response?.status || 500).json({
      message: "Erreur pendant l'identification de la plante.",
      details:
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message,
    });
  }
});

export default router;