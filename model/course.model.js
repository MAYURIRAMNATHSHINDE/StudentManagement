const mongoose = require("mongoose");


const courseSchema=new mongoose.Schema(
    {
        name:{type:String,required:true,unique:true},
        description:{type:String,required:true},
        duration:{type:String,required:true},
        status:{
            type:String,
            enum:["active","inactive"],
            default:"active"
        }
    },
    {
        timestamps:true,
    }
)


const courseModel=mongoose.model("Course",courseSchema)


module.exports=courseModel