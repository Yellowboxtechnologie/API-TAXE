const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { Merchant, Transaction, Authentication, SubCategory } = require("../models");
const { sequelize } = require("../models");
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

    const merchant = await Merchant.findOne({
      where: { phone },
      attributes: [
        "id",
        "name",
        "phone",
        "address",
        "cni",
        "rccm",
        "qrcode",
        "password",
        "isActive",
      ],
      include: [
        {
          model: SubCategory,
          attributes: ["id", "name"],
        },
      ],
    });

    if (!merchant) {
      return res.status(409).json({
        status: "error",
        message:
          "Nous n'avons pas pu trouver un compte correspondant. Veuillez vérifier vos informations et réessayer.",
      });
    }

    if (!merchant.isActive) {
      return res.status(401).json({
        status: "error",
        message:
          "Votre compte est actuellement désactivé. Veuillez finaliser votre inscription sur l'application pour activer votre compte et pouvoir vous connecter.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, merchant.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message:
          "Le mot de passe saisi est incorrect. Merci de réessayer ou de réinitialiser votre mot de passe si nécessaire.",
      });
    }

    const token = jwt.sign(
      {
        id: merchant.id,
      },
      process.env.JWT_SECRET
    );

    const merchantResponse = {
      name: merchant.name,
      phone: merchant.phone,
      address: merchant.address,
      cni: merchant.cni,
      rccm: merchant.rccm,
      qrcode: merchant.qrcode,
      subcategoryName: merchant.SubCategory.name,
      token: token,
    };

    return res.status(200).json({
      status: "success",
      data: merchantResponse,
    });
  } catch (error) {
    console.error(`ERROR LOGIN MERCHANT: ${error}`);
    appendErrorLog(`ERROR LOGIN MERCHANT: ${error}`);
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

    const merchantId = decodedToken.id;

    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) {
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
      merchant.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message:
          "Le mot de passe saisi est invalide ou ne correspond pas. Merci de réessayer.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await merchant.update({ password: hashedPassword });
    return res.status(200).json({
      status: "success",
      message:
        "Votre mot de passe a été mis à jour avec succès ! Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
    });
  } catch (error) {
    console.error(`ERROR UPDATE PASSWORD MERCHANT: ${error}`);
    appendErrorLog(`ERROR UPDATE PASSWORD MERCHANT: ${error}`);
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

    const merchantId = decodedToken.id;
    const existingMerchant = await Merchant.findByPk(merchantId);
    if (!existingMerchant) {
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

    await Merchant.update(
      { token },
      {
        where: { id: merchantId },
      }
    );

    return res.status(200).json({
      status: "success",
      message: "Le token a été mis à jour avec succès.",
    });
  } catch (error) {
    console.error(`ERROR UPDATE MERCHANT TOKEN: ${error}`);
    appendErrorLog(`ERROR UPDATE MERCHANT TOKEN: ${error.message}`);
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

    const merchantId = decodedToken.id;

    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) {
      return res.status(404).json({
        status: "error",
        message:
          "Nous n’avons pas pu trouver de compte correspondant. Veuillez vérifier vos informations ou créer un nouveau compte.",
      });
    }

    const transactions = await Transaction.findAll({
      where: { merchantId },
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
    console.error(`ERROR TRANSACTION MERCHANT: ${error}`);
    appendErrorLog(`ERROR TRANSACTION MERCHANT: ${error.message}`);
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

    const merchantId = decodedToken.id;

    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) {
      return res.status(404).json({
        status: "error",
        message:
          "Nous n’avons pas pu trouver de compte correspondant. Veuillez vérifier vos informations ou créer un nouveau compte.",
      });
    }

    const newPhone = `DELETED_${merchant.phone}`;

    await Merchant.update(
      {
        phone: newPhone,
      },
      {
        where: {
          id: merchantId,
        },
      }
    );
    return res.status(200).json({
      status: "success",
      message:
        "Votre compte a été supprimé avec succès. Nous espérons vous revoir bientôt !",
    });
  } catch (error) {
    console.error(`ERROR DELETE MERCHANT: ${error}`);
    appendErrorLog(`ERROR DELETE MERCHANT: ${error}`);
    return res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de la suppression de votre compte. Veuillez réessayer ou contacter notre support pour obtenir de l'aide.",
    });
  }
};

