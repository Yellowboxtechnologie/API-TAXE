const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Admin } = require("../models");
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
        message: "Veuillez entrer votre mot de passe pour accéder à votre compte.",
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
        message: "Le mot de passe saisi est incorrect. Merci de réessayer ou de réinitialiser votre mot de passe si nécessaire.",
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
      message: "Une erreur est survenue lors de la connexion. Veuillez vérifier vos informations ou réessayer plus tard.",
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
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
    });
    return res.status(200).json({
      status: "success",
      data: admin,
      message: "Le compte administrateur a bien été créé avec succès.",
    });
  } catch (error) {
    console.error(`ERROR CREATE ADMIN: ${error}`);
    appendErrorLog(`ERROR CREATE ADMIN: ${error}`);
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la création du compte administrateur. Veuillez vérifier vos informations ou réessayer plus tard.",
    });
  }
};

module.exports = { login, create };