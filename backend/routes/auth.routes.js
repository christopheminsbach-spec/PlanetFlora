import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";
const JWT_EXPIRES_IN = "7d";

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Nom, email et mot de passe sont obligatoires.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 6 caractères.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // username est généré depuis le nom + une partie unique.
    const username = `${cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 20)}${Date.now().toString().slice(-6)}`;

    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Un compte existe déjà avec cet email.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO users (name, username, email, password_hash)
       VALUES (?, ?, ?, ?)`,
      [cleanName, username, normalizedEmail, passwordHash]
    );

    const user = {
      id: result.insertId,
      name: cleanName,
      username,
      email: normalizedEmail,
    };

    const token = createToken(user);

    return res.status(201).json({
      message: "Compte créé avec succès.",
      token,
      user,
    });
  } catch (error) {
    console.error("POST /auth/register:", error);

    return res.status(500).json({
      message: "Impossible de créer le compte.",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Email et mot de passe obligatoires.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [users] = await pool.execute(
      `SELECT id, name, username, email, password_hash
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect.",
      });
    }

    const dbUser = users[0];

    const validPassword = await bcrypt.compare(
      password,
      dbUser.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect.",
      });
    }

    const user = {
      id: dbUser.id,
      name: dbUser.name,
      username: dbUser.username,
      email: dbUser.email,
    };

    const token = createToken(user);

    return res.json({
      message: "Connexion réussie.",
      token,
      user,
    });
  } catch (error) {
    console.error("POST /auth/login:", error);

    return res.status(500).json({
      message: "Impossible de se connecter.",
    });
  }
});

export default router;