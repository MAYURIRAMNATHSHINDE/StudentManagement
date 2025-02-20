

const express = require("express");
const studentModel = require("../model/student.model");
const courseModel = require("../model/course.model");
const cors = require("cors");
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

studentRoute.get("/api/std/:id",async(req,res)=>{
    try{
        const students=await studentModel.findById(req.params.id)
        if(!students){
            res.status(404).json({msg:"student Not Found"})
        }
    res.status(200).json({msg:`${req.params.id} Student data:`,students})
    }catch(err){
        console.log(err);
        res.status(500).json({msg:"error occured while finding student..."})
    }

})
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
    console.log("Received PATCH request for ID:", req.params.id);
  
    // Ensure the request body contains valid data
    const { name, email, course, enrollmentDate } = req.body;
    if (!name || !email || !course || !enrollmentDate) {
      return res.status(400).json({ msg: "Missing required fields" ,name,email});
    }
  
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





studentRoute.get("/api/std/search", async (req, res) => {
    try {
        console.log("API hit");

        const searchTerm = req.query.q?.trim();
        if (!searchTerm || typeof searchTerm !== "string") {
            return res.status(400).json({ msg: "Invalid search query" });
        }

        let query = {
            $or: [
                { name: { $regex: searchTerm, $options: "i" } },
                { course: { $regex: searchTerm, $options: "i" } },
                { email: { $regex: searchTerm, $options: "i" } },
            ],
        };

        // ✅ Only search by ID if it's a **valid ObjectId**
        if (mongoose.Types.ObjectId.isValid(searchTerm)) {
            query = { _id: new mongoose.Types.ObjectId(searchTerm) };
        }

        const students = await studentModel.find(query);

        if (students.length === 0) {
            return res.status(404).json({ msg: "No students found" });
        }

        res.status(200).json(students);
    } catch (err) {
        console.error("Error searching students:", err);
        res.status(500).json({ msg: "Internal server error" });
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
