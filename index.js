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

// SET UP EXPRESS APP
const app = express();
require("dotenv").config();

// CONNECT TO MONGOOSE

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
const { mongPath } = require("./constants");
mongoose.connect(mongPath);
mongoose.Promise = global.Promise;
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
  res.sendFile("./views/home.html", { root: __dirname });
});
// ERROR HANDLING
app.use((error, req, res, next) => {
  res.status(422).send({
    error: {
      message: error.message,
      statusCode: 422,
      status: false,
    },
  });
});

// LISTEN FOR ROUTES
let counts = 0;
const listener = app.listen(process.env.PORT || "3030", (req, res) => {
  // createComplexPdf(["fdfdf", "fdsfsd", "dfdsfsds"], `name${counts}`);
  console.log(`now listening at port ${listener.address().port || "3030"}`);
  counts++;
});
