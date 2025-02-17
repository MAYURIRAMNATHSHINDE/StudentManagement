const mongoose = require("mongoose");


const studentSchema=new mongoose.Schema(
    {
        name:{type:String,required:true},
        email:{type:String,required:true,unique:true},
        course: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
        enrollmentDate: { type: Date, required: true, default: Date.now }
        ,
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


const studentModel=mongoose.model("Student",studentSchema)


module.exports=studentModel