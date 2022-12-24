const mongoose = require("mongoose")
const Schema = mongoose.Schema

const taskSchema = new mongoose.Schema(
   {
      builderjobnumber: String,
      r_ajobnumber: String,
      buildername: String,
      jobaddress: String,
      lotnumber: String,
      taskCategory: String,
      title: String,
      task: { type: Schema.Types.Mixed },
      start: Date,
      end: Date,
   },
   {
      timestamps: true,
   }
)

module.exports = mongoose.model("taskSchema", taskSchema)
