const express = require("express");
const operatorController     = require("../controllers/operatorController");
const router = express.Router();

router.post("/login", operatorController.login);
router.get("/transactions", operatorController.transactions);
router.get("/last-transactions", operatorController.lastTransactions);

module.exports = router;