const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Admin, Operator, Category, SubCategory, Merchant, Transaction } = require("../models");
const { appendErrorLog } = require("../utils/logging");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez saisir votre adresse email pour continuer.",
      });
    }

    if (!password) {
      return res.status(400).json({
        status: "error",
        message:
          "Veuillez entrer votre mot de passe pour accéder à votre compte.",
      });
    }

    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(409).json({
        status: "error",
        message:
          "L'adresse email saisie est incorrecte ou n'est pas enregistrée. Veuillez vérifier et réessayer.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message:
          "Le mot de passe saisi est incorrect. Merci de réessayer ou de réinitialiser votre mot de passe si nécessaire.",
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        role: "isAdmin",
      },
      process.env.JWT_SECRET
    );

    const adminResponse = {
      email: admin.email,
      photo: admin.photo,
      token: token,
    };

    return res.status(200).json({
      status: "success",
      data: adminResponse,
    });
  } catch (error) {
    console.error(`ERROR LOGIN ADMIN: ${error}`);
    appendErrorLog(`ERROR LOGIN ADMIN: ${error}`);
    return res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de la connexion. Veuillez vérifier vos informations ou réessayer plus tard.",
    });
  }
};

const create = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez saisir le nom pour continuer.",
      });
    }

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez saisir l'adresse email pour continuer.",
      });
    }
    if (!password) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez entrer le mot de passe de l'administrateur.",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await Admin.create({
      name,
      email,
      password: hashedPassword,
    });
    return res.status(200).json({
      status: "success",
      message: "Le compte administrateur a bien été créé avec succès.",
    });
  } catch (error) {
    console.error(`ERROR CREATE ADMIN: ${error}`);
    appendErrorLog(`ERROR CREATE ADMIN: ${error}`);
    return res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de la création du compte administrateur. Veuillez vérifier vos informations ou réessayer plus tard.",
    });
  }
};

const createOperator = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez saisir le nom de l'opérateur pour continuer.",
      });
    }

    if (!phone) {
      return res.status(400).json({
        status: "error",
        message:
          "Veuillez saisir le numéro de téléphone de l'opérateur pour continuer.",
      });
    }

    const exists = await Operator.findOne({ where: { phone } });
    if (exists) {
      return res.status(409).json({
        status: "error",
        message: "Un compte opérateur avec ce numéro de téléphone existe déjà.",
      });
    }

    await Operator.create({
      name,
      phone,
    });
    return res.status(200).json({
      status: "success",
      message: "Le compte opérateur a bien été créé avec succès.",
    });
  } catch (error) {
    console.error(`ERROR CREATE OPERATOR: ${error}`);
    appendErrorLog(`ERROR CREATE OPERATOR: ${error}`);
    return res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de la création du compte opérateur. Veuillez vérifier vos informations ou réessayer plus tard.",
    });
  }
};

const updateOperator = async (req, res) => {
  try {
    const { operatorId, name, phone } = req.body;

    if (!operatorId) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir l'ID de l'opérateur.",
      });
    }

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le nom de l'opérateur.",
      });
    }

    if (!phone) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le numéro de téléphone de l'opérateur.",
      });
    }

    const operator = await Operator.findOne({ where: { id: operatorId } });
    if (!operator) {
      return res.status(404).json({
        status: "error",
        message: "L'opérateur n'existe pas.",
      });
    }

    operator.name = name;
    operator.phone = phone;
    await operator.save();
    return res.status(200).json({
      status: "success",
      data: operator,
      message:
        "Les informations de l'opérateur ont bien été mis à jour avec succès.",
    });
  } catch (error) {
    console.error(`ERROR UPDATE OPERATOR: ${error}`);
    appendErrorLog(`ERROR UPDATE OPERATOR: ${error}`);
    return res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de la mise à jour du compte opérateur.",
    });
  }
};

const disableOperator = async (req, res) => {
  try {
    const { operatorId } = req.body;

    if (!operatorId) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir l'ID de l'opérateur.",
      });
    }

    const operator = await Operator.findOne({ where: { id: operatorId } });
    if (!operator) {
      return res.status(404).json({
        status: "error",
        message: "L'opérateur n'existe pas.",
      });
    }

    operator.isActive = false;
    await operator.save();
    return res.status(200).json({
      status: "success",
      data: operator,
      message: "Le compte de l'opérateur a bien été activé avec succès.",
    });
  } catch (error) {
    console.error(`ERROR DISABLE OPERATOR: ${error}`);
    appendErrorLog(`ERROR DISABLE OPERATOR: ${error}`);
    return res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de la désactivation de l'opérateur.",
    });
  }
};

