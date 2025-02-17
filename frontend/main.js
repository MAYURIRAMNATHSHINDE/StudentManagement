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

// async function loadStudents() {
//   try {
//     const response = await fetch(`http://localhost:8080/student/api/std`);
//     if (!response.ok) throw new Error("Failed to fetch students");

//     students = await response.json();
//     renderStudentTables(students);
//   } catch (error) {
//     console.error("Error loading students:", error);
//     showNotification("Error loading students", "error");
//     students = [];
//     renderStudentTables([]);
//   }
// }
// async function loadStudents() {
//   try {
//     const response = await fetch("http://localhost:8080/student/api/std");
//     if (!response.ok) throw new Error("Failed to fetch students");

//     const data = await response.json();
//     console.log("Students API Response:", data);

//     // Extract the correct array
//     if (!Array.isArray(data.course)) {
//       throw new Error("Invalid students data: Expected an array");
//     }

//     renderStudentTables(data.course);  // ✅ Pass only the array
//   } catch (error) {
//     console.error("Error loading students:", error);
//     showNotification("Error loading students", "error");
//   }
// }
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


// async function loadCourses() {
//   try {
//     const response = await fetch(`http://localhost:8080/course/api/courses`);
//     if (!response.ok) throw new Error("Failed to fetch courses");

//     courses = await response.json();
//     updateCourseDropdown(courses);
//     renderCourseTable(courses);
//     return courses;
//   } catch (error) {
//     console.error("Error loading courses:", error);
//     showNotification("Error loading courses", "error");
//     courses = [];
//     renderCourseTable([]);
//   }
// }
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
// async function createStudent(studentData) {
//   try {
//     const response = await fetch("http://localhost:8080/student/api/std", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(studentData),
//     });

//     const contentType = response.headers.get("content-type");

//     if (!contentType || !contentType.includes("application/json")) {
//       const textResponse = await response.text();
//       console.error("Invalid API Response:", textResponse);
//       throw new Error(`Unexpected response: ${textResponse}`);
//     }

//     const data = await response.json();
//     console.log("Server Response:", data);

//     if (!response.ok) {
//       throw new Error(data.message || "Failed to create student");
//     }

//     return data;
//   } catch (error) {
//     console.error("Error creating student:", error);
//     throw error;
//   }
// }
async function createStudent(studentData) {
  try {
    const response = await fetch("http://localhost:8080/student/api/std", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentData),
    });

    const responseData = await response.json(); // Try to parse JSON
    console.log("Server Response:", responseData); // Log full response

    if (!response.ok) {
      throw new Error(responseData.msg || "Failed to create student");
    }

    return responseData;
  } catch (error) {
    console.error("Error creating student:", error);
    throw error;
  }
}

// async function updateStudent(id, studentData) {
//   const response = await fetch(`http://localhost:8080/student/api/std/${id}`, {
//     method: "PATCH",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(studentData),
//   });

//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.message || "Failed to update student");
//   }

//   return response.json();
// }
async function updateStudent(id, studentData) {
  const response = await fetch(`http://localhost:8080/student/api/std/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentData),
  });
  

  if (!response.ok) {
    let errorMessage = "Failed to update student";
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch (e) {
      console.error("Error parsing error response:", e);
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

async function deleteStudent(id) {
  deleteType = "student";
  deleteId = id;
  document.getElementById("deleteConfirmationModal").style.display =
    "flex";
}


async function createCourse(courseData) {
  try {
    const response = await fetch("http://localhost:8080/course/api/courses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(courseData),
    });

    // Log raw response
    const text = await response.text();
    console.log("Raw API Response:", text);

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.includes("application/json")) {
      data = JSON.parse(text);
    } else {
      throw new Error(`Invalid response format: Expected JSON but got ${contentType}`);
    }

    if (!response.ok) {
      throw new Error(`Failed to create course: ${response.status} - ${text}`);
    }

    console.log("Course created successfully:", data);
    return data;
  } catch (error) {
    console.error("Error:", error);
    showNotification("Error creating course", "error");
  }
}

async function updateCourse(id, courseData) {
  const response = await fetch(`http://localhost:8080/course/api/courses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(courseData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update course");
  }

  return response.json();
}

async function deleteCourse(id) {
  deleteType = "course";
  deleteId = id;
  document.getElementById("deleteConfirmationModal").style.display =
    "flex";
}

function closeDeleteModal() {
  document.getElementById("deleteConfirmationModal").style.display =
    "none";
  deleteType = "";
  deleteId = null;
}


