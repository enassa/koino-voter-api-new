const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
var path = require("path");
// var root = path.dirname(require.main.filename);

const {
  // AUTH
  signUpUser,
  confirmEmail,
  loginUser,
  getElections,
  forgotPassword,
  resetPassword,
  verifyResetLink,
  // OTHERS
  getContestants,
  createElection,
  updateElection,
  deleteElection,
} = require("../../controllers/election/electionController");
// -----------------AUTH ROUTES-------------------

// login route
router.post("/register", signUpUser);
router.post("/confirm", confirmEmail);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password", resetPassword);
router.post("/link", verifyResetLink);
router.get("/list", getElections);
// sign up route

// -------------------CRUD ROUTES---------------------
router.get("/contestants", getContestants);

// ADD ELECTION
router.post("/create-election", createElection);

// UPDATE ELECTION
router.put("/update-election", updateElection);

// DELETE SURVEY
router.delete("/delete-election", deleteElection);
module.exports = router;
