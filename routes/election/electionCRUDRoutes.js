const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
var path = require("path");
// var root = path.dirname(require.main.filename);

const {
  createElection,
  verifyVoterId,
  castVote,
  loginToResulstScreen,
  getLatesResults,
  getAllElections,
  getSingleElection,
  resetElection,
} = require("../../controllers/election/electionCRUDController");

// -------------------CRUD ROUTES---------------------
router.post("/create", createElection);
router.put("/reset", resetElection);

// ------voting handling
router.post("/verify-voter", verifyVoterId);
router.put("/vote", castVote);

//------results handling
router.post("/results-login", loginToResulstScreen);
router.post("/latest", getLatesResults);
router.post("/list", getAllElections);
router.post("/single", getSingleElection);

// router.put("/delete", confirmEmail);
// router.post("/vote", loginUser);
// router.post("/results", forgotPassword);
// router.post("/reset", forgotPassword);
// sign up route

module.exports = router;
