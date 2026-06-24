import "dotenv/config";
import express from "express";
import cors from "cors";
import plantsRoutes from "./routes/plants.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Planet Flora API active",
    port: PORT,
  });
});

app.use("/plants", plantsRoutes);
app.use("/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: `Route introuvable : ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    message: "Erreur interne du serveur",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Planet Flora : http://localhost:${PORT}`);
});