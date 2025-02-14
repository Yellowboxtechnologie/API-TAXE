const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const {
  Operator,
  Transaction,
  PaymentMethod,
  Merchant,
  SubCategory,
  Authentication,
} = require("../models");
const { sequelize } = require("../models");
const { Op } = require("sequelize");
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

    // Vérifie si le mot de passe est null
    if (!operator.password) {
      return res.status(403).json({
        status: "error",
        message:
          "Votre compte doit être confirmé avant de pouvoir accéder à l'application. Veuillez finaliser votre inscription en créant un mot de passe.",
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

const confirmAccount = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir votre numéro de téléphone pour vérification.",
      });
    }

    const operator = await Operator.findOne({ where: { phone } });
    if (!operator) {
      return res.status(404).json({
        status: "error",
        message: "Aucun compte opérateur trouvé avec ce numéro de téléphone.",
      });
    }

    const operatorPhone = operator.phone;

    // Vérifier si un code OTP non utilisé existe déjà pour cet opérateur
    let authentication = await Authentication.findOne({
      where: { operatorId: operator.id, isUsed: false },
    });

    let codeOtp;

    if (authentication) {
      // Si un code existe déjà et n'a pas été utilisé, on le réutilise
      codeOtp = authentication.code;
    } else {
      // Sinon, générer un NOUVEAU code OTP (toujours 4 chiffres, sans commencer par 0)
      codeOtp = Math.floor(1000 + Math.random() * 9000);

      // Créer un nouvel OTP
      authentication = await Authentication.create(
        {
          operatorId: operator.id,
          code: codeOtp,
          isUsed: false,
        },
        { transaction }
      );
    }

    // Préparation du message à envoyer
    const message = `Votre code de confirmation est : ${codeOtp}. Ne le partagez avec personne pour des raisons de securite.`;

    // Envoi du SMS via l'API Wirepick
    const wirepickUrl = `https://api.wirepick.com/httpsms/send?client=nyota242&password=Nyota@2024&phone=242${operatorPhone}&text=${encodeURIComponent(
      message
    )}&from=LAPOINTE`;

    const response = await fetch(wirepickUrl);
    const responseBody = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        status: "error",
        message: "L'envoi du code de vérification a échoué. Veuillez vérifier votre connexion ou réessayer plus tard.",
        details: responseBody,
      });
    }
    console.log(`response ok ${responseBody}`);

    await transaction.commit();
    return res.status(200).json({
      status: "success",
      message: "Le code de confirmation a été envoyé avec succès. Veuillez vérifier vos SMS pour confirmer votre compte.",
    });

  } catch (error) {
    await transaction.rollback();
    console.error(`ERROR CONFIRM ACCOUNT: ${error}`);
    appendErrorLog(`ERROR CONFIRM ACCOUNT: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la confirmation du compte.",
    });
  }
};

const validationAccount = async (req, res) => {
  try {
    const { code, phone } = req.body;
    if(!phone) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le numéro de téléphone.",
      });
    }


    const existingOperator = await Operator.findOne({ where: { phone } });
    if (!existingOperator) {
      return res.status(404).json({
        status: "error",
        message:
          "Aucun compte correspondant trouvé. Veuillez vérifier vos informations ou créer un nouveau compte.",
      });
    }

    const currentOperatorId = existingOperator.id;

    if (!code) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le code de confirmation.",
      });
    }

    const existingAuthentication = await Authentication.findOne({
      where: {
        operatorId: currentOperatorId,    
        code: code,
        isUsed: false,
      },
    });

    if (!existingAuthentication) {
      return res.status(400).json({
        status: "error",
        message:
          "Le code OTP que vous avez entré est incorrect, expiré ou a déjà été utilisé. Veuillez vérifier le code et réessayer, ou demandez un nouveau code OTP.",
      });
    }

    // Marque le code comme utilisé
    const authenticationCode = await Authentication.findByPk(existingAuthentication.id);
    if (!authenticationCode) {
      return res.status(404).json({
        status: "error",
        message: "Le code OTP n'existe pas.",
      });
    }
    authenticationCode.isUsed = true;
    await authenticationCode.save();

     // Token JWT
     const tokenUser = jwt.sign(
      { id: existingOperator.id},
      process.env.JWT_SECRET,
    );

    const response = {
      name: existingOperator.name,
      phone: existingOperator.phone,
      token: tokenUser,
    };

    return res.status(200).json({
      status: "success",
      message: "Votre code OTP a été vérifié avec succès. Vous pouvez maintenant poursuivre.",
      data: response,
    });
  } catch (error) {
    console.error(`ERROR VALIDATION ACCOUNT: ${error}`);
    appendErrorLog(`ERROR VALIDATION ACCOUNT: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la validation du compte.",
    });
  }
}

