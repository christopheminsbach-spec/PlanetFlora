import db from "../config/db.js";

// GET /plants
export const getPlants = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM plants");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /plants/identify
export const identifyPlant = async (req, res) => {
  try {
    // simulation IA
    const result = {
      name: "Monstera",
      species: "Deliciosa",
      confidence: 0.92
    };

    res.json({ results: [result] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};