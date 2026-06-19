const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "127.0.0.1",
  port: 3307,
  user: "root",
  password: "root",
  database: "planete_flora"
});

db.connect((err) => {

  if(err){
    console.error(err);
    return;
  }

  console.log("✅ Connexion OK");

  db.end();

});