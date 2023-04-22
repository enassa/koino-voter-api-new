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
  getCreatedElectionBody,
  generateRandomNoDashes,
  generateShortId,
  replaceSpaceWithUnderscore,
  generateSuperShortId,
  clientBaseUrl,
} = require("../../constants");

Array.prototype.mySwapDelete = function arrayMySwapDelete(index) {
  this[index] = this[this.length - 1];
  this.pop();
};
const OrgSchema = require("./electionModel");
const { findById } = require("./electionModel");
const { createComplexPdf } = require("../../utils/pdfMaker");
const ElectionSchema = new Schema({
  Id: {
    type: String,
    required: true,
    // unique: true,
  },
  DateCreated: {
    type: String,
    required: false,
  },
  Password: {
    type: String,
    required: true,
  },
  OrganizationEmail: {
    type: String,
    required: true,
  },
  OrganizationId: {
    type: String,
    required: true,
  },
  OrganizationName: {
    type: String,
    required: true,
  },
  CreatedBy: {
    type: String,
    required: false,
  },
  Title: {
    type: String,
    required: true,
  },
  NumberOfVoters: {
    type: Number,
    required: false,
    default: 0,
  },
  TotalVoted: {
    type: Number,
    required: false,
    default: 0,
  },
  GeneralInfo: {
    type: Object,
    required: true,
  },
  ContestantDefinition: {
    type: Object,
    required: true,
  },
  Positions: {
    type: Array,
    required: true,
  },
  Contestants: {
    type: Array,
    required: true,
  },
  Results: {
    type: Array,
    required: true,
  },
  VotingLink: {
    type: String,
    required: true,
    unique: true,
  },
  ResultsLink: {
    type: String,
    required: true,
    unique: true,
  },
  VoterIds: {
    type: Array,
    required: true,
  },
  UsedVoterIds: {
    type: Array,
    required: false,
  },
  token: {
    type: String,
    required: false,
  },
  Closed: {
    type: Boolean,
    required: false,
  },
});

// ------------------------STATIC SIGNUP METHOD------------------------
ElectionSchema.statics.createElection = async function (data) {
  console.log(data);
  // Validation
  if (!data) {
    throw Error("All fields are required");
  }
  // check if organization exist
  const organization = await OrgSchema.findOne({
    orgCode: data?.OrganizationId,
  });

  if (!organization) {
    throw Error(
      "An unsual activity has been detected, Extra security measures have been applied"
    );
  }
  console.log(organization, "organization");
  // generate election id
  let electionId = generateShortId();

  // hash election password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data?.Password, salt);

  // create confirm url
  const secret = process.env.SECRET + electionId + organization.orgCode;
  const token = jwt.sign(
    {
      Id: electionId,
    },
    secret,
    {
      expiresIn: "100d",
    }
  );
  let fileName = `Voter_Ids_for_${replaceSpaceWithUnderscore(
    data?.Title
  )}_${generateSuperShortId()}`;

  const voterIdFilePath = await createComplexPdf(data.VoterIds, fileName);
  console.log("voterIdFilePath", voterIdFilePath);
  // send reset url
  const votingLink = `${clientBaseUrl}/v/vote-login/${Buffer.from(
    organization.orgCode
  ).toString("base64")}/${Buffer.from(electionId).toString("base64")}/${token}`;

  const resultsLink = `${clientBaseUrl}/r/results-login/${Buffer.from(
    organization.orgCode
  ).toString("base64")}/${Buffer.from(electionId).toString("base64")}/${token}`;

  let Results = data?.Contestants;
  // create election
  const election = await this.create({
    ...data,
    Id: electionId,
    Password: hashedPassword,
    Results,
    token: token,
    VotingLink: votingLink,
    ResultsLink: resultsLink,
    Closed: false,
  });

  const sendEmail = await sendEmailWithGoogle(
    null,
    "smtp.ethereal.email",
    "assanenathaniel@gmail.com",
    [election.OrganizationEmail],
    "KoinoVote.org - Election Created Succesfully",
    "Please click on the link below to confirm your email account",
    `${getCreatedElectionBody(
      votingLink,
      resultsLink,
      election?.Title,
      data?.Password
    )}`,
    { filePath: voterIdFilePath, fileName: "" }
  )
    .then((res) => {
      console.log("Election details email sent");
    })
    .catch((error) => {
      console.log("Election details email sending failed");
      return { error: error + " sssss" };
    });

  delete election.Password;
  return {
    election,
  };
};
ElectionSchema.statics.resetElection = async function (data, Id) {
  // console.log("org Id", data?.Id, Id);
  // Validation
  if (!data) {
    throw Error("All fields are required");
  }
  // check if organization exist
  const organization = await OrgSchema.findOne({
    orgCode: data?.OrganizationId,
  });

  if (!organization) {
    throw Error("Couldn't find organization");
  }

  let fileName = `Voter_Ids_for_${replaceSpaceWithUnderscore(
    data?.Title
  )}_${generateSuperShortId()}`;

  const voterIdFilePath = await createComplexPdf(data.VoterIds, fileName);
  // send reset url
  const votingLink = `${clientBaseUrl}/v/vote-login/${Buffer.from(
    organization.orgCode
  ).toString("base64")}/${Buffer.from(data?.Id).toString("base64")}/${
    data?.token
  }`;
  // ss
  const resultsLink = `${clientBaseUrl}/r/results-login/${Buffer.from(
    organization.orgCode
  ).toString("base64")}/${Buffer.from(data?.Id).toString("base64")}/${
    data?.token
  }`;

  let Results = data?.Contestants;
  // create election
  // Move  voterId from unused  to used
  let unUsedVoterIds = data?.VoterIds;
  let usedVoterIds = [];

  const updateDoc = {
    $set: {
      Results: Results,
      VoterIds: unUsedVoterIds,
      UsedVoterIds: usedVoterIds,
      TotalVoted: 0,
    },
  };
  // upsert:false means do not create property if it does not exist
  const options = { upsert: false };
  const result = await this.findOneAndUpdate({ Id: Id }, updateDoc, options);

  await sendEmailWithGoogle(
    null,
    "smtp.ethereal.email",
    "assanenathaniel@gmail.com",
    [result?.OrganizationEmail, "assanicsone@gmail.com"],
    "KoinoVote.org - Election Created Succesfully",
    "Please click on the link below to confirm your email account",
    `${getCreatedElectionBody(
      votingLink,
      resultsLink,
      data?.Title,
      data?.Password
    )}`,
    { filePath: voterIdFilePath, fileName: "" }
  )
    .then((res) => {
      console.log("Election reset details email sent");
    })
    .catch((error) => {
      console.log("Election reset details email sending failed");
      return { error };
    });
  delete result?.Password;
  return {
    election: result,
  };
};

