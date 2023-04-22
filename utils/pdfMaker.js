const fs = require("fs");
const path = require("path");
const Pdfmake = require("pdfmake");

const createComplexPdf = async (
  voterIds,
  nameOfFile,
  tileOfElection,
  organazitionName,
  orgCode,
  electionId,
  numberOfVoters
) => {
  var fonts = {
    Roboto: {
      normal: __dirname + "/fonts/roboto/Roboto-Regular.ttf",
      bold: __dirname + "/fonts/roboto/Roboto-Regular.ttf",
      italics: "fonts/roboto/Roboto-Italic.ttf",
      bolditalics: "fonts/roboto/Roboto-MediumItalic.ttf",
    },
  };
  // let idObj = [];
  // Array.isArray(voterIds) &&
  //   voterIds.map((item, index) => {
  //     idObj.push({
  //       text: item,
  //       style: "text",
  //     });
  //   });
  let pdfmake = new Pdfmake(fonts);

  let docDefination = {
    content: ["Hello World!"],
  };
  let stylingDocs = {
    content: [
      {
        text: "Voter Ids",
        style: "header",
      },
      {
        text: voterIds.join(" - "),
        style: "text",
      },
      // {
      //   text: "\n",
      // },
    ],
    styles: {
      header: {
        fontSize: 30,
        bold: true,
        alignment: "center",
        margin: [0, 30, 0, 20],
      },
      subheader: {
        fontSize: 14,
        margin: [0, 15, 0, 10],
        color: "#003893",
      },
      text: {
        alignment: "start",
        margin: [0, 0, 0, 0],
        // padding: [0, 0, 20, 0],
        display: "inline",
        whitSpace: "nowrap",
        color: "#003893",
        fontSize: 20,
        linHeight: 20,
      },
    },
  };
  const filePath =
    process.env.NODE_ENV === "production"
      ? path.resolve(`/tmp/${nameOfFile ?? "filename"}.pdf`)
      : path.resolve(__dirname + `/pdfs/${nameOfFile ?? "filename"}.pdf`);

  pdfDoc = pdfmake.createPdfKitDocument(stylingDocs, {});
  pdfDoc.pipe(fs.createWriteStream(filePath));
  pdfDoc.end();

  path.resolve(filePath);
  return path.resolve(filePath);
};
module.exports = {
  createComplexPdf,
};
