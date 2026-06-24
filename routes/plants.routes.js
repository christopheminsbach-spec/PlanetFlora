import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json([
    { id: 1, name: "Monstera", species: "Monstera deliciosa" }
  ]);
});

router.post("/identify", (req, res) => {
  res.json({
    results: [
      {
        name: "Monstera",
        species: "Monstera deliciosa",
        confidence: 0.92
      }
    ]
  });
});

export default router;