// ---------VERIFY VOTER ID ------------
ElectionSchema.statics.verifyVoterId = async function (
  voterId,
  orgCode,
  electionId,
  token
) {
  // validation
  if (!voterId || !orgCode || !electionId || !token) {
    throw Error("All fields are required");
  }

  // validate election id and org id
  const election = await this.findOne({
    Id: electionId,
    OrganizationId: orgCode,
  });
  if (!election) {
    throw Error(
      "An unusual activity has been detected, extra security measures have been applied"
    );
  }
  console.log("closed election", election?.Closed);
  if (election?.Closed) {
    throw Error("This election has been closed");
  }
  //validate token
  if (token !== election?.token) {
    throw Error(
      "An unusual activity has been detected, extra security measures have been applied"
    );
  }

  // validate voter ID
  //is voter id used?
  if (election?.UsedVoterIds?.includes(voterId)) {
    throw Error("This voter id has been used");
  }

  //if it is not used, is it valid?
  if (!election?.VoterIds?.includes(voterId)) {
    throw Error("Your voter id is invalid");
  }

  return {
    data: {
      voterId: voterId,
      orgCode: election?.OrganizationId,
      electionId: election.Id,
      Positions: election.Positions,
      Title: election.Title,
      token: election.token,
      Contestants: election.Contestants,
      ContestantDefinition: election.ContestantDefinition,
    },
    token: election?.token,
  };
};