const updatePassword = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const { password } = req.body;
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Votre session a expiré. Veuillez vous reconnecter.",
      });
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
        return res.status(401).json({
          status: "error",
          message: "Votre session a expiré. Veuillez vous reconnecter.",
        });
      }
      return res.status(401).json({
        status: "error",
        message:
          "Le token fourni est incorrect. Veuillez vérifier le token et réessayer.",
      });
    }

    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message:
          "Le token fourni est incorrect. Veuillez vérifier le token et réessayer.",
      });
    }

    const currentOperatorId = decodedToken.id;

    const existingOperator = await Operator.findByPk(currentOperatorId);
    if (!existingOperator) {
      return res.status(404).json({
        status: "error",
        message:
          "Aucun compte correspondant trouvé. Veuillez vérifier vos informations ou créer un nouveau compte.",
      });
    }

    if (!password) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir votre nouveau mot de passe.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    existingOperator.password = hashedPassword;
    await existingOperator.save();

    return res.status(200).json({
      status: "success",
      message: "Votre mot de passe a été crée avec succès, vous pouvez maintenant vous connecter.",
    });
  } catch (error) {
    console.error(`ERROR UPDATE PASSWORD: ${error}`);
    appendErrorLog(`ERROR UPDATE PASSWORD: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la mise à jour du mot de passe.",
    });
  }
}

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

    // Définition de la plage de temps pour la journée courante
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Récupération des transactions du jour
    const transactions = await Transaction.findAll({
      where: {
        operatorId,
        createdAt: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
      attributes: [
        "merchantId",
        "operatorId",
        "paymentId",
        "ticket",
        "amount",
        "createdAt",
      ],
      include: [
        {
          model: Merchant,
          attributes: ["id", "name", "phone", "address"],
        },
        {
          model: PaymentMethod,
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
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
        name: transaction.Merchant.name,
        phone: transaction.Merchant.phone,
        address: transaction.Merchant.address,
        paymentMethod: transaction.PaymentMethod.name,
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
        "merchantId",
        "operatorId",
        "paymentId",
        "ticket",
        "amount",
        "createdAt",
      ],
      include: [
        {
          model: Merchant,
          foreignKey: "merchantId",
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
        name: transaction.merchant.name,
        phone: transaction.merchant.phone,
        address: transaction.merchant.address,
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

const createMerchant = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const {
      subcategoryId,
      location,
      name,
      phone,
      address,
      cni,
      rccm,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le nom du marchant.",
      });
    }

    if (!location) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir la localisation du marchant.",
      });
    }

    if (!phone) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le numéro du marchant.",
      });
    }

    if (!address) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir l'adresse du marchant.",
      });
    }

    if (!cni) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le numéro de CNI du marchant.",
      });
    }

    if (!rccm) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le numéro de RCCM du marchant.",
      });
    }

    if (!subcategoryId) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir l'ID de la sous-activité.",
      });
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Votre session a expiré. Veuillez vous reconnecter.",
      });
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
        return res.status(401).json({
          status: "error",
          message: "Votre session a expiré. Veuillez vous reconnecter.",
        });
      }
      return res.status(401).json({
        status: "error",
        message:
          "Le token fourni est incorrect. Veuillez vérifier le token et réessayer.",
      });
    }

    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message:
          "Le token fourni est incorrect. Veuillez vérifier le token et réessayer.",
      });
    }

    const currentUserId = decodedToken.id;

    const operator = await Operator.findByPk(currentUserId);
    if (!operator) {
      return res.status(404).json({
        status: "error",
        message: "Aucun compte correspondant trouvé. Veuillez vérifier vos informations ou créer un nouveau compte.",
      });
    }

    const merchant = await Merchant.findOne({ where: { phone } });
    if (merchant) {
      return res.status(409).json({
        status: "error",
        message: "Un compte opérateur avec ce numéro de téléphone existe déjà.",
      });
    }

    const subActivity = await SubCategory.findByPk(subcategoryId);

    if (!subActivity) {
      return res.status(404).json({
        status: "error",
        message: "Activité non trouvé.",
      });
    }

    await Merchant.create({
      operatorId: operator.id,
      subcategoryId: subcategoryId,
      location,
      name,
      phone,
      address,
      cni,
      rccm,
      qrcode: uuidv4(),
    });

    const message = `CCIAM. ${name}. Vous avez été enregistré avec succès sur notre plateforme de paiement.`;

    // Envoi du SMS via l'API Wirepick
    const wirepickUrl = `https://api.wirepick.com/httpsms/send?client=nyota242&password=Nyota@2024&phone=242${phone}&text=${encodeURIComponent(
      message
    )}&from=LAPOINTE`;

    const response = await fetch(wirepickUrl);
    const responseBody = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        status: "error",
        message: "L'envoi du code de vérification a échoué. Veuillez vérifier votre connexion ou réessayer plus tard.",
        details: responseBody,
      });
    }
    console.log(`response ok ${responseBody}`);

    return res.status(201).json({
      status: "success",
      message: "Le marchand à bien été crée avec succès.",
    });
  } catch (error) {
    appendErrorLog(`ERROR CREATE OPERATOR: `, error);
    console.log(`ERROR CREATE OPERATOR: `, error);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la création de l'opérateur.",
    });
  }
};

const curentAmount = async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Votre session a expiré. Veuillez vous reconnecter.",
      });
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
        return res.status(401).json({
          status: "error",
          message: "Votre session a expiré. Veuillez vous reconnecter.",
        });
      }
      return res.status(401).json({
        status: "error",
        message:
          "Le token fourni est incorrect. Veuillez vérifier le token et réessayer.",
      });
    }

    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message:
          "Le token fourni est incorrect. Veuillez vérifier le token et réessayer.",
      });
    }

    const currentOperatorId = decodedToken.id;

    const existingOperator = await Operator.findByPk(currentOperatorId);
    if (!existingOperator) {
      return res.status(404).json({
        status: "error",
        message:
          "Aucun compte correspondant trouvé. Veuillez vérifier vos informations ou créer un nouveau compte.",
      });
    }

    // Récupérer la date du jour à minuit
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Récupérer la date actuelle
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Calculer le montant total des transactions du jour
    const totalAmount = await Transaction.sum("amount", {
      where: {
        createdAt: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });

    return res.status(200).json({
      status: "success",
      data: {
        amount: totalAmount || 0,
      },
    });
    
  } catch (error) {
    console.error(`ERROR SOLDE ACCOUNT: ${error}`);
    appendErrorLog(`ERROR SOLDE ACCOUNT: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la SOLDE du compte.",
    });
  }
}

