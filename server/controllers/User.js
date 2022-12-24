const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { google } = require("googleapis")
const mongoose = require("mongoose")
const fetch = require("node-fetch")
const sgMail = require("@sendgrid/mail")
sgMail.setApiKey(process.env.SENDGRID_API)

const { OAuth2 } = google.auth
const sendMail = require("../utils/sendEmail")
const User = require("../Model/User")

const client = new OAuth2(process.env.MAILING_SERVICE_CLIENT_ID)
const { CLIENT_URL } = process.env

const ErrorHandler = require("../utils/errorHandler")
const AsyncErrorHandler = require("../middleware/catchAsyncError")

const userCtrl = {
   //user/register
   register: AsyncErrorHandler(async (req, res, next) => {
      let { name, email, password } = req.body
      email = email.toLowerCase()

      if (!name || !email || !password)
         return next(new ErrorHandler("Please fill in all fields.", 406))

      if (!validateEmail(email))
         return next(new ErrorHandler("Invalid emails.", 406))

      const user = await User.findOne({ email })
      if (user) return next(new ErrorHandler("Email already exists.", 409))

      if (password.length < 6)
         return next(
            new ErrorHandler("Password must be at least 6 characters.", 406)
         )

      //HASHED PASSWORD
      const passwordHash = await bcrypt.hash(password, 12)

      const newUser = await User.create({
         name,
         email,
         password: passwordHash,
      })

      // sendgrid
      const emailData = {
         from: {
            name: "Ichchapuron Admin",
            email: "admin@ichchapuron.com.bd",
         },
         to: email,
         templateId: "d-a5d9ab6f40cc42ce98887d58d9a5147d",
         dynamic_template_data: {
            subject: `Welcome to Ichchapuron, ${name}`,
            name,
         },
      }

      sgMail
         .send(emailData)
         .then((response) => {
            console.log(response[0].statusCode)
            console.log(response[0].headers)
         })
         .catch((err) => console.log(err.message))

      // return new user
      res.status(201).json({
         message: "Registration Successfull",
         newUser,
      })
   }),
   //user/login
   login: AsyncErrorHandler(async (req, res, next) => {
      const { email, password } = req.body

      if (!email || !password)
         return next(new ErrorHandler("Please fill in all fields.", 406))

      const user = await User.findOne({ email })

      if (!user) return next(new ErrorHandler("Email does not exist.", 400))

      //PASSWORD MATCH CHECK
      const isMatch = await bcrypt.compare(password, user.password)

      if (!isMatch) return next(new ErrorHandler("Password is incorrect.", 400))

      const refresh_token = createRefreshToken({ id: user._id })

      //HANDLE REFRESH TOKEN USING COOKIES
      res.cookie("refreshtoken", refresh_token, {
         sameSite: "strict",
         // httpOnly: true,
         // secure: true, //only work for production
         path: "/",
         maxAge: 9000000000000, //3min=180sec=180000 milliseconds
      })
      // Cookies that have not been signed
      // console.log("Cookies: ", req.cookies);

      // Cookies that have been signed
      // console.log("Signed Cookies: ", req.signedCookies);

      res.status(200).json({
         message: "Login Successfull",
         refreshToken: refresh_token,
         data: {
            id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            role: user.role,
            isUsed: user.isUsed,
            avatar: user.avatar,
         },
      })
   }),
   //user/logout
   logout: AsyncErrorHandler(async (req, res) => {
      res.clearCookie("refreshtoken", { path: "/user/refresh_token" })
      return res.status(200).json({ message: "You are logged out!" })
   }),
   // user/forgot
   forgotPassword: AsyncErrorHandler(async (req, res, next) => {
      const { email } = req.body

      const user = await User.findOne({ email })

      if (!user) return next(new ErrorHandler("Email does not exist.", 400))

      const { name } = user
      const token = createActivationToken({ id: user._id })

      // console.log("token", token)

      const url = `https://ichchapuron.com.bd/reset/${token}`
      // const url = `http://localhost:3000/reset/${token}`

      // sendgrid
      const emailData = {
         from: {
            name: "no-reply",
            email: "no-reply@ichchapuron.com.bd",
         },
         to: email,
         templateId: "d-1eb0d7661adc4e33afcbb4f1d30a3b10",
         dynamic_template_data: {
            subject: `Reset Password`,
            url,
            name,
         },
      }

      sgMail.send(emailData).then((response) => {
         console.log(response[0].statusCode)
         console.log(response[0].headers)
      })
      res.status(201).json({
         message: `Reset link sent to your email ${email}`,
      })
   }),
   //user/refresh_token
   getAccessToken: AsyncErrorHandler(async (req, res, next) => {
      const rf_token = req.cookies.refreshtoken

      if (!rf_token) return next(new ErrorHandler("Please login now!", 400))

      jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
         if (err) return next(new ErrorHandler("Please login now!", 400))

         const access_token = createAccessToken({ id: user.id })
         res.status(200).json({
            message: "user is already logged in",
            access_token,
         })
      })
   }),
   //user/forgot
   // forgotPassword: AsyncErrorHandler(async (req, res, next) => {
   //   const { email } = req.body;
   //   const user = await User.findOne({ email });
   //   if (!user) return next(new ErrorHandler("Email does not exist.", 400));

   //   const access_token = createAccessToken({ id: user._id });
   //   const url = `${CLIENT_URL}/user/reset/${access_token}`;

   //   //NODEMAILER SENDING EMAIL
   //   sendMail(email, url, "Reset your password");

   //   res.json({
   //     message: `Re-send the password, please check your email ${access_token}`,
   //   });
   // }),
   //user/reset
   resetPassword: AsyncErrorHandler(async (req, res, next) => {
      const { password, token } = req.body
      const { id } = jwt.decode(token)

      if (!password)
         return next(new ErrorHandler("please enter your password", 400))

      const passwordHash = await bcrypt.hash(password, 12)

      await User.findOneAndUpdate(
         { _id: id },
         {
            password: passwordHash,
         }
      )

      res.status(200).json({ msg: "Password successfully changed!" })
   }),
   //user/user_info/:id
   getUser: AsyncErrorHandler(async (req, res, next) => {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
         return next(
            new ErrorHandler(`No user found with id:${req.params.id}`, 404)
         )
      }
      const user = await User.findById(req.params.id).select("-password")
      res.status(200).json(user)
   }),
   //user/all_user get access_token from hitting user/refresh_token paste the token in headers Authorization
   getUsers: AsyncErrorHandler(async (req, res) => {
      const users = await User.find().select("-password")
      res.status(200).json(users)
   }),
   //user/update_user patch req
   updateUser: AsyncErrorHandler(async (req, res, next) => {
      const { name, password, confirmPassword, avatar, email, role, userId } =
         req.body
      // console.log(req.body)
      if (password && confirmPassword) {
         if (password !== confirmPassword)
            return next(new ErrorHandler("Password doesn't match", 400))
         const salt = await bcrypt.genSalt(10)
         const hashedPassword = await bcrypt.hash(password, salt)

         await User.findOneAndUpdate(
            { _id: userId },
            {
               role,
               email,
               name,
               avatar,
               password: hashedPassword,
            }
         )
         res.status(200).json({ message: "Update Success" })
      } else {
         await User.findOneAndUpdate(
            { _id: userId },
            //update can be a single item just put one of them in body and send req
            {
               role,
               email,
               name,
               avatar,
            }
         )
         res.status(200).json({ message: "Update Success" })
      }
   }),
   //this promoCode is all about validation
   promoCode: AsyncErrorHandler(async (req, res, next) => {
      let { code } = req.body
      let user = req.user
      let products = user.purchasedProducts
      let allTokens = await Token.find({})
      let firstPurchasedToken = allTokens[0]?.first_time_purchase_token
      let limitedToken = allTokens[0]?.limited_tokens
      let findToken = limitedToken?.find(
         (item) => item.code.toString() === code.toString()
      )

      console.log(limitedToken[0])

      if (firstPurchasedToken?.code.toString() === code.toString()) {
         let findExisting = user.welcomeToken === code.toString()
         if (findExisting) {
            return next(new ErrorHandler("Token already used", 400))
         } else {
            await User.findOneAndUpdate(
               { _id: req.user.id },
               //update can be a single item just put one of them in body and send req
               {
                  welcomeToken: code,
               }
            )
            user.usedTokens.push(code.toString())
         }
         if (products?.length > 0) {
            return next(new ErrorHandler("Token already used", 400))
         }

         res.status(200).json({
            percentage: firstPurchasedToken.percentage,
            msg: "eligible",
         })
      } else {
         if (findToken?.code.toString() === code.toString()) {
            res.status(200).json({
               percentage: findToken.percentage,
               msg: "eligible",
            })
         } else {
            return next(new ErrorHandler("Invalid token", 400))
         }
      }
   }),
   //user//update_role/:id
   updateUsersRole: AsyncErrorHandler(async (req, res) => {
      const { role } = req.body

      await User.findOneAndUpdate(
         { _id: req.params.id },
         {
            role,
         }
      )
      res.status(200).json({ msg: "Update Success!" })
   }),
   //user/delete/:id
   deleteUser: AsyncErrorHandler(async (req, res, next) => {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
         return next(
            new ErrorHandler(`No user found with id:${req.params.id}`, 404)
         )
      }
      await User.findByIdAndDelete(req.params.id)
      res.status(200).json({ msg: "Deleted Success!" })
   }),

   //user/google_login
   googleLogin: AsyncErrorHandler(async (req, res, next) => {
      const { tokenId } = req.body
      // console.log(tokenId);
      if (!tokenId)
         return next(new ErrorHandler("you need to provide a token id", 400))

      const verify = await client.verifyIdToken({
         idToken: tokenId,
         audience:
            "779648521547-gjlsus2l9aud4kosqdtc5gu5icmumqlp.apps.googleusercontent.com", //google client_id
      })
      const { email_verified, email, name, picture } = verify.payload
      console.log(email) //google pop up selected email
      console.log("email_verified", email_verified) //return true / false

      if (!email_verified)
         return res.status(400).json({ msg: "Email verification failed." })

      //hashed password
      const password = email + process.env.GOOGLE_SECRET
      const passwordHash = await bcrypt.hash(password, 12)

      const user = await User.findOne({ email })

      if (user) {
         const isMatch = await bcrypt.compare(password, user.password)

         if (!isMatch)
            return res.status(400).json({ msg: "Password is incorrect." })

         const refresh_token = createRefreshToken({ id: user._id })

         res.cookie("refreshtoken", refresh_token, {
            httpOnly: true,
            path: "/user/refresh_token",
            secure: true,
            maxAge: 180000,
         })

         res.status(200).json({
            message: "Login Successfull",
            refreshToken: refresh_token,
            data: {
               name: user.name,
               email: user.email,
               avatar: user.avatar,
               isAdmin: user.isAdmin,
               role: user.role,
            },
         })
      } else {
         const newUser = new User({
            name,
            email,
            password: passwordHash,
            avatar: picture,
         })

         const userData = await newUser.save()

         const refresh_token = createRefreshToken({ id: newUser._id })

         res.cookie("refreshtoken", refresh_token, {
            httpOnly: true,
            path: "/user/refresh_token",
            secure: true,
            maxAge: 180000,
         })

         res.status(200).json({
            message: "Login Success",
            refreshToken: refresh_token,
            data: {
               name: userData.name,
               email: userData.email,
               avatar: userData.avatar,
               isAdmin: userData.isAdmin,
               role: userData.role,
            },
         })
      }
   }),
   //user/facebook_login
   facebookLogin: AsyncErrorHandler(async (req, res, next) => {
      const { accessToken, userID } = req.body
      //developers.facebook.com/docs/graph-api/overview/ -->versions curl -i X GET \
      const URL = `https://graph.facebook.com/v2.9/${userID}/?fields=id,name,email,picture&access_token=${accessToken}`

      const data = await fetch(URL)
         .then((res) => res.json())
         .then((res) => {
            return res
         })

      const { email, name, picture } = data

      const password = email + process.env.FACEBOOK_SECRET

      const passwordHash = await bcrypt.hash(password, 12)

      const user = await User.findOne({ email })

      if (user) {
         const isMatch = await bcrypt.compare(password, user.password)
         if (!isMatch)
            return next(new ErrorHandler("Password is incorrect.", 400))

         const refresh_token = createRefreshToken({ id: user._id })
         res.cookie("refreshtoken", refresh_token, {
            httpOnly: true,
            path: "/user/refresh_token",
            secure: true,
            maxAge: 180000,
         })

         res.status(200).json({
            message: "Login Successfull",
            refreshToken: refresh_token,
            data: {
               name: user.name,
               email: user.email,
               avatar: user.avatar,
               isAdmin: user.isAdmin,
               role: user.role,
            },
         })
      } else {
         const newUser = new Users({
            name,
            email,
            password: passwordHash,
            avatar: picture.data.url,
         })

         const fbUserData = await newUser.save()

         const refresh_token = createRefreshToken({ id: newUser._id })
         res.cookie("refreshtoken", refresh_token, {
            httpOnly: true,
            path: "/user/refresh_token",
            secure: true,
            maxAge: 180000,
         })

         res.status(200).json({
            message: "Login Success",
            refreshToken: refresh_token,
            data: {
               name: fbUserData.name,
               email: fbUserData.email,
               avatar: fbUserData.avatar,
               isAdmin: fbUserData.isAdmin,
               role: fbUserData.role,
            },
         })
      }
   }),
}

function validateEmail(email) {
   const re =
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
   return re.test(email)
}

const createActivationToken = (payload) => {
   return jwt.sign(payload, "123456", {
      expiresIn: "60m",
   })
}

const createAccessToken = (payload) => {
   // return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
   return jwt.sign(payload, "123456", {
      expiresIn: "30d",
   })
}

const createRefreshToken = (payload) => {
   //payload = user._id
   // return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
   return jwt.sign(payload, "123456", {
      expiresIn: "30d",
   })
}

module.exports = userCtrl
