const express = require("express");
const operatorController     = require("../controllers/operatorController");
const router = express.Router();

router.post("/login", operatorController.login);
router.get("/transactions", operatorController.transactions);
router.get("/last-transactions", operatorController.lastTransactions);
router.post("/confirm-account", operatorController.confirmAccount);
router.post("/validation-account", operatorController.validationAccount);
router.post("/create-merchant", operatorController.createMerchant);
router.put("/update-password", operatorController.updatePassword);

module.exports = router;