let students = [];
let courses = [];
let currentSection = "dashboard";
let editingId = null;
let editingCourseId = null;
let deleteType = ""; // 'student' or 'course'
let deleteId = null;


const studentTableBody = document.getElementById("studentTableBody");
const allStudentsTableBody = document.getElementById(
  "allStudentsTableBody"
);
const courseTableBody = document.getElementById("courseTableBody");
const studentModal = document.getElementById("studentModal");
const courseModal = document.getElementById("courseModal");
const studentForm = document.getElementById("studentForm");
const courseForm = document.getElementById("courseForm");
const searchInput = document.querySelector(".search-bar input");
const loadingSpinner = document.querySelector(".loading-spinner");


// Initialize the dashboard
document.addEventListener("DOMContentLoaded", async () => {
  initializeEventListeners();
  await checkAndLoadData();
});


// Initialize all event listeners
function initializeEventListeners() {
  // Form submissions
  studentForm.addEventListener("submit", handleFormSubmit);
  courseForm.addEventListener("submit", handleCourseFormSubmit);

  // Search functionality
  searchInput.addEventListener("input", handleSearch);

  // Navigation
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const section = item.dataset.section;
      navigateToSection(section);
    });
  });

  // Modal outside click handlers
  window.onclick = (event) => {
    if (event.target === studentModal) closeModal();
    if (event.target === courseModal) closeCourseModal();
  };
}



// Initial data load and checks
async function checkAndLoadData() {
  showLoading();
  try {
    await loadCourses();

    // Check if we have any courses
    if (courses.length === 0) {
      showNotification(
        "Please add courses before managing students",
        "warning"
      );
      navigateToSection("courses");
      openCourseModal();
      return;
    }

    await Promise.all([loadStudents(), updateDashboardStats()]);
  } catch (error) {
    console.error("Error during initialization:", error);
    showNotification("Error initializing application", "error");
  } finally {
    hideLoading();
  }
}

// Navigation functions
function navigateToSection(section) {
  currentSection = section;

  // Update active nav item
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
    if (item.dataset.section === section) {
      item.classList.add("active");
    }
  });

  // Hide all sections
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active");
  });

  // Show selected section
  document.getElementById(`${section}Section`).classList.add("active");

  // Refresh data when switching sections
  if (section === "courses") {
    loadCourses();
  } else if (section === "students" || section === "dashboard") {
    loadStudents();
    updateDashboardStats();
  }
}

async function updateDashboardStats() {
  try {
    const response = await fetch(`http://localhost:8080/student/api/dashboard/stats`);
    if (!response.ok) throw new Error("Failed to fetch dashboard stats");

    const responseData = await response.json();  
    console.log("Dashboard Stats API Response:", responseData); // Debugging

    // Extract stats object
    const stats = responseData.stats;  // ✅ Fix: Access nested object

    // Validate stats structure
    if (!stats || typeof stats !== "object") {
      throw new Error("Invalid stats data structure");
    }

    // Update dashboard cards with correct property names
    document.querySelector(".card:nth-child(1) .card-value").textContent =
      stats.totalStudents?.toLocaleString() || "N/A";
    document.querySelector(".card:nth-child(2) .card-value").textContent =
      stats.activeCourses?.toLocaleString() || "N/A";
    document.querySelector(".card:nth-child(3) .card-value").textContent =
      stats.graduates?.toLocaleString() || "N/A";
    document.querySelector(".card:nth-child(4) .card-value").textContent =
      stats.successRate !== undefined ? `${stats.successRate}%` : "N/A";

  } catch (error) {
    console.error("Error updating dashboard stats:", error);
    showNotification("Error updating statistics", "error");
  }
}

