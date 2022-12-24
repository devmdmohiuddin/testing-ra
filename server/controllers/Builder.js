const ErrorHandler = require("../utils/errorHandler")
const AsyncErrorHandler = require("../middleware/catchAsyncError")
const Builder = require("../Model/Builder")
const mongoose = require("mongoose")
const _ = require("lodash")

const builderCtrl = {
   getAll: AsyncErrorHandler(async (req, res, next) => {
      const allBuilder = await Builder.find({})
      res.status(200).json({ builders: allBuilder })
   }),

   create: AsyncErrorHandler(async (req, res, next) => {
      const { name } = req.body
      if (!name)
         return next(new ErrorHandler("Please type a builder name", 400))
      let allBuilder = await Builder.find()
      let existing = _.find(
         allBuilder,
         (chr) => chr.name.toLowerCase() === name.toLowerCase()
      )

      if (existing) {
         return next(new ErrorHandler("Builder already exists!", 400))
      } else {
         const builder = new Builder({
            name,
         })
         await builder
            .save()
            .then((data) =>
               res
                  .status(201)
                  .json({ data, message: "Builder created successfully" })
            )
            .catch((err) =>
               res.status(400).json({ message: "Failed to create builder" })
            )
      }
   }),

   delete: AsyncErrorHandler(async (req, res, next) => {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
         return next(
            new ErrorHandler(`No builder found with id:${req.params.id}`, 400)
         )
      }
      await Builder.findByIdAndDelete(req.params.id)
      res.status(200).json({ message: "builder deleted successfully" })
   }),
}
module.exports = builderCtrl
