const express = require("express");
const multer = require("multer");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { analyzePlant } = require("../services/plantnet.service");

const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post("/predict", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;

    const prediction = await analyzePlant(file.path);

    const saved = await prisma.prediction.create({
      data: {
        imagePath: file.filename,
        result: JSON.stringify(prediction.top5),
        confidence: prediction.top5?.[0]?.score || 0
      }
    });

    res.json({
      id: saved.id,
      top5: prediction.top5,
      imageUrl: `/uploads/${file.filename}`
    });

  } catch (err) {
    res.status(500).json({ error: "Prediction failed" });
  }
});

module.exports = router;