// const mongo = require("./mongo");
// const connectToMongoDb = async () => {
//   await mongo().then((mongoose) => {
//     try {
//       console.log("Connected to mongodb");
//     } catch (err) {
//       console.log(err);
//     } finally {
//       mongoose.connection.close();
//     }
//   });
// };
// connectToMongoDb();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/users/userRoutes");
const organizationRoutes = require("./routes/election/electionRoutes");
const electionRoutes = require("./routes/election/electionCRUDRoutes");
const { createPdf, corsAcceptedUrls } = require("./constants");
const { createComplexPdf } = require("./utils/pdfMaker");
const { count } = require("./models/election-model/electionModel");

const allowCors = (fn) => async (req, res) => {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

// SET UP EXPRESS APP
const app = express();
require("dotenv").config();

// CONNECT TO MONGOOSE

const mongo = require("./mongo");
const connectToMongoDb = async () => {
  await mongo().then((mongoose) => {
    try {
      console.log("Connected to mongodb");
    } catch (err) {
      console.log(err);
    } finally {
      mongoose.connection.close();
    }
  });
};
connectToMongoDb();
// const { mongPath } = require("./constants");
// mongoose.connect(mongPath);
// mongoose.Promise = global.Promise;
// allow cors
app.use(
  cors({
    origin: "*",
  })
);
// Middle ware
app.use(express.json());

// INITIALIZE ROUTES
app.use("/api/election", organizationRoutes);
app.use("/api/elections", electionRoutes);
app.use("/api/user", userRoutes);

app.get("/", (req, res) => {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  console.log("DIRNAME", __dirname);
  res.send("Hello, World!");
  // res.sendFile("./views/home.html", { root: __dirname });
});

// ERROR HANDLING
app.use(
  allowCors((error, req, res, next) => {
    res.status(422).send({
      error: {
        message: error.message,
        statusCode: 422,
        status: false,
      },
    });
  })
);

// LISTEN FOR ROUTES
let counts = 0;
const listener = app.listen(process.env.PORT || "3030", (req, res) => {
  // createComplexPdf(["fdfdf", "fdsfsd", "dfdsfsds"], `name${counts}`) ;
  console.log(`now listening at port ${listener.address().port || "3030"}`);
  counts++;
});
