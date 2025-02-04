const express = require("express");
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/login", adminController.login);
router.post("/create", adminController.create);
router.put("/update-operator", authMiddleware.verifyToken , authMiddleware.isAdmin, adminController.updateOperator);
router.put("/disable-operator", authMiddleware.verifyToken , authMiddleware.isAdmin, adminController.disableOperator);
router.put("/activate-operator", authMiddleware.verifyToken , authMiddleware.isAdmin, adminController.activateOperator);
router.get("/list-operators", authMiddleware.verifyToken , authMiddleware.isAdmin, adminController.listOperators);
router.get("/list-active-operators", authMiddleware.verifyToken , authMiddleware.isAdmin, adminController.listActiveOperators);
router.get("/list-inactive-operators", authMiddleware.verifyToken , authMiddleware.isAdmin, adminController.listInactiveOperators);
router.post("/create-operator", authMiddleware.verifyToken , authMiddleware.isAdmin, adminController.createOperator);

module.exports = router;