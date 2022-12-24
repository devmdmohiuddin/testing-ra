const jwt = require("jsonwebtoken")
const AsyncErrorHandler = require("../middleware/catchAsyncError")
const User = require("../Model/User")

const protect = AsyncErrorHandler(async (req, res, next) => {
  try {
    // console.log(User);
    const token = req.header("Authorization")
    // console.log("token8", token);
    if (!token) return res.status(401).json({message: "you are not authorized"})

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    // console.log(`decoded user`, decoded.id)
    req.user = await User.findById(decoded.id).select("-password")
    // console.log(req.user)
    next()
  } catch (error) {
    return res
      .status(401)
      .json({message: "you are not authorized", error: error.message})
  }
})

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next()
  } else {
    return res.status(401).json({message: "Not authorized as an admin"})
  }
}

module.exports = {protect, admin}
