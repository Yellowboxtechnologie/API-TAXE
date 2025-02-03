const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Operator, Transaction, PaymentMethod } = require("../models");
const { appendErrorLog } = require("../utils/logging");

const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez entrer votre numéro de téléphone pour continuer.",
      });
    }

    if (!password) {
      return res.status(400).json({
        status: "error",
        message:
          "Veuillez entrer votre mot de passe pour accéder à votre compte.",
      });
    }

    const operator = await Operator.findOne({ where: { phone } });
    if (!operator) {
      return res.status(409).json({
        status: "error",
        message:
          "Identifiants invalides, veuillez réessayer plus tard ou contacter l'administrateur.",
      });
    }

    const match = await bcrypt.compare(password, operator.password);
    if (!match) {
      return res.status(409).json({
        status: "error",
        message:
          "Mot de passe invalide, veuillez réessayer plus tard ou contacter l'administrateur.",
      });
    }

    const token = jwt.sign(
      {
        id: operator.id,
        role: "isOperator",
      },
      process.env.JWT_SECRET
    );

    const response = {
      name: operator.name,
      phone: operator.phone,
      token,
    };

    return res.status(200).json({
      status: "success",
      data: response,
    });
  } catch (error) {
    appendErrorLog(`ERROR LOGIN OPERATOR: `, error);
    console.log(`ERROR LOGIN OPERATOR: `, error);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la connexion de l'opérateur.",
    });
  }
};

const lastTransactions = async (req, res) => {
  try {
    const token = req.headers.authorization;
    // Récupérer le worker et vérifier s'il existe
    if (!token) {
      return res
        .status(401)
        .json({ status: "error", message: "Token non fourni." });
    }

    // Vérifie si l'en-tête commence par "Bearer "
    if (!token.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Format de token invalide.",
      });
    }

    // Extrait le token en supprimant le préfixe "Bearer "
    const customToken = token.substring(7);
    let decodedToken;

    try {
      decodedToken = jwt.verify(customToken, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ status: "error", message: "TokenExpiredError" });
      }
      return res
        .status(401)
        .json({ status: "error", message: "Token invalide." });
    }

    const operatorId = decodedToken.id;

    const operator = await Operator.findOne({
      where: { id: operatorId },
    });

    if (!operator) {
      return res.status(404).json({
        status: "error",
        message: "Opérateur non trouvé.",
      });
    }

    const transactions = await Transaction.findAll({
      where: { operatorId },
      attributes: [
        "customerId",
        "operatorId",
        "paymentId",
        "ticket",
        "amount",
        "createdAt",
      ],
      include: [
        {
          model: Customer,
          foreignKey: "customerId",
          attributes: ["id", "name", "phone", "address"],
        },
        {
          model: PaymentMethod,
          foreignKey: "paymentId",
          attributes: ["id", "name"],
        },
      ],
      limit: 10,
      order: [["createdAt", "DESC"]],
      raw: false,
    });

    const formattedTransactions = transactions.map((transaction) => {
      const timeOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Africa/Brazzaville",
      };
      const frenchTime = transaction.createdAt
        .toLocaleTimeString("fr-FR", timeOptions)
        .replace(":", "H");

      const dateOptions = {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Africa/Brazzaville",
      };
      const rawDate = transaction.createdAt.toLocaleDateString(
        "fr-FR",
        dateOptions
      );
      const [weekday, day, month, year] = rawDate.split(" ");
      const frenchDate = `${weekday} ${day} ${
        month.charAt(0).toUpperCase() + month.slice(1)
      } ${year}`;

      return {
        name: transaction.customer.name,
        phone: transaction.customer.phone,
        address: transaction.customer.address,
        paymentMethod: transaction.paymentMethod.name,
        ticket: transaction.ticket,
        amount: transaction.amount,
        time: frenchTime,
        date: frenchDate,
      };
    });

    return res.status(200).json({
      status: "success",
      data: formattedTransactions,
    });
  } catch (error) {
    appendErrorLog(`ERROR GET LASTEST TRANSACTIONS OPERATOR: `, error);
    console.log(`ERROR GET LASTEST TRANSACTIONS OPERATOR: `, error);
    return res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de la récupération des derniers transactions.",
    });
  }
};

const transactions = async (req, res) => {
  try {
    const token = req.headers.authorization;
    // Récupérer le worker et vérifier s'il existe
    if (!token) {
      return res
        .status(401)
        .json({ status: "error", message: "Token non fourni." });
    }

    // Vérifie si l'en-tête commence par "Bearer "
    if (!token.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Format de token invalide.",
      });
    }

    // Extrait le token en supprimant le préfixe "Bearer "
    const customToken = token.substring(7);
    let decodedToken;

    try {
      decodedToken = jwt.verify(customToken, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ status: "error", message: "TokenExpiredError" });
      }
      return res
        .status(401)
        .json({ status: "error", message: "Token invalide." });
    }

    const operatorId = decodedToken.id;

    const operator = await Operator.findOne({
      where: { id: operatorId },
    });

    if (!operator) {
      return res.status(404).json({
        status: "error",
        message: "Opérateur non trouvé.",
      });
    }

    const transactions = await Transaction.findAll({
      where: { operatorId },
      attributes: [
        "customerId",
        "operatorId",
        "paymentId",
        "ticket",
        "amount",
        "createdAt",
      ],
      include: [
        {
          model: Customer,
          foreignKey: "customerId",
          attributes: ["id", "name", "phone", "address"],
        },
        {
          model: PaymentMethod,
          foreignKey: "paymentId",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
      raw: false,
    });

    const formattedTransactions = transactions.map((transaction) => {
      const timeOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Africa/Brazzaville",
      };
      const frenchTime = transaction.createdAt
        .toLocaleTimeString("fr-FR", timeOptions)
        .replace(":", "H");

      const dateOptions = {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Africa/Brazzaville",
      };
      const rawDate = transaction.createdAt.toLocaleDateString(
        "fr-FR",
        dateOptions
      );
      const [weekday, day, month, year] = rawDate.split(" ");
      const frenchDate = `${weekday} ${day} ${
        month.charAt(0).toUpperCase() + month.slice(1)
      } ${year}`;

      return {
        name: transaction.customer.name,
        phone: transaction.customer.phone,
        address: transaction.customer.address,
        paymentMethod: transaction.paymentMethod.name,
        ticket: transaction.ticket,
        amount: transaction.amount,
        time: frenchTime,
        date: frenchDate,
      };
    });

    return res.status(200).json({
      status: "success",
      data: formattedTransactions,
    });
  } catch (error) {
    appendErrorLog(`ERROR GET TRANSACTIONS OPERATOR: `, error);
    console.log(`ERROR GET TRANSACTIONS OPERATOR: `, error);
    return res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de la récupération des transactions.",
    });
  }
};

module.exports = { login, transactions, lastTransactions };
