const express = require("express");
const merchantController = require("../controllers/merchantController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/login", merchantController.login);
router.put("/update-password", authMiddleware.verifyToken , authMiddleware.isMerchant, merchantController.updatePassword);
router.put("/update-token", authMiddleware.verifyToken , authMiddleware.isMerchant, merchantController.updateToken);
router.get("/transactions", authMiddleware.verifyToken , authMiddleware.isMerchant, merchantController.transactions);
router.delete("/delete-account", authMiddleware.verifyToken , authMiddleware.isMerchant, merchantController.destroy);

module.exports = router;