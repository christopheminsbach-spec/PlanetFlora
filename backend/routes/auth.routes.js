import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email et mot de passe obligatoires.",
    });
  }

  // Compte temporaire pour tester le frontend.
  if (email !== "admin@planetflora.fr" || password !== "123456") {
    return res.status(401).json({
      message: "Identifiants incorrects.",
    });
  }

  const token = jwt.sign(
    {
      id: 1,
      email,
      role: "admin",
    },
    process.env.JWT_SECRET || "dev-secret",
    {
      expiresIn: "2h",
    }
  );

  res.json({
    message: "Connexion réussie",
    token,
    user: {
      id: 1,
      email,
      role: "admin",
    },
  });
});

export default router;