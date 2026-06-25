import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const plants = [];

router.get("/", (req, res) => {
  res.json(plants);
});

router.post("/identify", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Aucune image reçue. Le champ doit s'appeler image.",
      });
    }

    if (!process.env.PLANTNET_API_KEY) {
      return res.status(500).json({
        message: "PLANTNET_API_KEY est absente du fichier backend/.env.",
      });
    }

    const form = new FormData();

    form.append("images", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await axios.post(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${process.env.PLANTNET_API_KEY}`,
      form,
      {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    const rawResults = Array.isArray(response.data.results)
      ? response.data.results
      : [];

    const results = rawResults.slice(0, 5).map((item, index) => {
      const scientificName =
        item.species?.scientificNameWithoutAuthor ||
        item.species?.scientificName ||
        "Espèce inconnue";

      const commonNames = Array.isArray(item.species?.commonNames)
        ? item.species.commonNames
        : [];

      return {
        id: `${Date.now()}-${index}`,
        rank: index + 1,
        name: commonNames[0] || scientificName,
        species: scientificName,
        scientificName,
        commonNames,
        family:
          item.species?.family?.scientificNameWithoutAuthor ||
          "Non renseignée",
        genus:
          item.species?.genus?.scientificNameWithoutAuthor ||
          "Non renseigné",
        confidence: Number(item.score || 0),
      };
    });

    if (results.length === 0) {
      return res.status(404).json({
        message: "Aucune espèce n'a été reconnue avec cette image.",
        results: [],
      });
    }

    const historyItem = {
      id: Date.now(),
      imageName: req.file.originalname,
      createdAt: new Date().toISOString(),
      ...results[0],
    };

    plants.unshift(historyItem);

    res.status(201).json({
      message: "Analyse Pl@ntNet terminée.",
      imageName: req.file.originalname,
      analyzedAt: historyItem.createdAt,
      results,
    });
  } catch (error) {
    console.error("Erreur Pl@ntNet :", error.response?.data || error.message);

    res.status(error.response?.status || 500).json({
      message:
        error.response?.data?.message ||
        "Erreur pendant l'analyse de la plante avec Pl@ntNet.",
    });
  }
});

/* Supprimer une analyse de l'historique */
router.delete("/:id", (req, res) => {
  const id = String(req.params.id);

  const index = plants.findIndex((plant) => String(plant.id) === id);

  if (index === -1) {
    return res.status(404).json({
      message: "Analyse introuvable.",
    });
  }

  const deletedPlant = plants.splice(index, 1)[0];

  res.json({
    message: "Analyse supprimée.",
    plant: deletedPlant,
  });
});

export default router;