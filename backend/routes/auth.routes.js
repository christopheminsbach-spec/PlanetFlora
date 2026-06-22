const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const router = express.Router();

/* ---------------- REGISTER ---------------- */
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false });
  }

  const hash = await bcrypt.hash(password, 10);

  // ⚠️ ici tu peux brancher Prisma users table
  return res.json({
    success: true,
    user: { username, email, password: hash }
  });
});

/* ---------------- LOGIN ---------------- */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (email === "admin@flora.com" && password === "1234") {
    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid credentials"
  });
});

module.exports = router;