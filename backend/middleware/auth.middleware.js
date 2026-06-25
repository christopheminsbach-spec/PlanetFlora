import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Token manquant",
    });
  }

  const token = authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "planet_flora_secret"
    );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Bad token",
    });
  }
}