const bcrypt = require("bcrypt");
const db = require("../config/db");
const {
  generateAccessToken,
  generateRefreshToken
} = require("../services/token.service");

// REGISTER
exports.register = (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.json({ success: false, message: "Champs manquants" });
  }

  const hash = bcrypt.hashSync(password, 10);

  db.query(
    "INSERT INTO users (username,email,password_hash,role) VALUES (?,?,?,?)",
    [username, email, hash, "user"],
    (err) => {
      if (err) return res.json({ success: false });

      res.json({ success: true });
    }
  );
};

// LOGIN
exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    (err, results) => {
      if (err) return res.json({ success: false });

      if (!results.length) {
        return res.json({ success: false, message: "User introuvable" });
      }

      const user = results[0];

      const ok = bcrypt.compareSync(password, user.password_hash);

      if (!ok) {
        return res.json({ success: false, message: "Mot de passe incorrect" });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    }
  );
};