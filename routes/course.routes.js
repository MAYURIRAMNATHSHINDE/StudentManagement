const express=require("express")
const studentModel = require("../model/student.model");
const courseModel = require("../model/course.model");


const courseRoute=express.Router()



courseRoute.get("/api/courses",async(req,res)=>{
    try{
        const course=await courseModel.find().sort({name:-1});
    res.status(200).json({msg:"Students courses:",course})
    }catch(err){
        console.log(err);
        res.status(500).json({msg:"error occured while finding courses..."})
    }

})

courseRoute.get("/api/courses/:id",async(req,res)=>{
    try{
        const course=await courseModel.findById(req.params.id)
        if(!course){
            res.status(404).json({msg:"Course Not Found"})
        }
    res.status(200).json({msg:`${req.params.id} Student course:`,course})
    }catch(err){
        console.log(err);
        res.status(500).json({msg:"error occured while finding courses..."})
    }

})


courseRoute.post("/api/courses",async (req,res)=>{
    try{
        const course= await courseModel.create(req.body)
        res.status(200).json({msg:"Students courses created:",course})
    }catch(err){
        console.log(err);
        res.status(400).json({msg:"error occured while creating courses..."})
    }
})

courseRoute.patch("/api/courses/:id",async (req,res)=>{
    try{
        const course=await courseModel.findByIdAndUpdate(req.params.id,req.body,{new:true})
        if(!course){
            res.status(404).json({msg:"Course Not Found"})
        }
        res.status(202).json({msg:"course updated successfully"})
    }catch(err){
        console.log(err);
        res.status(400).json({msg:"error occured while updateing courses...",course})
    }
})

courseRoute.delete("/api/courses/:id",async(req,res)=>{
    try{
        const enrolledStudents=await studentModel.countDocuments({course:req.params.id});
        if(enrolledStudents>0){
            res.status(400).json({msg:"Cannot delete course with enrolled students."})
        }

        const course=await courseModel.findByIdAndDelete(req.params.id);
        if(!course){
            res.status(404).json({msg:"Course Not Found"})
        }
    res.status(200).json({msg:"course deleted successfully..."})
    }catch(err){
        console.log(err);
        res.status(500).json({msg:"error occured while finding courses..."})
    }

})

module.exports=courseRoute