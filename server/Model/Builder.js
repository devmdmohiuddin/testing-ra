const mongoose = require("mongoose");

const builderSchema = new mongoose.Schema(
  {
        name: String
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("builderSchema", builderSchema);
