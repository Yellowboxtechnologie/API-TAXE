const express = require("express");
const customerController     = require("../controllers/customerController");
const router = express.Router();

router.post("/login", customerController.login);
router.put("/update-password", customerController.updatePassword);
router.put("/update-token", customerController.updateToken);
router.get("/transactions", customerController.transactions);
router.delete("/delete-account", customerController.destroy);

module.exports = router;