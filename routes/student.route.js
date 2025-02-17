// const express=require("express");
// const studentModel = require("../model/student.model");
// const courseModel = require("../model/course.model");
const cors = require("cors");


// const studentRoute=express.Router()

// studentRoute.get("/api/std",async(req,res)=>{
//     try{
//     //     const course=await studentModel.find().sort({createdAt:-1});
//     // res.status(200).json({msg:"Students List:",course})
//     const students = await studentModel.find().populate("course").sort({ createdAt: -1 });
// res.status(200).json({ msg: "Students List:", students });

//     }catch(err){
//         console.log(err);
//         res.status(500).json({msg:"error occured while finding courses..."})
//     }
// })

// studentRoute.post("/api/std",async (req,res)=>{
//     try{
//         const course= await studentModel.create(req.body)
//         res.status(200).json({msg:"Student created:",course})
//     }catch(err){
//         console.log(err);
//         res.status(400).json({msg:"error occured while creating student..."})
//     }
// })


// studentRoute.patch("/api/std/:id",async (req,res)=>{
//     try{
//         const student=await studentModel.findByIdAndUpdate(req.params.id,req.body,{new:true})
//         if(!student){
//             res.status(404).json({msg:"Student Not Found"})
//         }
//         res.status(202).json({msg:"student updated successfully"})
//     }catch(err){
//         console.log(err);
//         res.status(400).json({msg:"error occurred while updating student..."});

//     }
// })



// studentRoute.delete("/api/std/:id",async(req,res)=>{
//     try{
//         const student=await studentModel.findByIdAndDelete(req.params.id);
//         if(!student){
//             res.status(404).json({msg:"Student Not Found"})
//         }
//     res.status(200).json({msg:"student deleted successfully..."})
//     }catch(err){
//         console.log(err);
//         res.status(500).json({msg:"error occured while finding student..."})
//     }

// })

// studentRoute.get("/api/std/search",async(req,res)=>{
//     try{
//         const searchTerm=req.query.q;
//         const students=await studentModel.find({
//             $or:[
//                 {name:{$regex:searchTerm,$options:"i"}},
//                 {course:{$regex:searchTerm,$options:"i"}},
//                 {email:{$regex:searchTerm,$options:"i"}},
//             ],
//         });
//         res.status(200).json({students})
//     }catch(err){
//         console.log(err);
//         res.status(500).json({msg:"error occured while searching student..."})
//     }
// })


// studentRoute.get("/api/dashboard/stats",async(req,res)=>{
//     try{
//         const stats=await getDashboardStats();
//         res.status(200).json({stats})
//     }catch(err){
//         console.log(err);
//         res.status(500).json({msg:"error occured in dashboard api..."})
//     }
// })


// async function getDashboardStats() {
//     const activeStudents=await studentModel.countDocuments({status:'active'});
//     const totalCourses=await courseModel.countDocuments();
//     const totalStudents=await studentModel.countDocuments();
//     const activeCourses=await courseModel.countDocuments({status:'active'});
//     const graduates=await studentModel.countDocuments({status:'inactive'});
//     const courseCount=await studentModel.aggregate([{$group:{_id:'$course',count:{$sum:1}}}]);

//     return {
//         activeStudents,totalCourses,activeCourses,graduates,courseCount,totalStudents,
//         successRate:totalStudents>0?Math.round((graduates/totalStudents)*100):0
//     }
// }





// module.exports=studentRoute

const express = require("express");
const studentModel = require("../model/student.model");
const courseModel = require("../model/course.model");

const studentRoute = express.Router();

// Get Students List (with courses)
studentRoute.get("/api/std", async (req, res) => {
    try {
        const students = await studentModel.find().sort({ createdAt: -1 }); 
        res.status(200).json({ msg: "Students List:", students }); // Fix: 'students' instead of 'course'
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Error occurred while finding students..." });
    }
});


// Create Student (Ensure Course Exists)
const mongoose = require("mongoose");

