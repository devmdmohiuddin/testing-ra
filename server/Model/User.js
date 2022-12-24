const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
   {
      name: {
         type: String,
      },
      email: {
         type: String,
      },
      password: {
         type: String,
      },
      isAdmin: {
         type: Boolean,
         default: false,
      },
      role: {
         type: String,
         default: "basic",
         enum: ["basic", "supervisor", "admin"],
      },
      avatar: String,
   },
   {
      timestamps: true,
   }
)

module.exports = mongoose.models.User || mongoose.model("User", userSchema)
