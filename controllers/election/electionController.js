// ---------------AUTH CONTROLLERS--------------
// const res = require("express/lib/response");
const OrgSchema = require("../../models/election-model/electionModel");
const jwt = require("jsonwebtoken");

const createToken = (_id) => {
  console.log(process.env.SECRET);
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3d" });
};

const signUpUser = async (req, res) => {
  const { email, password, orgName, contact, library } = req.body;
  console.log(req.body);
  await OrgSchema.register(
    email,
    password,
    orgName,
    library,
    contact,
    req.socket.localPort
  )
    .then((resp) => {
      const token = createToken(resp?._id);
      res.status(201).json({
        message: "Registeration was successfull",
        ok: true,
        success: true,
        token,
        data: {
          email: resp?.email,
          orgName: resp?.orgName,
          orgCode: resp?.orgCode,
          contact: resp?.contact,
          library: resp?.library,
        },
      });
    })
    .catch((error) => {
      res.status(200).json({
        message: error.message,
        ok: true,
        success: false,
      });
    });
};

const confirmEmail = async (req, res) => {
  const { email, token } = req.body;
  const decodedEmail = Buffer.from(email, "base64").toString("ascii");
  await OrgSchema.confirmEmail(decodedEmail, token)
    .then((resp) => {
      res.status(201).json({
        message: "Your email has been confirmed succesfully",
        ok: true,
        success: true,
        data: {
          email: resp.email,
        },
      });
    })
    .catch((error) => {
      res.status(400).json({
        message: error.message,
        ok: true,
        success: false,
      });
    });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  OrgSchema.login(email, password)
    .then((resp) => {
      // create token
      const token = createToken(resp._id);
      res.status(201).json({
        message: "Login was successfull",
        ok: true,
        success: true,
        token,
        data: {
          email: resp.email,
          orgName: resp.orgName,
          orgCode: resp.orgCode,
          library: resp.library,
        },
      });
    })
    .catch((error) => {
      res.status(200).json({
        message: error.message,
        ok: true,
        success: false,
      });
    });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  await OrgSchema.forgotPassword(email, req.socket.localPort)
    .then((resp) => {
      res.status(201).json({
        message: `A reset url has been sent to your email:${resp.email}`,
        ok: true,
        success: true,
        data: {
          email: resp.email,
        },
      });
    })
    .catch((error) => {
      res.status(200).json({
        message: error.message,
        ok: true,
        success: false,
      });
    });
};

const resetPassword = async (req, res) => {
  const { email, password, token } = req.body;
  await OrgSchema.resetPassword(email, password, token)
    .then((resp) => {
      res.status(201).json({
        message: "Your password has been reset succesfully",
        ok: true,
        success: true,
        data: {
          email: resp.email,
        },
      });
    })
    .catch((error) => {
      res.status(200).json({
        message: error.message,
        ok: true,
        success: false,
      });
    });
};

const verifyResetLink = async (req, res) => {
  const { email, token } = req.body;
  const decodedEmail = Buffer.from(email, "base64").toString("ascii");
  await OrgSchema.verifyResetLink(decodedEmail, token)
    .then((resp) => {
      res.status(201).json({
        message: "Link is valid",
        ok: true,
        success: true,
        data: {
          email: resp.email,
        },
      });
    })
    .catch((error) => {
      res.status(200).json({
        message: error.message,
        ok: true,
        success: false,
      });
    });
};

// --------------CRUDE CONTROLLERS---------------
const getElections = async (req, res) => {
  res.json({ message: "get election" });
};
const castVote = async (req, res) => {
  res.json({ message: "cast vote" });
};
const createElection = async (req, res) => {
  res.json({ message: "create election" });
};
const updateElection = async (req, res) => {
  res.json({ message: "update elction" });
};
const getContestants = async (req, res) => {
  res.json({ message: "get contestants" });
};
const deleteElection = async (req, res) => {
  res.json({ message: "get contestants" });
};

module.exports = {
  signUpUser,
  confirmEmail,
  loginUser,
  getElections,
  forgotPassword,
  verifyResetLink,
  resetPassword,

  castVote,
  createElection,
  updateElection,
  getContestants,
  deleteElection,
};
