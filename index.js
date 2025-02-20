const express=require("express")
const cors = require("cors");
const ConnectToDB = require("./config")
const courseRoute = require("./routes/course.routes")
const studentRoute = require("./routes/student.route")
require('dotenv').config()
const app=express()



app.use(express.json())
app.use(cors());
app.use(express.static('frontend'));

app.use("/course",courseRoute)
app.use("/student",studentRoute)
PORT=process.env.PORT || 8080

app.get("/", (req, res) => {
    res.send("Server is up and running!");
  });
  
app.listen(PORT,'0.0.0.0',()=>{
    ConnectToDB()
    console.log("server started...")
})