const pay = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const { phone, amount } = req.body;

    if (!phone) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le numéro de téléphone du marchand.",
      });
    }

    if (!amount) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir le montant de l'opération.",
      });
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Votre session a expiré. Veuillez vous reconnecter.",
      });
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
        return res.status(401).json({
          status: "error",
          message: "Votre session a expiré. Veuillez vous reconnecter.",
        });
      }
      return res.status(401).json({
        status: "error",
        message:
          "Le token fourni est incorrect. Veuillez vérifier le token et réessayer.",
      });
    }

    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message:
          "Le token fourni est incorrect. Veuillez vérifier le token et réessayer.",
      });
    }

    const currentOperatorId = decodedToken.id;

    const existingOperator = await Operator.findByPk(currentOperatorId);
    if (!existingOperator) {
      return res.status(404).json({
        status: "error",
        message:
          "Aucun compte correspondant trouvé. Veuillez vérifier vos informations ou créer un nouveau compte.",
      });
    }

    const existingMerchant = await Merchant.findOne({ where: { phone } });
    if (!existingMerchant) {
      return res.status(404).json({
        status: "error",
        message: "Aucun compte marchand trouve.",
      });
    }

    const generateUniqueTicket = () => {
      const prefix = "CCIAM";
      const timestamp = Date.now().toString(36); // Convertir le timestamp en base 36
      const randomString = Math.random().toString(36).substring(2, 8); // Générer une chaîne aléatoire
    
      return `TICKET-${prefix}-${timestamp}-${randomString}`;
    };
    
    // Exemple d'utilisation
    const uniqueTicket = generateUniqueTicket();

    const transaction = await Transaction.create({
      merchantId: existingMerchant.id,
      operatorId: existingOperator.id,
      amount: amount,
      ticket: uniqueTicket,
      paymentId: 1,
    });


    const message = `Hello, ${existingMerchant.name}. Vous avez paye ${amount} FCFA. Votre facture est : ${uniqueTicket}`;

    // Envoi du SMS via l'API Wirepick
    const wirepickUrl = `https://api.wirepick.com/httpsms/send?client=nyota242&password=Nyota@2024&phone=242${phone}&text=${encodeURIComponent(
      message
    )}&from=LAPOINTE`;

    const response = await fetch(wirepickUrl);
    const responseBody = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        status: "error",
        message: "L'envoi du code de vérification a échoué. Veuillez vérifier votre connexion ou réessayer plus tard.",
        details: responseBody,
      });
    }
    console.log(`response ok ${responseBody}`);

    return res.status(200).json({
      status: "success",
      message: "Paiement effectué avec succès.",
      data: transaction,
    });
    
  } catch (error) {
    console.log(`ERROR PAY: ${error}`);
    appendErrorLog(`ERROR PAY: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue. Veuillez réessayer plus tard.",
    });
  }
}



module.exports = {
  login,
  transactions,
  lastTransactions,
  createMerchant,
  confirmAccount,
  validationAccount,
  updatePassword,
  curentAmount,
  pay,
};
