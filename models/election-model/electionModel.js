const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { genSalt } = require("bcrypt");
const validator = require("validator");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
const {
  sendEmailWithNodeMailer,
  sendEmailWithGoogle,
} = require("../../controllers/mailer/sendEmail");
const {
  getHtmlBody,
  getRandomStringKey,
  getRandomInt,
  clientBaseUrl,
} = require("../../constants");

const OrgSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  contact: {
    type: String,
    required: true,
  },
  orgName: {
    type: String,
    required: true,
  },
  orgCode: {
    type: String,
    required: true,
    unique: true,
  },
  elections: {
    type: Array,
    required: false,
  },
  token: {
    type: String,
    required: false,
  },
  confirmToken: {
    type: String,
    required: false,
    default: null,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  credits: {
    type: String,
    default: false,
  },
  password: {
    type: String,
    required: true,
  },
});

// ------------------------STATIC SIGNUP METHOD------------------------
OrgSchema.statics.register = async function (
  email,
  password,
  orgName,
  contact,
  portNumber
) {
  console.log("reached register functions");
  // Validation
  if (!email || !password || !orgName) {
    throw Error("All fields are required");
  }
  if (!validator.isEmail(email)) {
    throw Error("Email is not valid");
  }
  if (!validator.isStrongPassword(password)) {
    throw Error("Password  is not strong enough");
  }

  const exists = await this.findOne({ email });
  if (exists) {
    throw Error("This email is already in use");
  }

  let orgCode = getRandomInt();
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  // create confirm url
  const secret = process.env.SECRET + email + orgName;
  const token = jwt.sign(
    {
      email: email,
      orgName: orgName,
    },
    secret,
    {
      expiresIn: "100d",
    }
  );
  const election = await this.create({
    email,
    orgName,
    orgCode,
    contact,
    confirmToken: token,
    password: hashPassword,
  });
  // send reset url
  const resetUrl = `${clientBaseUrl}/confirm/${Buffer.from(
    election.email
  ).toString("base64")}/${token}`;

  sendEmailWithGoogle(
    portNumber,
    "smtp.ethereal.email",
    "assanenathaniel@gmail.com",
    [election.email],
    "KoinoVote.org - Confirm your account",
    "Please click on the link below to confirm your email account",
    `${getHtmlBody(election, resetUrl, "Confirm your email acount")}`
    // election.orgName
  );

  return election;
};

// -------------------STATIC CONFIRM EMAIL METHOD--------------------
OrgSchema.statics.confirmEmail = async function (email, token) {
  if (!email) {
    throw Error("This link is invalid");
  }

  const election = await this.findOne({ email });
  if (!election) {
    throw Error("This link is invalid");
  }
  const secret = process.env.SECRET + election.email + election.orgName;
  const tokenValidity = jwt.verify(token, secret);
  if (token !== election.confirmToken) {
    throw Error("This link is invalid or expired");
  }
  const updateDoc = {
    $set: {
      confirmToken: null,
    },
  };
  // do not create is it does not exist
  const options = { upsert: true };
  const result = await this.findOneAndUpdate(
    { email: email },
    updateDoc,
    options
  );
  return result;
};
// ----------------------STATIC LOGIN METHOD----------------------
OrgSchema.statics.login = async function (email, password) {
  if (!email || !password) {
    throw Error("All fields are required");
  }

  const election = await this.findOne({ email });
  if (!election) {
    throw Error("This email is incorrect");
  }

  if (election.confirmToken !== null) {
    throw Error("You have not verified your account. Please verify and login");
  }

  const match = await bcrypt.compare(password, election.password);
  if (!match) {
    throw Error("Your password is incorrect");
  }
  return election;
};

// -----------------------------------------------STATIC FORGOT PASSWORD METHOD-----------------------------------------------

OrgSchema.statics.forgotPassword = async function (email, portNumber) {
  // validate election info
  if (!email) {
    throw Error("All fields are required");
  }
  const election = await this.findOne({ email });
  if (!election) {
    throw Error("This email is incorrect");
  }

  // validate token
  const secret = process.env.SECRET + election.password + election.orgCode;
  const token = jwt.sign(
    {
      email: election.email,
      orgName: election.orgName,
    },
    secret,
    {
      expiresIn: "15m",
    }
  );

  // send reset url
  const resetUrl = `${clientBaseUrl}/link/${Buffer.from(
    election.email
  ).toString("base64")}/${token}`;

  sendEmailWithGoogle(
    portNumber,
    "smtp.ethereal.email",
    "assanenathaniel@gmail.com",
    ["assanicsone@gmail.com"],
    "KoinoVote - Password reset link",
    "This is the email text body",
    `${getHtmlBody(election, resetUrl, undefined, election?.orgName)}`
  );
  return { email: election.email, link: resetUrl };
};

// -----------------------STATIC VERIFY RESET LINK METHOD-----------------------
OrgSchema.statics.verifyResetLink = async function (email, token) {
  if (!email) {
    throw Error("This link is invalid");
  }
  const election = await this.findOne({ email });
  if (!election) {
    throw Error("This link is invalid");
  }
  // try {
  const secret = process.env.SECRET + election.password + election.orgCode;
  const tokenValidity = jwt.verify(token, secret);
  const updateDoc = {
    $set: {
      token: token,
    },
  };
  // do not create is it does not exist
  const options = { upsert: true };
  const result = await this.findOneAndUpdate(
    { email: email },
    updateDoc,
    options
  );
  // } catch (error) {
  //   throw Error("The link has expired");
  // }
  return result;
};

// -------------------------STATIC RESET PASSWORD METHOD-------------------------
OrgSchema.statics.resetPassword = async function (email, password, token) {
  // validate request info
  if (!email || !password || !token) {
    throw Error("All fields are required");
  }

  // check if email exist
  const election = await this.findOne({ email });
  if (!election) {
    throw Error("This email is incorrect");
  }

  // validate token
  const secret = process.env.SECRET + election.password + election.orgCode;
  const tokenValidity = jwt.verify(token, secret);

  if (election.token !== token) {
    throw Error(
      "An unsual activity has been detected on this account, Furhter security has been applied to protect this account"
    );
  }
  // update password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const updateDoc = {
    $set: {
      password: hash,
      token: "empty",
    },
  };
  // do not create is it does not exist
  const options = { upsert: false };
  const result = await this.findOneAndUpdate(
    { email: email },
    updateDoc,
    options
  );

  return {
    email: result.email,
    message: "Your password has been reset succesfully",
  };
};

module.exports = mongoose.model("electionModel", OrgSchema);

// const orgExists = await this.findOne({ orgName });
// if (exists) {
//   throw Error("Organization name has already been taken");
// }
