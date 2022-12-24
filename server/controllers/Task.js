const ErrorHandler = require("../utils/errorHandler")
const AsyncErrorHandler = require("../middleware/catchAsyncError")
const Task = require("../Model/Task")
const mongoose = require("mongoose")

const taskCtrl = {
   getAll: AsyncErrorHandler(async (req, res, next) => {
      const allTask = await Task.find({})
      res.status(200).json({ tasks: allTask })
   }),

   create: AsyncErrorHandler(async (req, res, next) => {
      if (req.body) {
         const task = new Task(req.body)
         await task
            .save()
            .then((data) =>
               res
                  .status(201)
                  .json({ data, message: "Task created successfully" })
            )
            .catch((err) =>
               res.status(400).json({ message: "Failed to create Task", err })
            )
      } else {
         return next(new ErrorHandler("Something wrong!", 500))
      }
   }),

   delete: AsyncErrorHandler(async (req, res, next) => {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
         return next(
            new ErrorHandler(`No Task found with id:${req.params.id}`, 400)
         )
      }
      await Task.findByIdAndDelete(req.params.id)
      res.status(200).json({ message: "Task deleted successfully" })
   }),
}
module.exports = taskCtrl