const activateOperator = async (req, res) => {
  try {
    const { operatorId } = req.body;

    if (!operatorId) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir l'ID de l'opérateur.",
      });
    }

    const operator = await Operator.findOne({ where: { id: operatorId } });
    if (!operator) {
      return res.status(404).json({
        status: "error",
        message: "L'opérateur n'existe pas.",
      });
    }

    operator.isActive = true;
    await operator.save();
    return res.status(200).json({
      status: "success",
      data: operator,
      message: "Le compte de l'opérateur a bien été activé avec succès.",
    });
  } catch (error) {
    console.error(`ERROR ACTIVATE OPERATOR: ${error}`);
    appendErrorLog(`ERROR ACTIVATE OPERATOR: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de l'activation de l'opérateur.",
    });
  }
};

const listOperators = async (req, res) => {
  try {
    const operators = await Operator.findAll();
    const operatorsResponse = operators.map((operator) => {
      return {
        id: operator.id,
        name: operator.name,
        phone: operator.phone,
        isActive: operator.isActive,
      };
    });
    return res.status(200).json({
      status: "success",
      data: operatorsResponse,
    });
  } catch (error) {
    console.error(`ERROR LIST OPERATORS: ${error}`);
    appendErrorLog(`ERROR LIST OPERATORS: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la liste des opérateurs.",
    });
  }
};

const listActiveOperators = async (req, res) => {
  try {
    const operators = await Operator.findAll({ where: { isActive: true } });
    const operatorsResponse = operators.map((operator) => {
      return {
        id: operator.id,
        name: operator.name,
        phone: operator.phone,
      };
    });
    return res.status(200).json({
      status: "success",
      data: operatorsResponse,
    });
  } catch (error) {
    console.error(`ERROR LIST ACTIVE OPERATORS: ${error}`);
    appendErrorLog(`ERROR LIST ACTIVE OPERATORS: ${error}`);
    return res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de la liste des opérateurs actifs.",
    });
  }
};

const listInactiveOperators = async (req, res) => {
  try {
    const operators = await Operator.findAll({ where: { isActive: false } });
    const operatorsResponse = operators.map((operator) => {
      return {
        id: operator.id,
        name: operator.name,
        phone: operator.phone,
      };
    });
    return res.status(200).json({
      status: "success",
      data: operatorsResponse,
    });
  } catch (error) {
    console.error(`ERROR LIST INACTIVE OPERATORS: ${error}`);
    appendErrorLog(`ERROR LIST INACTIVE OPERATORS: ${error}`);
    return res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de la liste des opérateurs inactifs.",
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "Le nom de la catégorie est requis.",
      });
    }

    // Vérifier si la catégorie existe déjà
    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) {
      return res.status(400).json({
        status: "error",
        message: "Cette catégorie existe déjà.",
      });
    }

    // Création de la catégorie
    await Category.create({ name });

    return res.status(201).json({
      status: "success",
      message: "Catégorie créée avec succès.",
    });
  } catch (error) {
    console.error(`ERROR CREATE CATEGORY: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la création de la catégorie.",
    });
  }
};

const createSubCategory = async (req, res) => {
  try {
    const { name, categoryId } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({
        status: "error",
        message:
          "Le nom de la sous-catégorie et l'ID de la catégorie sont requis.",
      });
    }

    // Vérifier si la catégorie existe
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({
        status: "error",
        message: "La catégorie spécifiée n'existe pas.",
      });
    }

    // Vérifier si la sous-catégorie existe déjà dans cette catégorie
    const existingSubCategory = await SubCategory.findOne({
      where: { name, categoryId },
    });
    if (existingSubCategory) {
      return res.status(400).json({
        status: "error",
        message: "Cette sous-catégorie existe déjà dans cette catégorie.",
      });
    }

    // Création de la sous-catégorie
    await SubCategory.create({ name, categoryId });

    return res.status(201).json({
      status: "success",
      message: "Sous-catégorie créée avec succès.",
    });
  } catch (error) {
    console.error(`ERROR CREATE SUBCATEGORY: ${error}`);
    return res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de la création de la sous-catégorie.",
    });
  }
};

const listCategories = async (req, res) => {
  try {
    const categories = await Category.findAll(
      {
        order: [["id", "ASC"]],
      },
      {
        attributes: ["id", "name"],
      }
    );
    return res.status(200).json({
      status: "success",
      data: categories,
    });
  } catch (error) {
    console.error(`ERROR LIST CATEGORIES: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la liste des catégories.",
    });
  }
};

