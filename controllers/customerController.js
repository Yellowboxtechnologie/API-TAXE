const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { Customer, Transaction, Authentication } = require("../models");
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

    const customer = await Customer.findOne({
      where: { phone },
      attributes: [
        "id",
        "name",
        "address",
        "cni",
        "rccm",
        "activity",
        "password",
        "qrcode",
      ],
    });

    if (!customer) {
      return res.status(409).json({
        status: "error",
        message:
          "Nous n'avons pas pu trouver un compte correspondant. Veuillez vérifier vos informations et réessayer.",
      });
    }

    if (!customer.isActive) {
      return res.status(401).json({
        status: "error",
        message:
          "Votre compte est actuellement désactivé. Veuillez finaliser votre inscription sur l'application pour activer votre compte et pouvoir vous connecter.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message:
          "Le mot de passe saisi est incorrect. Merci de réessayer ou de réinitialiser votre mot de passe si nécessaire.",
      });
    }

    const token = jwt.sign(
      {
        id: customer.id,
      },
      process.env.JWT_SECRET
    );

    const customerResponse = {
      name: customer.name,
      address: customer.address,
      cni: customer.cni,
      rccm: customer.rccm,
      activity: customer.activity,
      qrcode: customer.qrcode,
      token: token,
    };

    return res.status(200).json({
      status: "success",
      data: customerResponse,
    });
  } catch (error) {
    console.error(`ERROR LOGIN CUSTOMER: ${error}`);
    appendErrorLog(`ERROR LOGIN CUSTOMER: ${error}`);
    return res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de la connexion. Veuillez vérifier votre connexion internet et réessayer.",
    });
  }
};

const updatePassword = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const { oldPassword, newPassword } = req.body;

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

    const customerId = decodedToken.id;

    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        status: "error",
        message:
          "Aucun compte correspondant trouvé. Veuillez vérifier vos informations ou créer un nouveau compte.",
      });
    }

    if (!oldPassword) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez saisir votre mot de passe actuel pour continuer.",
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez saisir un nouveau mot de passe pour poursuivre.",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      customer.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message:
          "Le mot de passe saisi est invalide ou ne correspond pas. Merci de réessayer.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await customer.update({ password: hashedPassword });
    return res.status(200).json({
      status: "success",
      message:
        "Votre mot de passe a été mis à jour avec succès ! Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
    });
  } catch (error) {
    console.error(`ERROR UPDATE PASSWORD CUSTOMER: ${error}`);
    appendErrorLog(`ERROR UPDATE PASSWORD CUSTOMER: ${error}`);
    return res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la mise à jour de votre mot de passe. Veuillez réessayer plus tard.",
    });
  }
};

const updateToken = async (req, res) => {
  try {
    const tokenHeader = req.headers.authorization;
    const { token } = req.body;
    if (!tokenHeader) {
      return res
        .status(401)
        .json({ status: "error", message: "Token non fourni." });
    }

    // Vérifie si l'en-tête commence par "Bearer "
    if (!tokenHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Format de token invalide.",
      });
    }

    // Extrait le token en supprimant le préfixe "Bearer "
    const customToken = tokenHeader.substring(7);
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

    const customerId = decodedToken.id;
    const existingCustomer = await Customer.findByPk(customerId);
    if (!existingCustomer) {
      return res.status(404).json({
        status: "error",
        message: "Ce compte n'existe pas.",
      });
    }

    if (!token) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir un token.",
      });
    }

    await Customer.update(
      { token },
      {
        where: { id: customerId },
      }
    );

    return res.status(200).json({
      status: "success",
      message: "Le token a été mis à jour avec succès.",
    });
  } catch (error) {
    console.error(`ERROR UPDATE CUSTOMER TOKEN: ${error}`);
    appendErrorLog(`ERROR UPDATE CUSTOMER TOKEN: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message:
        "Une erreur s'est produite lors de la mise à jours du mot de passe.",
    });
  }
};

const transactions = async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Token non fourni.",
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
    const workerToken = token.substring(7);
    let decodedToken;

    try {
      decodedToken = jwt.verify(workerToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        status: "error",
        message: "Token invalide ou expiré.",
      });
    }

    const customerId = decodedToken.id;

    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        status: "error",
        message:
          "Nous n’avons pas pu trouver de compte correspondant. Veuillez vérifier vos informations ou créer un nouveau compte.",
      });
    }

    const transactions = await Transaction.findAll({
      where: { customerId },
      attributes: ["ticket", "amount", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    const response = transactions.map((transaction) => {
      return {
        ticket: transaction.ticket,
        amount: transaction.amount,
        createdAt: transaction.createdAt,
      };
    });

    return res.status(200).json({
      status: "success",
      data: response,
    });
  } catch (error) {
    console.error(`ERROR TRANSACTION CUSTOMER: ${error}`);
    appendErrorLog(`ERROR TRANSACTION CUSTOMER: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors du chargement de vos transactions. Veuillez vérifier votre connexion internet et réessayer.",
    });
  }
};