// --------------- CAST VOTE ----------------------
ElectionSchema.statics.castVote = async function (voterData) {
  // validation
  if (
    !voterData?.voterId ||
    !voterData?.orgCode ||
    !voterData?.electionId ||
    !voterData?.token ||
    !voterData?.Votes
  ) {
    throw Error("All fields are required");
  }

  let { voterId, orgCode, electionId, token, Votes } = voterData;
  console.log("voterData", voterData.Votes);
  // validate election id and org id
  const election = await this.findOne({
    Id: electionId,
    OrganizationId: orgCode,
  });

  if (!election) {
    throw Error(
      "An unusual activity has been detected, extra security measures have been applied"
    );
  }

  //validate token
  if (token !== election?.token) {
    throw Error(
      "An unusual activity has been detected, extra security measures have been applied"
    );
  }
  // validate voter ID
  //is voter id used?
  console.log(election.Closed);
  if (election.Closed) {
    throw Error("This election has been closed");
  }

  if (election?.UsedVoterIds?.includes(voterId)) {
    throw Error("This voter id has been used");
  }

  //if it is not used, is it valid?
  const indexOfVoterId = election?.VoterIds?.indexOf(voterId);
  // console.log(indexOfVoterId, voterId);
  if (indexOfVoterId === -1) {
    throw Error("Your voter id is invalid");
  }
  let totalVotesRecorded = parseInt(election?.TotalVoted) + 1;

  // if (totalVotesRecorded > parseInt(election.NumberOfVoters)) {
  //   throw Error("Maximum of number of voters has reached ");
  // }

  // process vote
  // find the contestant that was voted for in results object and update the votesCount
  let Contestants = election.Results;
  const processElection = async () => {
    for (var portfolio in Votes) {
      console.log("prop and votes", property, Votes[portfolio]);
      // Go through each portfolio in the voteData object
      let votedContestantsForPortfolio = Votes[portfolio] ?? {};

      // In each  portfolio, process votes casted (contestant(s) chosen)
      await votedContestantsForPortfolio.forEach(async (contestant) => {
        let indexOfContestant = await Contestants?.findIndex(
          (item) => item.Id === contestant.Id
        );
        let votedContestant = Contestants[indexOfContestant] ?? {};
        console.log("Voted contestant Pos Id", votedContestant.PositionId);

        // Confirm voted contestant is standing for the voted Id
        if (votedContestant?.PositionId === contestant?.PositionId) {
          // Update vote count of voted contestant
          let newVoteCount = votedContestant?.VotesCount ?? 0 + 1;
          console.log("newVoteCount", newVoteCount);
          let updatedVote = {
            ...castedVote,
            VotesCount: newVoteCount,
          };

          Contestants.splice(indexOfContestant, 1, updatedVote);
        }
      });
    }
    return true;
  };
  // const processElection = async () => {
  //   for (var property in Votes) {
  //     console.log("prop and votes", property, Votes[property]);
  //     let castedVote = Votes[property][0] ?? {};
  //     let indexOfContestant = await Contestants?.findIndex(
  //       (item) => item.Id === castedVote.Id
  //     );
  //     let votedContestant = Contestants[indexOfContestant] ?? {};
  //     console.log("Voted contestant Pos Id", votedContestant.PositionId);
  //     if (votedContestant?.PositionId === castedVote?.PositionId) {
  //       let newVoteCount = votedContestant?.VotesCount ?? 0 + 1;
  //       console.log("newVoteCount", newVoteCount);
  //       let updatedVote = {
  //         ...castedVote,
  //         VotesCount: newVoteCount,
  //       };
  //       Contestants.splice(indexOfContestant, 1, updatedVote);
  //     }
  //   }
  //   return true;
  // };

  await processElection();

  // Move  voterId from unused  to used
  let unUsedVoterIds = election?.VoterIds;
  unUsedVoterIds.mySwapDelete(indexOfVoterId);

  let usedVoterIds = election?.UsedVoterIds;
  usedVoterIds.push(voterId);

  const updateDoc = {
    $set: {
      Results: Contestants,
      VoterIds: unUsedVoterIds,
      UsedVoterIds: usedVoterIds,
      TotalVoted: totalVotesRecorded,
    },
  };
  // upsert:false means do not create property if it does not exist
  const options = { upsert: false };
  const result = await this.findOneAndUpdate(
    { Id: electionId },
    updateDoc,
    options
  );
  return { data: {} };
};

ElectionSchema.statics.loginToResulstScreen = async function (
  password,
  orgCode,
  electionId,
  token
) {
  // validation
  if (!password || !orgCode || !electionId || !token) {
    throw Error("All fields are required");
  }

  // validate election id and org id
  const election = await this.findOne({
    Id: electionId,
    OrganizationId: orgCode,
  });
  if (!election) {
    throw Error(
      "An unusual activity has been detected, extra security measures have been applied"
    );
  }

  //validate token
  if (token !== election?.token) {
    throw Error(
      "An unusual activity has been detected, extra security measures have been applied"
    );
  }

  // validate voter ID
  //is voter id used?
  const match = await bcrypt.compare(password, election?.Password);
  if (!match) {
    throw Error("Your password is incorrect");
  }
  // I return contestant property holding the result values but it holds the results
  return {
    data: {
      orgCode: election?.OrganizationId,
      electionId: election.Id,
      Positions: election.Positions,
      Title: election.Title,
      token: election.token,
      Contestants: election.Results,
      TotalVoted: election?.TotalVoted,
      NumberOfVoters: election?.NumberOfVoters,
    },
    token: election?.token,
  };
};

