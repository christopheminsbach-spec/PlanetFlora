const express = require("express");
const router = express.Router();

const history = require("../controllers/history.controller");

router.get("/", history.getHistory);

module.exports = router;