const verifyPhone = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir votre numéro de téléphone.",
      });
    }

    // Vérifier si le numéro de téléphone existe
    const existingMerchant = await Merchant.findOne({ where: { phone } });
    if (!existingMerchant) {
      return res.status(404).json({
        status: "error",
        message:
          "Ce numéro de téléphone n'est pas enregistré sur notre plateforme.",
      });
    }

    // Vérifier si le numéro de téléphone est déjà verifié
    if (existingMerchant.verified) {
      return res.status(400).json({
        status: "error",
        message: "Ce numéro de téléphone a déjà été verifié.",
      });
    }

    const merchantPhone = existingMerchant.phone;

    // Vérifier si un code OTP non utilisé existe déjà pour cet opérateur
    let authentication = await Authentication.findOne({
      where: { merchantId: existingMerchant.id, isUsed: false },
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
          merchantId: existingMerchant.id,
          code: codeOtp,
          isUsed: false,
        },
        { transaction }
      );
    }

    // Préparation du message à envoyer
    const message = `Votre code de confirmation est : ${codeOtp}. Ne le partagez avec personne pour des raisons de sécurité.`;

    // Envoi du SMS via l'API Wirepick
    const wirepickUrl = `https://api.wirepick.com/httpsms/send?client=nyota242&password=Nyota@2024&phone=242${merchantPhone}&text=${encodeURIComponent(
      message
    )}&from=LAPOINTE`;

    const response = await fetch(wirepickUrl);
    const responseBody = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        status: "error",
        message:
          "L'envoi du code de vérification a échoué. Veuillez vérifier votre connexion ou réessayer plus tard.",
        details: responseBody,
      });
    }

    const token = jwt.sign({ id: existingMerchant.id }, process.env.JWT_SECRET);

    await transaction.commit();
    return res.status(200).json({
      status: "success",
      message: "Le code de vérification a été envoyé avec succès.",
      data: {
        token: token,
        name: existingMerchant.name,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error(`ERROR VERIFY PHONE: ${error}`);
    appendErrorLog(`ERROR VERIFY PHONE: ${error}`);
    return res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de la vérification de votre numéro de téléphone. Veuillez réessayer ou contacter notre support pour obtenir de l'aide.",
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

    const existingMerchant = await Merchant.findByPk(currentUserId);
    if (!existingMerchant) {
      return res.status(404).json({
        status: "error",
        message:
          "Aucun compte correspondant trouvé. Veuillez vérifier vos informations ou créer un nouveau compte.",
      });
    }

    // Vérifie si un code OTP non utilisé correspond au client et au code fourni
    const authenticationCode = await Authentication.findOne({
      where: {
        merchantId: currentUserId,
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

    // Réponse avec succès
    return res.status(200).json({
      status: "success",
      message:
        "Votre code OTP a été vérifié avec succès. Vous pouvez maintenant poursuivre.",
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

const createPassword = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir un mot de passe.",
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

    const existingMerchant = await Merchant.findByPk(currentUserId);
    if (!existingMerchant) {
      return res.status(404).json({
        status: "error",
        message:
          "Aucun compte correspondant trouvé. Veuillez vérifier vos informations ou créer un nouveau compte.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    existingMerchant.password = hashedPassword;
    await existingMerchant.save();

    return res.status(200).json({
      status: "success",
      message: "Votre mot de passe a été créé avec succès.",
    });
  } catch (error) {
    console.error(`Error lors de la création du mot de passe: ${error}`);
    appendErrorLog(`Error lors de la création du mot de passe: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la création du mot de passe.",
    });
  }
};

module.exports = {
  login,
  updatePassword,
  updateToken,
  transactions,
  destroy,
  verifyPhone,
  vatidateOtp,
  createPassword,
};