studentRoute.post("/api/std", async (req, res) => {
    try {
        const { name, email, status, course } = req.body;

        // Ensure course is an array
        const courseArray = Array.isArray(course) ? course : [course];

        // Convert course IDs to ObjectId
        const courseIds = courseArray
            .map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null)
            .filter(id => id); // Remove invalid IDs

        // Fetch courses from DB
        const existingCourses = await courseModel.find({ _id: { $in: courseIds } });

        console.log(existingCourses);
        console.log(existingCourses.length);
        console.log(courseArray.length);

        // Check if all provided course IDs exist in DB
        if (existingCourses.length !== courseArray.length) {
            return res.status(400).json({ msg: "One or more courses not found" });
        }

        // Create student
        const student = await studentModel.create({ name, email, status, course: courseIds });

        res.status(200).json({ msg: "Student created", student });
    } catch (err) {
        console.log(err);
        res.status(400).json({ msg: "Error occurred while creating student..." });
    }
});


// studentRoute.post("/api/std", async (req, res) => {
//     try {
//         const { name, email, status, course } = req.body;

//         // Convert course IDs to ObjectId
//         const courseIds = course.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null).filter(id => id);

//         // Fetch courses from DB
//         const existingCourses = await courseModel.find({ _id: { $in: courseIds } });

//         console.log(existingCourses);
//         console.log(existingCourses.length);
//         console.log(course.length);

//         // Check if all provided course IDs exist in DB
//         if (existingCourses.length !== courseIds.length) {
//             return res.status(400).json({ msg: "One or more courses not found" });
//         }

//         // Create student
//         const student = await studentModel.create({ name, email, status, course: courseIds });

//         res.status(200).json({ msg: "Student created", student });
//     } catch (err) {
//         console.log(err);
//         res.status(400).json({ msg: "Error occurred while creating student..." });
//     }
// });

// Update Student
// studentRoute.patch("/api/std/:id", async (req, res) => {
//     try {
//         const student = await studentModel.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("course");
//         if (!student) {
//             return res.status(404).json({ msg: "Student Not Found" });
//         }
//         res.status(202).json({ msg: "Student updated successfully", student });
//     } catch (err) {
//         console.log(err);
//         res.status(400).json({ msg: "Error occurred while updating student..." });
//     }
// });
studentRoute.patch("/api/std/:id", async (req, res) => {
    console.log("Received PATCH request for ID:", req.params.id); // Debugging line
    try {
      const student = await studentModel.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("course");
      if (!student) {
        return res.status(404).json({ msg: "Student Not Found" });
      }
      res.status(202).json({ msg: "Student updated successfully", student });
    } catch (err) {
      console.log(err);
      res.status(400).json({ msg: "Error occurred while updating student..." });
    }
  });
  
// Delete Student
studentRoute.delete("/api/std/:id", async (req, res) => {
    try {
        const student = await studentModel.findByIdAndDelete(req.params.id);
        if (!student) {
            return res.status(404).json({ msg: "Student Not Found" });
        }
        res.status(200).json({ msg: "Student deleted successfully..." });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Error occurred while deleting student..." });
    }
});

// Search Student
studentRoute.get("/api/std/search", async (req, res) => {
    try {
        const searchTerm = req.query.q;
        const students = await studentModel.find({  // Fix: Use `find`, not `fing`
            $or: [
                { name: { $regex: searchTerm, $options: "i" } },
                { course: { $regex: searchTerm, $options: "i" } },
                { email: { $regex: searchTerm, $options: "i" } },
            ],
        });
        res.status(200).json({ students }); // Ensure correct response format
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Error occurred while searching students..." });
    }
});


// Dashboard Stats
studentRoute.get("/api/dashboard/stats", async (req, res) => {
    try {
        const stats = await getDashboardStats();
        res.status(200).json({ stats });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Error occurred in dashboard API..." });
    }
});

// Function to Calculate Stats
async function getDashboardStats() {
    const activeStudents = await studentModel.countDocuments({ status: "active" });
    const totalCourses = await courseModel.countDocuments();
    const totalStudents = await studentModel.countDocuments();
    const activeCourses = await courseModel.countDocuments({ status: "active" });
    const graduates = await studentModel.countDocuments({ status: "inactive" });
    const courseCount = await studentModel.aggregate([{ $group: { _id: "$course", count: { $sum: 1 } } }]);

    return {
        activeStudents,
        totalCourses,
        activeCourses,
        graduates,
        courseCount,
        totalStudents,
        successRate: totalStudents > 0 ? Math.round((graduates / totalStudents) * 100) : 0,
    };
}

module.exports = studentRoute;
