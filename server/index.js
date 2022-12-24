process.on("uncaughtException", (err) => {
   console.log(
      `server is shutting down due to uncaught exception: ${err.message} ${err.stack}`
   )
})

require("dotenv").config()
const express = require("express")
const path = require("path")
const cors = require("cors")
const cookieParser = require("cookie-parser")

const app = express()
const connect = require("./config/db")
connect()

app.use(express.json())
app.use(cookieParser())
app.use(cors())

app.use("/api/users", require("./routes/User"))
app.use("/api/builder", require("./routes/Builder"))
app.use("/api/job", require("./routes/Job"))
app.use("/api/task", require("./routes/Task"))

app.use(require("./middleware/error"))

const dir = path.resolve()
if (process.env.NODE_ENV === "production") {
   app.use(express.static(path.join(dir, "/client/build")))

   app.get("*", (req, res) => {
      res.sendFile(path.resolve(dir, "client", "build", "index.html"))
   })
} else {
   app.get("/", (req, res) => {
      res.status(200).send(`Server is running on port: ${PORT}`)
   })
}

let PORT = process.env.PORT || 1337
const server = app.listen(PORT, () =>
   console.log(`server is running at port ${PORT}`)
)

process.on("unhandledRejection", (err) => {
   console.log(
      "shutting down server due to unhandled promise rejection. Error: " +
         err.message
   )
   server.close(() => {
      process.exit(1)
   })
})
