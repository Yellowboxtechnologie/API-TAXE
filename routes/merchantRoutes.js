const express = require("express");
const merchantController = require("../controllers/merchantController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/login", merchantController.login);
router.put("/update-password", merchantController.updatePassword);
router.put("/update-token", merchantController.updateToken);
router.put("/create-password", merchantController.createPassword);
router.get("/transactions", merchantController.transactions);
router.delete("/delete-account", merchantController.destroy);
router.post("/verify-phone", merchantController.verifyPhone);
router.post("/validate-otp", merchantController.vatidateOtp);

module.exports = router;