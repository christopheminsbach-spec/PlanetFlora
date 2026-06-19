const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, hashed],
      (err) => {
        if (err) {
          return res.status(500).json({ success: false });
        }
        res.json({ success: true });
      }
    );
  } catch (e) {
    res.status(500).json({ success: false });
  }
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err || results.length === 0) {
        return res.json({ success: false });
      }

      const user = results[0];

      const match = await bcrypt.compare(password, user.password_hash);

      if (!match) {
        return res.json({ success: false });
      }

      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        token
      });
    }
  );
};