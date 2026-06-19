const db = require("../config/db");

exports.getHistory = (req, res) => {

    db.query(
        "SELECT * FROM diagnostics ORDER BY id DESC",
        (err, results) => {

            if (err) {
                return res.status(500).json({ success: false });
            }

            res.json(results);

        }
    );

};