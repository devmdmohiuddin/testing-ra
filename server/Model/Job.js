const mongoose = require("mongoose")
const Schema = mongoose.Schema

const jobSchema = new mongoose.Schema(
   {
      buildername: String,
      builderjobnumber: String,
      r_ajobnumber: String,
      jobaddress: String,
      lotnumber: String,
      todos: { type: Schema.Types.Mixed },
      completed: Boolean,
   },
   {
      timestamps: true,
   }
)

module.exports = mongoose.model("jobSchema", jobSchema)
