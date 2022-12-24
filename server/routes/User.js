const router = require("express").Router()
const userCtrl = require("../controllers/User")
const {protect, admin} = require("../middleware/auth")

//for protect routes you need token to attach in headers

router.get("/", userCtrl.getUsers)
router.post("/register", userCtrl.register)
router.post("/login", userCtrl.login)
router.post("/logout", userCtrl.logout)
router.post("/forgot", userCtrl.forgotPassword)
router.post("/refresh_token", userCtrl.getAccessToken)
router.post("/reset", userCtrl.resetPassword)
router.get("/user-info/:id", userCtrl.getUser)
router.patch("/update_user", protect, userCtrl.updateUser)
router.patch("/update_role/:id", userCtrl.updateUsersRole)
router.delete("/delete-user/:id", userCtrl.deleteUser)

// Social Login
router.post("/google_login", userCtrl.googleLogin)
router.post("/facebook_login", userCtrl.facebookLogin)

module.exports = router
