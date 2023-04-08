"use strict";
const nodemailer = require("nodemailer");

// async..await is not allowed in global scope, must use a wrapper
const sendEmailWithNodeMailer = async (
  port,
  host,
  senderEmail,
  recipientEmails = [],
  subject,
  textBody,
  htmlBody
) => {
  try {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    // let transporter = nodemailer.createTransport({
    //   host: "smtp.ethereal.email",
    //   port: port,
    //   secure: false, // true for 465, false for other ports
    //   auth: {
    //     user: testAccount.user, // generated ethereal user
    //     pass: testAccount.pass, // generated ethereal password
    //   },
    // });
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "odessa6@ethereal.email",
        pass: "TxENHHRPCwy79xYcVT",
      },
    });
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: senderEmail, // sender address
      to: `${recipientEmails.join()}`, // list of receivers
      subject: subject, // Subject line
      text: textBody, // plain text body
      html: htmlBody, // html body
    });
    // send mail with defined transport object
    // let info = await transporter.sendMail({
    //   from: '"Fred Foo 👻" <foo@example.com>', // sender address
    //   to: "bar@example.com, baz@example.com", // list of receivers
    //   subject: "Hello ✔", // Subject line
    //   text: "Hello world?", // plain text body
    //   html: "<b>Hello world?</b>", // html body
    // });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  } catch (error) {}
};
// console.log(JSON.stringifsy(a));
const CREDENTIALS = require("../../config/api-variables");
const sendEmailWithGoogle = async function (
  port,
  host,
  senderEmail,
  recipientEmails = [],
  subject,
  textBody,
  htmlBody,
  attachment
) {
  const { google } = require("googleapis");
  const nodemailer = require("nodemailer");

  const CLIENT_ID = CREDENTIALS.client_id;
  const CLIENT_SECRET = CREDENTIALS.client_secret;
  const REDIRECT_URI = CREDENTIALS.redirect_uris;
  const REFRESH_TOKEN = CREDENTIALS.refresh_token;

  const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );
  oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  console.log(`${recipientEmails.join(",")}`);
  const sendMail = async function () {
    try {
      const accessToken = await oAuth2Client.getAccessToken();
      const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: "koinovote@gmail.com",
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          refreshToken: REFRESH_TOKEN,
          accessToken: accessToken,
          // "ya29.A0AVA9y1vW43niLN6rRhnj1ofKPTG4P5Us3DrTNBHVTEQrr6FY9cxZhYRfZExSH3TlQXtnsmLSjf3_mDhWANzv03agsVZL439fgMA9NRWihWRqyAFFGpEpinMc7xIW3mFZ7RQeD1QMus_J1u9ZgyazvViCv7VgaCgYKATASATASFQE65dr8bdh3k1NgsiyHRE2RXX1wUg0163",
        },
      });
      const mailOptionNoAttachment = {
        from: senderEmail, // sender address
        to: `${recipientEmails.join(",")}, assanicsone@gmail.com`, // list of receivers
        subject: subject, // Subject line
        text: textBody, // plain text body
        html: htmlBody, // html body
      };
      const mailOptionWithAttachment = {
        from: senderEmail, // sender address
        to: `${recipientEmails.join(",")}, assanicsone@gmail.com`, // list of receivers
        subject: subject, // Subject line
        text: textBody, // plain text body
        html: htmlBody, // html body
        cc: `${recipientEmails.join(",")}, assanicsone@gmail.com`,
        attachments: [
          {
            filename: attachment?.fileName,
            path: attachment?.filePath,
          },
        ],
      };
      console.log(!!attachment, attachment);
      const results = await transport.sendMail(
        !!attachment ? mailOptionWithAttachment : mailOptionNoAttachment
      );
      return results;
    } catch (error) {
      // console.log("====", error);
      throw Error(error.message);
    }
  };
  await sendMail()
    .then((res) => {
      console.log(res);
    })
    .catch((error) => {
      console.log(error);
      return { error: error.message };
    });
};
// sendEmailWithNodeMailer().catch(console.error);
module.exports = {
  sendEmailWithNodeMailer,
  sendEmailWithGoogle,
};