const destroy = async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Token non fourni.",
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
    const workerToken = token.substring(7);
    let decodedToken;

    try {
      decodedToken = jwt.verify(workerToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        status: "error",
        message: "Token invalide ou expiré.",
      });
    }

    const customerId = decodedToken.id;

    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        status: "error",
        message:
          "Nous n’avons pas pu trouver de compte correspondant. Veuillez vérifier vos informations ou créer un nouveau compte.",
      });
    }

    const newPhone = `DELETED_${customer.phone}`;

    await Customer.update(
      {
        phone: newPhone,
      },
      {
        where: {
          id: customerId,
        },
      }
    );
    return res.status(200).json({
      status: "success",
      message:
        "Votre compte a été supprimé avec succès. Nous espérons vous revoir bientôt !",
    });
  } catch (error) {
    console.error(`ERROR DELETE CUSTOMER: ${error}`);
    appendErrorLog(`ERROR DELETE CUSTOMER: ${error}`);
    return res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de la suppression de votre compte. Veuillez réessayer ou contacter notre support pour obtenir de l'aide.",
    });
  }
};

const veriryOtp = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir un code QR valide.",
      });
    }

    // Recherche du client associé au QR code
    const customer = await Customer.findOne({
      attributes: [
        "id",
        "uuid",
        "name",
        "address",
        "cni",
        "rccm",
        "activity",
        "qrcode",
        "isActive",
      ],
      where: { uuid: code },
    });

    if (!customer) {
      return res.status(404).json({
        status: "error",
        message:
          "Cette carte n'existe pas ou n'est associée à aucun compte client.",
      });
    }

    if (customer.isActive) {
      return res.status(400).json({
        status: "error",
        message:
          "Votre compte est actuellement actif. Veuillez vous connecter en utilisant votre numéro de téléphone et votre mot de passe.",
      });
    }

    // Vérifier si le code est correct
    const otpCode = customer.uuid;
    if (otpCode !== code) {
      return res.status(400).json({
        status: "error",
        message: "Le code QR fourni est incorrect.",
      });
    }

    // Supprimer 00242  au debut du phone
    const newPhone = customer.phone;

    // Préparation du message à envoyer
    const message = `Votre numéro d'enregistrement est : ${otpCode}. Ne le partagez avec personne pour des raisons de securite.`;

    // Envoi du SMS via l'API Wirepick
    const wirepickUrl = `https://api.wirepick.com/httpsms/send?client=nyota242&password=Nyota@2024&phone=242${newPhone}&text=${encodeURIComponent(
      message
    )}&from=YELLOWPAY`;

    const response = await fetch(wirepickUrl);
    const responseBody = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        status: "error",
        message:
          "L'envoi du code de verification a échoué. Veuillez vérifier votre connexion ou réessayer plus tard.",
        details: responseBody,
      });
    }

    // Génération d'un token JWT pour l'utilisateur
    const token = jwt.sign({ id: customer.id }, process.env.JWT_SECRET, {
      expiresIn: "5m",
    });

    return res.status(200).json({
      status: "success",
      data: {
        token: token,
      },
    });
  } catch (error) {
    console.error(`Error lors du scan de la carte client: ${error}`);
    appendErrorLog(`Error lors du scan de la carte client: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors du scan de la carte client.",
    });
  }
};

const vatidateOtp = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir un code OTP valide.",
      });
    }

    // Vérifie si le code est un entier
    const codeNumber = parseInt(code, 10);
    if (isNaN(codeNumber)) {
      return res.status(400).json({
        status: "error",
        message:
          "Le code OTP que vous avez entré n'est pas valide. Veuillez vérifier le code et réessayer.",
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

    const existingCustomer = await Customer.findByPk(currentUserId);
    if (!existingCustomer) {
      return res.status(404).json({
        status: "error",
        message:
          "Aucun compte correspondant trouvé. Veuillez vérifier vos informations ou créer un nouveau compte.",
      });
    }

    // Vérifie si un code OTP non utilisé correspond au client et au code fourni
    const authenticationCode = await Authentication.findOne({
      where: {
        customerId: currentUserId,
        code: code,
        isUsed: false,
      },
    });

    if (!authenticationCode) {
      return res.status(400).json({
        status: "error",
        message:
          "Le code OTP que vous avez entré est incorrect ou a expiré. Veuillez vérifier le code et réessayer, ou demandez un nouveau code OTP.",
      });
    }

    // Marque le code OTP comme utilisé
    authenticationCode.isUsed = true;
    await authenticationCode.save();

    const tokenCustomer = jwt.sign(
      { id: existingCustomer.id },
      process.env.JWT_SECRET
    );

    // Réponse avec succès
    return res.status(200).json({
      status: "success",
      message:
        "Votre code OTP a été vérifié avec succès. Vous pouvez maintenant poursuivre.",
      data: {
        token: tokenCustomer,
      },
    });
  } catch (error) {
    console.error(`Error lors de la validation du code OTP: ${error}`);
    appendErrorLog(`Error lors de la validation du code OTP: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la validation du code OTP.",
    });
  }
};

module.exports = { login, updatePassword, updateToken, transactions, destroy };