// ----------------Get latest results----------------------
ElectionSchema.statics.getLatesResults = async function (
  orgCode,
  electionId,
  token
) {
  // validation
  // console.log(orgCode, electionId, token);
  if (!orgCode || !electionId || !token) {
    throw Error("All fields are required");
  }

  // validate election id and org id
  const election = await this.findOne({
    Id: electionId,
    OrganizationId: orgCode,
  });
  if (!election) {
    throw Error(
      "An unusual activity has been detected, extra security measures have been applied"
    );
  }

  //validate token
  if (token !== election?.token) {
    throw Error(
      "An unusual activity has been detected, extra security measures have been applied"
    );
  }

  // I return contestant property holding the result values but it holds the results
  return {
    data: {
      orgCode: election?.OrganizationId,
      electionId: election.Id,
      Positions: election.Positions,
      Title: election.Title,
      token: election.token,
      Contestants: election.Results,
      TotalVoted: election?.TotalVoted,
      NumberOfVoters: election?.NumberOfVoters,
    },
    token: election?.token,
  };
};
// -------------------------STATIC RESET PASSWORD METHOD-------------------------
ElectionSchema.statics.getAllElections = async function (orgCode, token) {
  // validation
  // console.log(orgCode, token);
  if (!orgCode || !token) {
    throw Error("All fields are required");
  }
  // check if organization exist
  const organization = await OrgSchema.findOne({
    orgCode,
  });

  if (!organization) {
    throw Error(
      "An unsual activity has been detected, Extra security measures have been applied"
    );
  }
  // const query = { runtime: { $lt: 15 } };
  // const options = {
  //   // sort returned documents in ascending order by title (A->Z)
  //   sort: { title: 1 },
  //   // Include only the `title` and `imdb` fields in each returned document
  //   projection: { _id: 0, title: 1, imdb: 1 },
  // };
  let allElections = await this.find({ OrganizationId: orgCode });
  //validate token
  if (!allElections) {
    throw Error("Could not get elections list");
  }
  // I return contestant property holding the result values but it holds the results
  return {
    data: allElections,
    token: token,
  };
};
ElectionSchema.statics.getSingleElection = async function (
  orgCode,
  electionId,
  token
) {
  // validation
  // console.log(orgCode, electionId, token);
  if (!orgCode || !token) {
    throw Error("All fields are required");
  }
  // check if organization exist
  const organization = await OrgSchema.findOne({ orgCode });

  if (!organization) {
    throw Error(
      "An unsual activity has been detected, Extra security measures have been applied"
    );
  }
  // const query = { runtime: { $lt: 15 } };
  // const options = {
  //   // sort returned documents in ascending order by title (A->Z)
  //   sort: { title: 1 },
  //   // Include only the `title` and `imdb` fields in each returned document
  //   projection: { _id: 0, title: 1, imdb: 1 },
  // };
  let singleElection = await this.findOne({
    OrganizationId: orgCode,
    Id: electionId,
  });
  //validate token
  if (!singleElection) {
    throw Error("Could not get election detail");
  }
  // I return contestant property holding the result values but it holds the results
  return {
    data: singleElection,
    token: token,
  };
};
module.exports = mongoose.model("electionsModel", ElectionSchema);

// const orgExists = await this.findOne({ orgName });
// if (exists) {
//   throw Error("Organization name has already been taken");
// }

// const calcluateExpireInMinutes = () => {
//   const currentTime = "";
//   const startTime = data?.Starting;
//   const endTime = data?.Ending;

//   const minDifFromNowToStart = "";
//   const minDifFromStartToFinish = "";
//   const tokenExpiryDurationInMinutes = "";
//   var initialTimeFormat = moment(initialTime);
//   var endTimeFormat = moment(endTime);
//   var totalHours = endTimeFormat.diff(initialTimeFormat, "hours");

//   document.getElementById("total-hours").innerHTML = totalHours;
// };
