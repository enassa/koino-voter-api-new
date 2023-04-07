// ---------------AUTH CONTROLLERS--------------
// const res = require("express/lib/response");
const OrgSchema = require("../../models/election-model/electionModel");
const jwt = require("jsonwebtoken");

const createToken = (_id) => {
  console.log(process.env.SECRET);
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3d" });
};

const signUpUser = async (req, res) => {
  const { email, password, orgName, contact } = req.body;
  console.log(
    "constroller",
    email,
    password,
    orgName,
    contact,
    req.socket.localPort
  );
  try {
    const election = await OrgSchema.register(
      email,
      password,
      orgName,
      contact,
      req.socket.localPort
    );
    // create token
    const token = createToken(election._id);

    res.status(201).json({
      message: "Registeration was successfull",
      ok: true,
      success: true,
      token,
      data: {
        email: election.email,
        orgName: election.orgName,
        orgCode: election.orgCode,
        contact: election.contact,
      },
    });
  } catch (error) {
    res.status(200).json({
      message: error.message,
      ok: true,
      success: false,
    });
  }
};
const confirmEmail = async (req, res) => {
  const { email, token } = req.body;
  const decodedEmail = Buffer.from(email, "base64").toString("ascii");
  try {
    const election = await OrgSchema.confirmEmail(decodedEmail, token);
    // create token
    res.status(201).json({
      message: "Your email has been confirmed succesfully",
      ok: true,
      success: true,
      data: {
        email: election.email,
      },
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
      ok: true,
      success: false,
    });
  }
};
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const election = await OrgSchema.login(email, password);
    // create token
    const token = createToken(election._id);

    res.status(201).json({
      message: "Login was successfull",
      ok: true,
      success: true,
      token,
      data: {
        email: election.email,
        orgName: election.orgName,
        orgCode: election.orgCode,
      },
    });
  } catch (error) {
    res.status(200).json({
      message: error.message,
      ok: true,
      success: false,
    });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const election = await OrgSchema.forgotPassword(
      email,
      req.socket.localPort
    );
    res.status(201).json({
      message: `A reset url has been sent to your email:${election.email}`,
      ok: true,
      success: true,
      data: {
        email: election.email,
      },
    });
  } catch (error) {
    res.status(200).json({
      message: error.message,
      ok: true,
      success: false,
    });
  }
};

const resetPassword = async (req, res) => {
  const { email, password, token } = req.body;
  try {
    const response = await OrgSchema.resetPassword(email, password, token);
    // create token
    res.status(201).json({
      message: "Your password has been reset succesfully",
      ok: true,
      success: true,
      data: {
        email: response.email,
      },
    });
  } catch (error) {
    res.status(200).json({
      message: error.message,
      ok: true,
      success: false,
    });
  }
};

const verifyResetLink = async (req, res) => {
  const { email, token } = req.body;
  const decodedEmail = Buffer.from(email, "base64").toString("ascii");
  try {
    const election = await OrgSchema.verifyResetLink(decodedEmail, token);
    // create token
    res.status(201).json({
      message: "Link is valid",
      ok: true,
      success: true,
      data: {
        email: election.email,
      },
    });
  } catch (error) {
    res.status(200).json({
      message: error.message,
      ok: true,
      success: false,
    });
  }
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
