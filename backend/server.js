import "dotenv/config";
import express from "express";
import cors from "cors";
import plantsRouter from "./routes/plants.routes.js";
import authRoutes from "./routes/auth.routes.js";


const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));




app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/plants", plantsRouter);
app.use("/auth", authRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Backend lancé sur http://localhost:${process.env.PORT || 3000}`);
});