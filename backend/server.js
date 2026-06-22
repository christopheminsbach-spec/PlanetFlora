require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const authRoutes = require("./routes/auth.routes");
const predictRoutes = require("./routes/predict.routes");
const historyRoutes = require("./routes/history.routes");

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3000;

/* ---------------- MIDDLEWARE ---------------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------- FRONTEND ---------------- */
app.use("/", express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ---------------- ROUTES ---------------- */
app.use("/api/auth", authRoutes);
app.use("/api", predictRoutes);
app.use("/api/history", historyRoutes);

/* ---------------- HEALTH ---------------- */
app.get("/", (req, res) => {
  res.json({
    success: true,
    app: "Planet Flora",
    status: "online"
  });
});

/* ---------------- START ---------------- */
async function start() {
  try {
    await prisma.$connect();
    console.log("🌿 Prisma connecté");

    app.listen(PORT, () => {
      console.log(`🚀 http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("DB error:", err);
  }
}

start();