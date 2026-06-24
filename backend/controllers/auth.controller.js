import jwt from "jsonwebtoken";

export const login = (req, res) => {
  const { email, password } = req.body;

  // ⚠️ simple demo (à sécuriser ensuite)
  if (email === "admin@test.com" && password === "1234") {
    const token = jwt.sign(
      { user: email },
      "SECRET_KEY",
      { expiresIn: "1h" }
    );

    return res.json({ token });
  }

  res.status(401).json({ error: "Invalid credentials" });
};