import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

// connexion SANS database (important pour créer DB)
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

connection.connect((err) => {
  if (err) {
    console.log("❌ MySQL connection error:", err.message);
    return;
  }

  console.log("✅ MySQL connected (setup mode)");

  // 1. CREATE DATABASE
  connection.query(
    "CREATE DATABASE IF NOT EXISTS planet_flora",
    (err) => {
      if (err) throw err;
      console.log("📦 Database ready");

      // 2. USE DB
      connection.query("USE planet_flora");

      // 3. TABLES
      connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(100),
          email VARCHAR(150),
          password VARCHAR(255)
        )
      `);

      connection.query(`
        CREATE TABLE IF NOT EXISTS identifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          plant_name VARCHAR(255),
          confidence FLOAT,
          image_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log("🌿 Tables ready");

      connection.end();
    }
  );
});