async function loadStudents() {
  try {
    const response = await fetch("http://localhost:8080/student/api/std");
    if (!response.ok) throw new Error("Failed to fetch students");

    const data = await response.json();
    console.log("Students API Response:", data);

    // ✅ Check `data.students`, not `data.course`
    if (!Array.isArray(data.students)) {
      throw new Error("Invalid students data: Expected an array");
    }

    renderStudentTables(data.students);  // ✅ Pass the correct array
  } catch (error) {
    console.error("Error loading students:", error);
    showNotification("Error loading students", "error");
  }
}


async function loadCourses() {
  try {
    showLoading();
    const response = await fetch("http://localhost:8080/course/api/courses");
    const data = await response.json();

    console.log("Courses API Response:", data); // Debugging

    // Extract the correct array
    const courses = data.course; // Fix: Get the actual array

    if (!Array.isArray(courses)) {
      throw new Error("Invalid course data: Expected an array but got " + typeof courses);
    }

    updateCourseDropdown(courses);
    renderCourseTable(courses);
    return courses;
  } catch (error) {
    console.error("Error loading courses:", error);
    showNotification("Failed to load courses!", "error");
    courses = [];
    renderCourseTable([]);
  } finally {
    hideLoading();
  }
}

// CRUD Operations for Students

async function createStudent(studentData) {
  console.log("Final Student Data Sent to API:", studentData);

  const response = await fetch("http://localhost:8080/student/api/std", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentData),
  });

  const responseText = await response.text();
  console.log("Raw API Response:", responseText);

  if (!response.ok) {
    console.error(`API Error ${response.status}: ${responseText}`);
    throw new Error(responseText || "Unknown API error");
  }

  return JSON.parse(responseText);
}

async function deleteStudent(id) {
  deleteType = "student";
  deleteId = id;
  console.log(deleteId)
  document.getElementById("deleteConfirmationModal").style.display =
    "flex";
    confirmDelete(deleteId,deleteType)
}


async function createCourse(courseData) {
  try {
    console.log("Course Data Being Sent:", JSON.stringify(courseData, null, 2));

    const apiUrl = "http://localhost:8080/course/api/courses";
    console.log("API URL Being Called:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(courseData),
    });

    console.log("Raw API Response Status:", response.status);
    const text = await response.text();
    console.log("Raw API Response Body:", text);

    if (!response.ok) {
      throw new Error(`Failed to create course: ${response.status} - ${text}`);
    }

    const data = JSON.parse(text);
    console.log("Course created successfully:", data);
    return data;
  } catch (error) {
    console.error("Error creating course:", error);
    showNotification("Error creating course", "error");
  }
}


