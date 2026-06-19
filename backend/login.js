const bcrypt = require("bcrypt");

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email.trim()],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.json({ success: false, message: "Erreur serveur" });
      }

      if (results.length === 0) {
        return res.json({
          success: false,
          message: "Utilisateur introuvable"
        });
      }

      const user = results[0];

      const isValid = bcrypt.compareSync(password, user.password_hash);

      if (!isValid) {
        return res.json({
          success: false,
          message: "Mot de passe incorrect"
        });
      }

      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    }
  );
});
console.log("USER:", user);
console.log("PASSWORD:", password);
console.log("HASH:", user.password_hash);