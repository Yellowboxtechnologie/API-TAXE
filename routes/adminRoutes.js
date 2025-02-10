const express = require("express");
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/login", adminController.login);
router.post("/create", adminController.create);
router.put("/update-operator",  adminController.updateOperator);
router.put("/disable-operator", adminController.disableOperator);
router.put("/activate-operator", adminController.activateOperator);
router.get("/list-operators",  adminController.listOperators);
router.get("/list-active-operators",  adminController.listActiveOperators);
router.get("/list-inactive-operators",  adminController.listInactiveOperators);
router.post("/create-operator",  adminController.createOperator);
router.post("/create-category",  adminController.createCategory);
router.post("/create-subcategory",  adminController.createSubCategory);

router.get("/list-categories",  adminController.listCategories);
router.get("/list-subcategories",  adminController.listSubCategories);

module.exports = router;