async function updateCourse(id, courseData) {
  try {
    const response = await fetch(`http://localhost:8080/course/api/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courseData),
    });

    console.log(`Updating course ID: ${id}`);

    const text = await response.text(); // Read raw response first
    console.log("Raw API Response Body:", text);

    // Handle JSON responses safely
    let data;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error("Invalid JSON format in response");
      }
    } else {
      throw new Error(`Unexpected response type: ${contentType}`);
    }

    if (!response.ok) {
      throw new Error(`Failed to update course: ${response.status} - ${text}`);
    }

    console.log("Course updated successfully:", data);
    return data;
  } catch (error) {
    console.error("Error updating course:", error);
    showNotification("Error updating course", "error");
  }
}


async function deleteCourse(id) {
  deleteType = "course";
  deleteId = id;
  console.log(deleteId)
  document.getElementById("deleteConfirmationModal").style.display =
    "flex";
    confirmDelete(deleteId,deleteType)
}

function closeDeleteModal(deleteId) {
  document.getElementById("deleteConfirmationModal").style.display =
    "none";
  deleteType = "";
  deleteId = null;
}


async function confirmDelete(deleteId) {
  showLoading();
  try {
    if (deleteType === "student") {
      const response = await fetch(
        `http://localhost:8080/student/api/std/${deleteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete student");
      }

      showNotification("Student deleted successfully", "success");
      await loadStudents();
      await updateDashboardStats();
    } else if (deleteType === "course") {
      const response = await fetch(
        `http://localhost:8080/course/api/courses/${deleteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete course");
      }

      showNotification("Course deleted successfully", "success");
      await loadCourses();
      await updateDashboardStats();
    }
  } catch (error) {
    console.error("Error during deletion:", error);
    showNotification(error.message || "Error during deletion", "error");
  } finally {
    hideLoading();
    closeDeleteModal();
  }
}


async function handleFormSubmit(e) {
  e.preventDefault();
  showLoading();

  // Ensure enrollment date is properly set
  const enrollmentDateField = document.getElementById("enrollmentDate");
  if (!enrollmentDateField) {
    console.error("Enrollment Date field not found!");
    showNotification("Enrollment Date field is missing!", "error");
    hideLoading();
    return;
  }

  console.log("Enrollment Date Before Reading:", enrollmentDateField.value);

  // Collect student data from the form
  const studentData = {
    name: document.getElementById("studentName")?.value?.trim() || "",
    email: document.getElementById("studentEmail")?.value?.trim() || "",
    course: [document.getElementById("studentCourse")?.value] || "",
    enrollmentDate: enrollmentDateField.value || "",
    status: "active",
  };

  if (!studentData.enrollmentDate) {
    console.error("Enrollment Date is empty!");
    showNotification("Enrollment Date is required!", "error");
    hideLoading();
    return;
  }

  console.log("Submitting Student Data:", JSON.stringify(studentData, null, 2));
 
  try {
        const response = editingId
          ? await updateStudent(editingId, studentData)
          : await createStudent(studentData);
    
        console.log("API Response:", response);
    
        if (!response || typeof response !== "object") {
          throw new Error("Invalid API response.");
        }
    
        showNotification(
          editingId ? "Student updated successfully" : "Student created successfully",
          "success"
        );
    
        closeModal();
        await loadStudents();
        await updateDashboardStats();
      } catch (error) {
        console.error("Error:", error);
        showNotification("Error saving student data", "error");
      } finally {
        hideLoading();
      }
}

async function updateStudent(id, studentData) {
  if (!id) {
    console.error("Error: Missing student ID!");
    return;
  }

  console.log("Updating Student with ID:", id);
  console.log("Data Sent to API:", JSON.stringify(studentData, null, 2));

  const response = await fetch(`http://localhost:8080/student/api/std/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentData),
  });

  console.log("Raw API Response:", response);

  let responseText;
  try {
    responseText = await response.text();
    console.log("Full API Response Body:", responseText);
  } catch (e) {
    console.error("Error reading response body:", e);
  }

  if (!response.ok) {
    let errorMessage = `Failed to update student - Status: ${response.status}`;
    try {
      const errorJson = JSON.parse(responseText);
      errorMessage = errorJson.message || errorMessage;
    } catch (e) {
      console.error("Error parsing JSON response:", e);
    }
    console.error("API Error:", errorMessage);
    throw new Error(errorMessage);
  }

  return JSON.parse(responseText);
}


async function handleCourseFormSubmit(e) {
  e.preventDefault();
  showLoading();

  const courseData = {
    name: document.getElementById("courseName").value.trim(),
    description: document.getElementById("courseDescription").value.trim(),
    duration: String(document.getElementById("courseDuration").value),
    status: document.getElementById("courseStatus").value,
  };

  console.log("Course Data Being Sent:", courseData);
  console.log("Current Editing Course ID:", editingCourseId); 

  try {
    if (editingCourseId) {
      console.log(`Updating course with ID: ${editingCourseId}`);
      await updateCourse(editingCourseId, courseData);
      showNotification("Course updated successfully", "success");
    } else {
      console.log("Creating new course...");
      await createCourse(courseData);
      showNotification("Course created successfully", "success");
    }

    closeCourseModal();
    await loadCourses();
    await updateDashboardStats();
    
    editingCourseId = null; 
  } catch (error) {
    console.error("Error:", error);
    showNotification("Error saving course data", "error");
  } finally {
    hideLoading();
  }
}


