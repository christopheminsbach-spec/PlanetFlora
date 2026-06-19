require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// MYSQL
// ======================

const db = mysql.createConnection({
  host: "127.0.0.1",
  port: 3307,
  user: "root",
  password: "root",
  database: "testdb"
});

db.connect((err) => {
  if (err) {
    console.error("❌ Erreur MySQL :", err.message);
    return;
  }

  console.log("✅ MySQL connecté");
});

// ======================
// ROUTE TEST
// ======================

app.get("/", (req, res) => {
  res.json({
    message: "API Planète Flora OK 🌿"
  });
});

// ======================
// INSCRIPTION
// ======================

app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont obligatoires"
      });
    }

    const [existing] = await db.promise().query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email déjà utilisé"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.promise().query(
      `
      INSERT INTO users
      (username, email, password_hash)
      VALUES (?, ?, ?)
      `,
      [username, email, passwordHash]
    );

    res.json({
      success: true,
      message: "Compte créé"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur inscription"
    });
  }
});

// ======================
// CONNEXION
// ======================

app.post("/api/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    const [rows] = await db.promise().query(
      `
      SELECT *
      FROM users
      WHERE email = ?
      `,
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable"
      });
    }

    const user = rows[0];

    const match = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Mot de passe incorrect"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role || "user"
      },
      process.env.JWT_SECRET || "planeteflora_secret",
      {
        expiresIn: "7d"
      }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Erreur connexion"
    });

  }
});

// ======================
// HISTORIQUE
// ======================

app.get("/api/history", (req, res) => {

  db.query(
    `
    SELECT *
    FROM diagnostics
    ORDER BY id DESC
    `,
    (err, results) => {

      if (err) {
        return res.json([]);
      }

      res.json(results);

    }
  );

});

// ======================
// START
// ======================

app.listen(PORT, () => {
  console.log(
    `🌿 API Planète Flora OK sur http://localhost:${PORT}`
  );
});