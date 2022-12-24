const nodemailer = require("nodemailer")
const {google} = require("googleapis")
const {OAuth2} = google.auth
const OAUTH_PLAYGROUND = "https://developers.google.com/oauthplayground"

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  OAUTH_PLAYGROUND_REFRESH_TOKEN,
  SENDER_EMAIL_ADDRESS,
} = process.env

const oauth2Client = new OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  OAUTH_PLAYGROUND_REFRESH_TOKEN,
  OAUTH_PLAYGROUND
)
oauth2Client.setCredentials({
  refresh_token: OAUTH_PLAYGROUND_REFRESH_TOKEN,
})

// send mail
const sendEmail = () => {
  const access_token = oauth2Client.getAccessToken()

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: SENDER_EMAIL_ADDRESS,
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      refreshToken: OAUTH_PLAYGROUND_REFRESH_TOKEN,
      accessToken: access_token,
    },
  })

  transporter.verify((err, success) => {
    if (err) {
      console.log(err)
    } else {
      console.log(`Server is ready to take messages: ${success}`)
    }
  })
  const mailOptions = {
    from: SENDER_EMAIL_ADDRESS,
    to: "rakib.devatmern@gmail.com",
    subject: "New Order Created",
    html: `
    <div>
    <p style="color: red; text-decoration: underline;">Your order has been created</p>
    </div>
    `,
  }
  transporter.sendMail(mailOptions, function (err, res) {
    if (err) {
      // res.status(400).json({msg: err.message})
      console.log("error", err.message)
    } else {
      console.log("Email sent!")
    }
  })
}

module.exports = sendEmail
