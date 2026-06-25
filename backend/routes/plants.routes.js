import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDirectory = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname) || ".jpg";
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}${extension}`;
    callback(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      callback(new Error("Format invalide. Utilise JPG, PNG ou WEBP."));
      return;
    }

    callback(null, true);
  },
});

function getPlantNetUrl() {
  const apiKey = process.env.PLANTNET_API_KEY;

  if (!apiKey) {
    throw new Error("PLANTNET_API_KEY est absent du fichier .env");
  }

  return `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}`;
}

function normalizeResults(plantNetData) {
  const rawResults = Array.isArray(plantNetData?.results)
    ? plantNetData.results
    : [];

  return rawResults.slice(0, 5).map((item, index) => {
    const scientificName =
      item?.species?.scientificNameWithoutAuthor ||
      item?.species?.scientificName ||
      "Espèce inconnue";

    const commonName =
      item?.species?.commonNames?.[0] ||
      scientificName;

    const confidence = Math.round(Number(item?.score || 0) * 1000) / 10;

    return {
      id: `${Date.now()}-${index}`,
      name: commonName,
      species: scientificName,
      confidence,
      family: item?.species?.family?.scientificNameWithoutAuthor || "",
      genus: item?.species?.genus?.scientificNameWithoutAuthor || "",
    };
  });
}

/*
  GET /plants
  Retourne l'historique en mémoire si aucune base n'est encore connectée.
*/
router.get("/", async (req, res) => {
  try {
    const historyFile = path.join(__dirname, "..", "data", "plants.json");

    if (!fs.existsSync(historyFile)) {
      return res.json([]);
    }

    const content = fs.readFileSync(historyFile, "utf-8");
    const plants = JSON.parse(content || "[]");

    return res.json(Array.isArray(plants) ? plants : []);
  } catch (error) {
    console.error("GET /plants error:", error);

    return res.status(500).json({
      message: "Impossible de charger l'historique des plantes.",
    });
  }
});

/*
  POST /plants/identify
  Attend le champ multipart "image".
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

      plantNetFormData.append(
        "images",
        fs.createReadStream(req.file.path),
        {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
        }
      );

      plantNetFormData.append("organs", "auto");

      const plantNetResponse = await axios.post(
        getPlantNetUrl(),
        plantNetFormData,
        {
          headers: {
            ...plantNetFormData.getHeaders(),
          },
          timeout: 45_000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );

      const results = normalizeResults(plantNetResponse.data);

      if (results.length === 0) {
        return res.status(404).json({
          message:
            "Aucune plante n'a été reconnue. Essaie une photo plus nette, avec une feuille ou une fleur bien visible.",
        });
      }

      const firstResult = results[0];

      const plantToSave = {
        id: `${Date.now()}`,
        name: firstResult.name,
        species: firstResult.species,
        confidence: firstResult.confidence,
        family: firstResult.family,
        genus: firstResult.genus,
        imageUrl: `/uploads/${req.file.filename}`,
        createdAt: new Date().toISOString(),
      };

      const dataDirectory = path.join(__dirname, "..", "data");
      const historyFile = path.join(dataDirectory, "plants.json");

      if (!fs.existsSync(dataDirectory)) {
        fs.mkdirSync(dataDirectory, { recursive: true });
      }

      let existingPlants = [];

      if (fs.existsSync(historyFile)) {
        try {
          existingPlants = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
        } catch {
          existingPlants = [];
        }
      }

      existingPlants.unshift(plantToSave);

      fs.writeFileSync(
        historyFile,
        JSON.stringify(existingPlants, null, 2),
        "utf-8"
      );

      return res.status(200).json({
        message: "Identification terminée.",
        results,
        savedPlant: plantToSave,
      });
    } catch (error) {
      console.error("POST /plants/identify:", {
        message: error.message,
        status: error.response?.status,
        plantNetError: error.response?.data,
      });

      if (error.response?.status === 401 || error.response?.status === 403) {
        return res.status(500).json({
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
            "L'analyse a pris trop de temps. Réessaie avec une image plus légère.",
        });
      }

      return res.status(500).json({
        message:
          "Erreur pendant l'identification de la plante. Consulte le terminal backend pour voir le détail.",
      });
    }
  });
});

export default router;