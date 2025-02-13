const express = require("express");
const operatorController     = require("../controllers/operatorController");
const router = express.Router();

router.post("/login", operatorController.login);
router.get("/transactions", operatorController.transactions);
router.get("/last-transactions", operatorController.lastTransactions);
router.post("/create-merchant", operatorController.createMerchant);

module.exports = router;