const listSubCategories = async (req, res) => {
  try {
    const { categoryId } = req.body;
    const subCategories = await SubCategory.findAll(
      { where: { categoryId } },
      {
        attributes: ["id", "name"],
      }
    );
    return res.status(200).json({
      status: "success",
      data: subCategories,
    });
  } catch (error) {
    console.error(`ERROR LIST SUBCATEGORIES: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la liste des sous-catégories.",
    });
  }
};

const listMerchant = async (req, res) => {
  try {
    const merchants = await Merchant.findAll(
      {
        order: [["id", "ASC"]],
      },
      {
        attributes: ["id", "name", "phone", "address", "cni", "rccm", "location"],
      }
    );
    return res.status(200).json({
      status: "success",
      data: merchants,
    });
  } catch (error) {
    console.error(`ERROR LIST MERCHANTS: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la liste des marchands.",
    });
  }
};

const listMerchantByCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;
    const merchants = await Merchant.findAll(
      { where: { categoryId } },
      {
        attributes: ["id", "name", "phone", "address", "cni", "rccm"],
      }
    );
    return res.status(200).json({
      status: "success",
      data: merchants,
    });
  } catch (error) {
    console.error(`ERROR LIST MERCHANTS BY CATEGORY: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la liste des marchands.",
    });
  }
};

const listMerchantBySubCategory = async (req, res) => {
  try {
    const { subcategoryId } = req.body;
    const merchants = await Merchant.findAll(
      { where: { subcategoryId } },
      {
        attributes: ["id", "name", "phone", "address", "cni", "rccm", "location"],
      }
    );

    return res.status(200).json({
      status: "success",
      data: merchants,
    });
  } catch (error) {
    console.error(`ERROR LIST MERCHANTS BY SUBCATEGORY: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la liste des marchands.",
    });
  }
};

const listMerchantsByOperator = async (req, res) => {
  try {
    const { operatorId } = req.body;
    const merchants = await Merchant.findAll(
      { where: { operatorId } },
      {
        attributes: ["id", "name", "phone", "address", "cni", "rccm", "location"],
      }
    );

    return res.status(200).json({
      status: "success",
      data: merchants,
    });
  } catch (error) {
    console.error(`ERROR LIST MERCHANTS BY OPERATOR: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la liste des marchands.",
    });
  }
};

const listTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      order: [["createdAt", "DESC"]],
      attributes: ["id", "ticket", "amount", "createdAt"],
    });
    return res.status(200).json({
      status: "success",
      data: transactions,
    });
  } catch (error) {
    console.error(`ERROR LIST TRANSACTIONS: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la liste des transactions.",
    });
  }
};

const listTransactionsByOperator = async (req, res) => {
  try {
    const { operatorId } = req.body;
    const transactions = await Transaction.findAll(
      { order: [["createdAt", "DESC"]] },
      { where: { operatorId } },
      {
        attributes: ["id", "ticket", "amount", "createdAt"],
      }
    );

    return res.status(200).json({
      status: "success",
      data: transactions,
    });
  } catch (error) {
    console.error(`ERROR LIST TRANSACTIONS BY OPERATOR: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la liste des transactions.",
    });
  }
};

const countTransactionsByOperator = async (req, res) => {
  try {
    const { operatorId } = req.body;
    const count = await Transaction.count({ where: { operatorId } });
    return res.status(200).json({
      status: "success",
      data: count,
    });
  } catch (error) {
    console.error(`ERROR COUNT TRANSACTIONS BY OPERATOR: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors du comptage des transactions.",
    });
  }
};

const countTransactions = async (req, res) => {
  try {
    const count = await Transaction.count();
    return res.status(200).json({
      status: "success",
      data: count,
    });
  } catch (error) {
    console.error(`ERROR COUNT TRANSACTIONS: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors du comptage des transactions.",
    });
  }
};

const countMerchants = async (req, res) => {
  try {
    const count = await Merchant.count();
    return res.status(200).json({
      status: "success",
      data: count,
    });
  } catch (error) {
    console.error(`ERROR COUNT MERCHANTS: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors du comptage des marchands.",
    });
  }
};

const countOperators = async (req, res) => {
  try {
    const count = await Operator.count();
    return res.status(200).json({
      status: "success",
      data: count,
    });
  } catch (error) {
    console.error(`ERROR COUNT OPERATORS: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors du comptage des opérateurs.",
    });
  }
};

const listAdmins = async (req, res) => {
  try {
    const admins = await Admin.findAll();
    return res.status(200).json({
      status: "success",
      data: admins,
    });
  } catch (error) {
    console.error(`ERROR LIST ADMINS: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la liste des administrateurs.",
    });
  }
};

module.exports = {
  login,
  create,
  createOperator,
  updateOperator,
  disableOperator,
  activateOperator,
  listOperators,
  listActiveOperators,
  listInactiveOperators,
  createCategory,
  createSubCategory,
  listCategories,
  listSubCategories,
  listMerchant,
  listMerchantByCategory,
  listMerchantBySubCategory,
  listMerchantsByOperator,
  countOperators,
  countMerchants,
  countTransactions,
  countTransactionsByOperator,
  listTransactions,
  listTransactionsByOperator,
  listAdmins,
};