function renderStudentTables(studentsToRender) {
  if (!Array.isArray(studentsToRender)) {
    console.error("Error: Expected an array, but got", studentsToRender);
    return;
  }

  const tables = [studentTableBody, allStudentsTableBody];

  tables.forEach((table) => {
    if (!table) return; // Skip if table doesn't exist

    table.innerHTML = "";

    if (studentsToRender.length === 0) {
      const colSpan = table.closest("table").querySelectorAll("th").length;
      table.innerHTML = `
        <tr>
          <td colspan="${colSpan}" class="empty-state">
            <i class="fas fa-users"></i>
            <h3>No Students Found</h3>
            <p>Click "Add Student" to add your first student</p>
          </td>
        </tr>
      `;
      return;
    }

    studentsToRender.forEach((student) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${student._id}</td>
        <td>${escapeHtml(student.name)}</td>
        <td>${escapeHtml(student.courseName || student.course)}</td>
        <td>${formatDate(student.enrollmentDate)}</td>
        <td>
          <span class="status-badge status-${student.status}">
            ${capitalizeFirstLetter(student.status)}
          </span>
        </td>
        <td class="action-buttons">
          
          <button class="action-btn edit-btn" onclick="editStudent('${student._id}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="action-btn delete-btn" onclick="deleteStudent('${student._id}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </td>
      `;
      table.appendChild(row);
    });
  });
}


function updateCourseDropdown(courses) {
  const courseSelect = document.getElementById("studentCourse");
  courseSelect.innerHTML = '<option value="">Select Course</option>';

  courses
    .filter((course) => course.status === "active")
    .forEach((course) => {
      const option = document.createElement("option");
      option.value = course._id;
      option.textContent = course.name;
      courseSelect.appendChild(option);
    });
}

function renderCourseTable(coursesToRender) {
  courseTableBody.innerHTML = "";

  if (coursesToRender.length === 0) {
    courseTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-book"></i>
                    <h3>No Courses Found</h3>
                    <p>Click "Add Course" to add your first course</p>
                </td>
            </tr>
        `;
    return;
  }

  coursesToRender.forEach((course) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${course._id}</td>
            <td>${escapeHtml(course.name)}</td>
            <td>${escapeHtml(course.description)}</td>
            <td>${course.duration}</td>
            <td>
                <span class="status-badge status-${course.status}">
                    ${capitalizeFirstLetter(course.status)}
                </span>
            </td>
            <td class="action-buttons">
                <button class="action-btn edit-btn" onclick="editCourse('${course._id
      }')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn delete-btn" onclick="deleteCourse('${course._id
      }')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
    courseTableBody.appendChild(row);
  });
}


function openModal() {
  console.log("Opening student modal...");
  document.getElementById("studentModal").style.display = "block";
}


function closeModal() {
  studentModal.style.display = "none";
  editingId = null;
  studentForm.reset();
}


function openCourseModal() {
  courseModal.style.display = "flex";
  editingCourseId = null;
  courseForm.reset();
  document.getElementById("courseModalTitle").textContent =
    "Add New Course";
}

function closeCourseModal() {
  courseModal.style.display = "none";
  editingCourseId = null;
  courseForm.reset();
}


async function editStudent(id) {
  showLoading();
  try {
    console.log(`Fetching student with ID: ${id}...`);

    const response = await fetch(`http://localhost:8080/student/api/std/${id}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Response Error:", errorText);
      throw new Error(errorText || "Failed to fetch student");
    }

    // ✅ Log response before parsing
    const responseText = await response.text();
    console.log("Raw API Response:", responseText);

    // ✅ Prevent parsing empty response
    if (!responseText) {
      throw new Error("Empty response from server");
    }

    const student = JSON.parse(responseText);
    console.log("Fetched Student Data:", student);

    if (!student || Object.keys(student).length === 0) {
      throw new Error("Student data is empty or undefined");
    }

    editingId = id;
    document.getElementById("modalTitle").textContent = "Edit Student";
    document.getElementById("studentName").value = student.students.name || "";
    document.getElementById("studentEmail").value = student.students.email || "";
    document.getElementById("studentCourse").value = student.students.course || "";
    const dateObj = new Date(student.students.enrollmentDate);
const formattedDate = dateObj.toISOString().split("T")[0]; // Converts to "2025-02-18"
document.getElementById("enrollmentDate").value = formattedDate;

    console.log("Final Input Values:");
    console.log("Name:", document.getElementById("studentName").value);
    console.log("Email:", document.getElementById("studentEmail").value);
    console.log("Course:", [document.getElementById("studentCourse")?.value]);
    console.log("Enrollment Date:", document.getElementById("enrollmentDate").value);
    
    

    studentModal.style.display = "flex";
  } catch (error) {
    console.error("Error loading student for edit:", error);
    showNotification(error.message || "Error loading student data", "error");
  } finally {
    hideLoading();
  }
}

async function editCourse(id) {
  showLoading();
  try {
    console.log(`Fetching course with ID: ${id}`);

    const response = await fetch(`http://localhost:8080/course/api/courses/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch course: ${await response.text()}`);
    }

    const course = await response.json();
    console.log("Fetched Course Data:", course);

    if (!course || Object.keys(course).length === 0) {
      throw new Error("Course data is empty or undefined");
    }

    // ✅ Set editing mode
    editingCourseId = id;
    console.log("Editing Course ID Set:", editingCourseId);

    // Populate the form with existing course details
    document.getElementById("courseName").value = course.course.name || "";
    document.getElementById("courseDescription").value = course.course.description || "";
    document.getElementById("courseDuration").value = String(course.course.duration) || "";
    document.getElementById("courseStatus").value = course.course.status || "active";

    courseModal.style.display = "flex";
  } catch (error) {
    console.error("Error loading course for edit:", error);
    showNotification(error.message || "Error loading course data", "error");
  } finally {
    hideLoading();
  }
}


async function fetchAndRenderStudents() {
  try {
    const response = await fetch(`http://localhost:8080/student/api/std`);
    const students = await response.json();

    if (!response.ok) {
      throw new Error("Failed to fetch students");
    }

    renderStudentTables(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    showNotification("Failed to load student data", "error");
  }
}

// Search Functionality
// let searchTimeout;
// function handleSearch(e) {
//   clearTimeout(searchTimeout);
//   const searchTerm = e.target.value.trim();

//   searchTimeout = setTimeout(async () => {
//     if (searchTerm.length === 0) {
//       await loadStudents();
//       return;
//     }

//     showLoading();
//     try {
//       const response = await fetch(
//         `http://localhost:8080/student/api/std/search?q=${encodeURIComponent(
//           searchTerm
//         )}`
//       );
//       if (!response.ok) throw new Error("Search failed");

//       const filteredStudents = await response.json();
//       renderStudentTables(filteredStudents);
//     } catch (error) {
//       console.error("Error searching students:", error);
//       showNotification("Error searching students", "error");
//     } finally {
//       hideLoading();
//     }
//   }, 300); // Debounce search requests
// }


// function handleSearch(e) {
//   const searchTerm = document.getElementById("searchInput").value.trim();
//   const resultsContainer = document.getElementById("results");

//   if (!searchTerm) {
//       resultsContainer.innerHTML = "<p>Please enter a search term.</p>";
//       return;
//   }

//   fetch(`http://localhost:8080/student/api/std/search?q=${encodeURIComponent(searchTerm)}`)
//       .then(response => response.json())
//       .then(data => {
//           resultsContainer.innerHTML = ""; // Clear previous results
//           if (data.length === 0) {
//               resultsContainer.innerHTML = "<p>No results found.</p>";
//           } else {
//               data.forEach(student => {
//                   const div = document.createElement("div");
//                   div.innerHTML = `<p><strong>Name:</strong> ${student.name} <br>
//                                    <strong>Email:</strong> ${student.email} <br>
//                                    <strong>Course:</strong> ${student.course}</p>`;
//                   resultsContainer.appendChild(div);
//               });
//           }
//       })
//       .catch(error => {
//           console.error("Error fetching search results:", error);
//           resultsContainer.innerHTML = "<p>Error fetching results.</p>";
//       });
// }
document.getElementById("searchInput").addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
      handleSearch();
  }
});
function handleSearch() {
  const searchTerm = document.getElementById("searchInput").value.trim();
  const resultsContainer = document.getElementById("results");

  if (!searchTerm) {
      resultsContainer.innerHTML = "<p>Please enter a search term.</p>";
      console.log("No search term provided");
      return;
  }

  const apiUrl = `http://localhost:8080/student/api/std/search?q=${encodeURIComponent(searchTerm)}`;
  console.log("Fetching from API:", apiUrl); // Log API request URL

  fetch(apiUrl)
      .then(response => {
          console.log("📡 API Response Received:", response);
          return response.json();
      })
      .then(data => {
          console.log("📊 Data from API:", data); // Log the API response data
          resultsContainer.innerHTML = ""; // Clear previous results
          if (data.length === 0) {
              resultsContainer.innerHTML = "<p>No results found.</p>";
          } else {
              data.forEach(student => {
                  const div = document.createElement("div");
                  div.innerHTML = `<p><strong>Name:</strong> ${student.students.name} <br>
                                   <strong>Email:</strong> ${student.students.email} <br>
                                   <strong>Course:</strong> ${student.students.course}</p>`;
                  resultsContainer.appendChild(div);
              });
          }
      })
      .catch(error => {
          console.error("Error fetching search results:", error);
          resultsContainer.innerHTML = "<p>Error fetching results.</p>";
      });
}

