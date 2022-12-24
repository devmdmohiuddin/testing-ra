const mongoose = require("mongoose")

const connectDB = async () => {
   // Connecting to the database
   mongoose
      .connect(process.env.MONGO_URI, {
         useNewUrlParser: true,
         useUnifiedTopology: true,
         // useFindAndModify: false,
         // tls: true,
         // tlsCAFile: __dirname + "/ca-certificate.crt"
      })
      .then((data) => {
         console.log(
            `mongodb connection established with server: ${data.connection.host}`
         )
      })
}

module.exports = connectDB
