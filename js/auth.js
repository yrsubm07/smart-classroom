// Dual Authentication Gateway Manager (Teacher ID & Student Enrollment No)

const AuthEngine = {
    currentUser: null, // { role: 'teacher'|'student', id: string, name: string, data: object }

    init: function() {
        // Load saved session if any
        const saved = localStorage.getItem('smart_class_user_session');
        if (saved) {
            try {
                this.currentUser = JSON.parse(saved);
            } catch(e) {
                this.currentUser = null;
            }
        }
    },

    // Teacher Login: ID = "T-304" or "teacher"
    loginTeacher: function(idInput, passwordInput) {
        if (!idInput) {
            App.showNotification("Please enter your Teacher ID!", "error");
            return false;
        }

        if (idInput.trim().toUpperCase() === "T-304" || idInput.trim().toLowerCase() === "teacher" || idInput.trim().toLowerCase() === "admin") {
            this.currentUser = {
                role: "teacher",
                id: TEACHER_PROFILE.id,
                name: TEACHER_PROFILE.name,
                data: TEACHER_PROFILE
            };
            this.saveSession();
            App.showNotification(`Welcome, ${TEACHER_PROFILE.name}! Teacher Dashboard Active.`, "success");
            return true;
        } else {
            App.showNotification("Invalid Teacher ID! Use 'T-304' or 'teacher'.", "error");
            return false;
        }
    },

    // Student Login: Enrollment No = "CS2026-01" to "CS2026-10" or student name
    loginStudent: function(enrollNoInput, passwordInput) {
        if (!enrollNoInput) {
            App.showNotification("Please enter your Student Enrollment No!", "error");
            return false;
        }

        const input = enrollNoInput.trim().toUpperCase();
        const student = AppState.students.find(s => s.enrollNo.toUpperCase() === input || s.id.toUpperCase() === input || s.name.toUpperCase().includes(input));

        if (student) {
            this.currentUser = {
                role: "student",
                id: student.id,
                name: student.name,
                enrollNo: student.enrollNo,
                data: student
            };
            AppState.selectedStudentId = student.id;
            this.saveSession();
            App.showNotification(`Welcome, ${student.name}! Student Portal Active.`, "success");
            return true;
        } else {
            App.showNotification("Student Enrollment No not found! Use 'CS2026-01' to 'CS2026-10'.", "error");
            return false;
        }
    },

    saveSession: function() {
        if (this.currentUser) {
            localStorage.setItem('smart_class_user_session', JSON.stringify(this.currentUser));
        }
    },

    logout: function() {
        this.currentUser = null;
        localStorage.removeItem('smart_class_user_session');
        App.showNotification("Logged out successfully.", "info");
        App.showLoginScreen();
    }
};