let searchTimeout;
      function handleSearch(e) {
        clearTimeout(searchTimeout);
        const searchTerm = e.target.value.trim();

        searchTimeout = setTimeout(async () => {
          if (searchTerm.length === 0) {
            await loadStudents();
            return;
          }

          showLoading();
          try {
            const response = await fetch(`http://localhost:8080/student/api/std/search?q=${encodeURIComponent(searchTerm)}`);
            if (!response.ok) throw new Error("Search failed");

            const filteredStudents = await response.json();
            renderStudentTables(filteredStudents);
          } catch (error) {
            console.error("Error searching students:", error);
            showNotification("Error searching students", "error");
          } finally {
            hideLoading();
          }
        }, 300); // Debounce search requests
      }

function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatDateForInput(dateString) {
  return new Date(dateString).toISOString().split("T")[0];
}

function capitalizeFirstLetter(string) {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return ''; // Ensure it's a string before calling replace
  return unsafe.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");
}

// Loading Spinner Functions
function showLoading() {
  document.querySelector(".loading-spinner").classList.add("active");
}



function hideLoading() {
  document.querySelector(".loading-spinner").classList.remove("active");
}

// Notification System
function showNotification(message, type = "info") {
  // Remove any existing notifications
  const existingNotifications =
    document.querySelectorAll(".notification");
  existingNotifications.forEach((notification) => notification.remove());

  // Create new notification
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Add notification to the document
  document.body.appendChild(notification);

  // Remove notification after delay
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}


// Error Handler
function handleError(error, defaultMessage = "An error occurred") {
  console.error(error);
  showNotification(error.message || defaultMessage, "error");
}

// Update modal close handlers
window.onclick = (event) => {
  if (event.target === studentModal) closeModal();
  if (event.target === courseModal) closeCourseModal();
  if (event.target === document.getElementById("deleteConfirmationModal"))
    closeDeleteModal();
};