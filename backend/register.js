const bcrypt = require("bcrypt");

const passwordHash = await bcrypt.hash(password, 10);

await db.promise().query(
  "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
  [username, email, passwordHash]
);