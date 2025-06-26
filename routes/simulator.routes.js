const express = require("express");
const { submitSimulatorResults } = require("../controllers/simulatorController");

const router = express.Router();

router.post("/results", submitSimulatorResults);

module.exports = router;