async function confirmDelete() {
  showLoading();
  try {
    if (deleteType === "student") {
      const response = await fetch(
        `http://localhost:8080/student/api/students/${id}`,
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
        `http://localhost:8080/student/api/students/${deleteId}`,
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

  const studentData = {
    name: document.getElementById("studentName").value.trim(),
    email: document.getElementById("studentEmail").value.trim(),
    course: document.getElementById("studentCourse").value,
    enrollmentDate: document.getElementById("enrollmentDate").value,
    status: "active",
  };

  try {
    const response = editingId 
      ? await updateStudent(editingId, studentData)
      : await createStudent(studentData);

    console.log("API Response:", response); // ✅ Debugging

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


async function handleCourseFormSubmit(e) {
  e.preventDefault();
  showLoading();

  const courseData = {
    name: document.getElementById("courseName").value.trim(),
    description: document
      .getElementById("courseDescription")
      .value.trim(),
    duration: parseInt(document.getElementById("courseDuration").value),
    status: document.getElementById("courseStatus").value,
  };

  try {
    if (editingCourseId) {
      await updateCourse(editingCourseId, courseData);
      showNotification("Course updated successfully", "success");
    } else {
      await createCourse(courseData);
      showNotification("Course created successfully", "success");
    }
    closeCourseModal();
    await loadCourses();
    await updateDashboardStats();
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

// Update the editStudent function
// async function editStudent(id) {
//   showLoading();
//   try {
//     const response = await fetch(`http://localhost:8080/student/api/students/${id}`);
//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.message || "Failed to fetch student");
//     }

//     const student = await response.json();

//     editingId = id;
//     document.getElementById("modalTitle").textContent = "Edit Student";
//     document.getElementById("studentName").value = student.name;
//     document.getElementById("studentEmail").value = student.email;
//     document.getElementById("studentCourse").value = student.course;
//     document.getElementById("enrollmentDate").value = formatDateForInput(
//       student.enrollmentDate
//     );

//     studentModal.style.display = "flex";
//   } catch (error) {
//     console.error("Error loading student for edit:", error);
//     showNotification(
//       error.message || "Error loading student data",
//       "error"
//     );
//   } finally {
//     hideLoading();
//   }
// }

// Update the editCourse function
// async function editCourse(id) {
//   showLoading();
//   try {
//     const response = await fetch(`http://localhost:8080/course/api/courses/${id}`);
//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.message || "Failed to fetch course");
//     }

//     const course = await response.json();

//     editingCourseId = id;
//     document.getElementById("courseModalTitle").textContent =
//       "Edit Course";
//     document.getElementById("courseName").value = course.name;
//     document.getElementById("courseDescription").value =
//       course.description;
//     document.getElementById("courseDuration").value = course.duration;
//     document.getElementById("courseStatus").value = course.status;

//     courseModal.style.display = "flex";
//   } catch (error) {
//     console.error("Error loading course for edit:", error);
//     showNotification(
//       error.message || "Error loading course data",
//       "error"
//     );
//   } finally {
//     hideLoading();
//   }
// }
// async function editStudent(id) {

//   console.log("Editing Student with ID:", id); // Debugging

//   if (!id) {
//     console.error("Error: ID is undefined!");
//     showNotification("Invalid student ID", "error");
//   }
//   showLoading();
//   try {
//     const response = await fetch(`http://localhost:8080/student/api/std/${id}`);

//     // Check if the response is JSON
//     const contentType = response.headers.get("content-type");
//     if (!contentType || !contentType.includes("application/json")) {
//       const text = await response.text();
//       console.log(text)
//       throw new Error(`Invalid response from server: ${text}`);
//     }

//     const data = await response.json();
//     if (!response.ok) {
//       throw new Error(data.error || "Failed to fetch student");
//     }

//     console.log("Fetched Student Data:", data);

//     editingId = id;
//     document.getElementById("modalTitle").textContent = "Edit Student";
//     document.getElementById("studentName").value = data.name || "";
//     document.getElementById("studentEmail").value = data.email || "";
//     document.getElementById("studentCourse").value = data.course || "";
//     document.getElementById("enrollmentDate").value = formatDateForInput(data.enrollmentDate || "");

//     studentModal.style.display = "flex";
//   } catch (error) {
//     console.error("Error loading student for edit:", error);
//     showNotification(error.message || "Error loading student data", "error");
//   } finally {
//     hideLoading();
//   }
// }

async function editStudent(id) {
  console.log("Editing Student with ID:", id); // Debugging

  if (!id) {
    console.error("Error: ID is undefined!");
    showNotification("Invalid student ID", "error");
    return; // Return early if the ID is not valid
  }

  showLoading();
  try {
    const response = await fetch(`http://localhost:8080/student/api/std/${id}`);

    // Check if the response is JSON
    const contentType = response.headers.get("Content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.log(text);
      throw new Error(`Invalid response from server: ${text}`);
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch student");
    }

    console.log("Fetched Student Data:", data);

    // Set modal content
    editingId = id;
    document.getElementById("modalTitle").textContent = "Edit Student";
    document.getElementById("studentName").value = data.name || "";
    document.getElementById("studentEmail").value = data.email || "";
    document.getElementById("studentCourse").value = data.course || "";
    document.getElementById("enrollmentDate").value = formatDateForInput(data.enrollmentDate || "");

    studentModal.style.display = "flex";
  } catch (error) {
    console.error("Error loading student for edit:", error);
    showNotification(error.message || "Error loading student data", "error");
  } finally {
    hideLoading();
  }
}

// Search Functionality
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
      const response = await fetch(
        `http://localhost:8080/student/api/std/search?q=${encodeURIComponent(
          searchTerm
        )}`
      );
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