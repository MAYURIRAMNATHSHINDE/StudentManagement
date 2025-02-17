const express=require("express")
const cors = require("cors");
const ConnectToDB = require("./config")
const courseRoute = require("./routes/course.routes")
const studentRoute = require("./routes/student.route")
require('dotenv').config()
const app=express()



app.use(express.json())
app.use(cors());
app.use("/course",courseRoute)
app.use("/student",studentRoute)
PORT=process.env.PORT


app.listen(PORT,()=>{
    ConnectToDB()
    console.log("server started...")
})