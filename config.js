const mongoose = require("mongoose");


const ConnectToDB=async(req,res)=>{
   await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      tls: true
    })
   console.log("Connected to DB")
}

module.exports=ConnectToDB