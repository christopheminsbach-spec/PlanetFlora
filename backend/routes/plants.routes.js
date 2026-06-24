import express from "express";
import multer from "multer";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const plants = [
  {
    id: 1,
    name: "Monstera",
    species: "Monstera deliciosa",
    confidence: 0.92,
    latitude: 49.21,
    longitude: 6.16,
    createdAt: new Date().toISOString(),
  },
];

router.get("/", (req, res) => {
  res.json(plants);
});

router.post("/identify", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "Aucune image reçue. Le champ doit s'appeler image.",
    });
  }

  const plant = {
    id: Date.now(),
    name: "Plante analysée",
    species: "Identification en attente",
    confidence: 0,
    imageName: req.file.originalname,
    latitude: 49.21,
    longitude: 6.16,
    createdAt: new Date().toISOString(),
  };

  plants.unshift(plant);

  res.status(201).json({
    message: "Image reçue avec succès",
    results: [plant],
  });
});

export default router;