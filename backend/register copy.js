const bcrypt = require("bcrypt");

app.post("/api/register", async (req, res) => {

    try {

        const { username, email, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            `INSERT INTO users
            (username,email,password_hash)
            VALUES (?,?,?)`,
            [username, email, hashedPassword],
            (err) => {

                if (err) {
                    console.error(err);

                    return res.status(500).json({
                        success: false,
                        message: "Erreur inscription"
                    });
                }

                res.json({
                    success: true,
                    message: "Compte créé"
                });

            }
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false
        });

    }

});