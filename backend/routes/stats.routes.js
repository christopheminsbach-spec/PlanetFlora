import express from "express";
import { db } from "../config/db.js";

const router = express.Router();

router.get("/", (req, res) => {
  db.query(
    `SELECT DATE(created_at) as date, COUNT(*) as total
     FROM identifications
     GROUP BY DATE(created_at)
     ORDER BY date DESC
     LIMIT 7`,
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
});

export default router;