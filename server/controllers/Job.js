const ErrorHandler = require("../utils/errorHandler")
const AsyncErrorHandler = require("../middleware/catchAsyncError")
const Job = require("../Model/Job")
const mongoose = require("mongoose")

const jobCtrl = {
   getAll: AsyncErrorHandler(async (req, res, next) => {
      const allJobs = await Job.find({})
      res.status(200).json({ jobs: allJobs })
   }),

   create: AsyncErrorHandler(async (req, res, next) => {
      const {
         buildername,
         builderjobnumber,
         r_ajobnumber,
         jobaddress,
         lotnumber,
      } = req.body
      if (
         !buildername ||
         !builderjobnumber ||
         !r_ajobnumber ||
         !jobaddress ||
         !lotnumber
      )
         return next(new ErrorHandler("Please fill all the fields", 400))

      const job = new Job(req.body)
      await job
         .save()
         .then((data) =>
            res.status(201).json({ data, message: "Job created successfully" })
         )
         .catch((err) =>
            res.status(400).json({ message: "Failed to create job" })
         )
   }),

   edit: AsyncErrorHandler(async (req, res, next) => {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
         return next(
            new ErrorHandler(`No job found with id:${req.params.id}`, 400)
         )
      }
      let job = await Job.findById(req.params.id)
      let isCompleted = job?.todos?.every((x) => x?.done === true)
      let data = { ...req.body, completed: isCompleted }
      Job.findByIdAndUpdate(req.params.id, data, function (err, docs) {
         if (err) {
            console.log(err)
         } else {
            res.status(200).json({ message: "Updated Successfully", docs })
         }
      })
   }),
   delete: AsyncErrorHandler(async (req, res, next) => {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
         return next(
            new ErrorHandler(`No job found with id:${req.params.id}`, 400)
         )
      }
      await Job.findByIdAndDelete(req.params.id)
      res.status(200).json({ message: "job deleted successfully" })
   }),
}
module.exports = jobCtrl
