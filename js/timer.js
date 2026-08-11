// Session & Timer Manager - Manages 45-Minute Class Timer Sessions for Students

const TimerEngine = {
    activeTimers: {},
    globalClassTimer: 2700, // 45 minutes default
    globalTimerInterval: null,

    // Start a 45-minute timer session for a specific student
    startStudentTimer: function(studentId) {
        const student = AppState.students.find(s => s.id === studentId);
        if (!student) return;

        // Clear existing timer if any
        if (this.activeTimers[studentId]) {
            clearInterval(this.activeTimers[studentId]);
        }

        student.sessionActive = true;
        
        this.activeTimers[studentId] = setInterval(() => {
            if (student.sessionTimer > 0) {
                student.sessionTimer--;
                
                // Periodically update student location ping (every 60s)
                if (student.sessionTimer % 60 === 0) {
                    LocationEngine.updateStudentLocation(studentId);
                }

                this.updateStudentTimerUI(studentId);
            } else {
                // Session expired
                this.expireStudentSession(studentId);
            }
        }, 1000);
    },

    // Format seconds into MM:SS
    formatTime: function(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // Update single student timer element in DOM
    updateStudentTimerUI: function(studentId) {
        const timerElem = document.getElementById(`timer-${studentId}`);
        const student = AppState.students.find(s => s.id === studentId);
        
        if (timerElem && student) {
            timerElem.innerText = this.formatTime(student.sessionTimer);
            
            // Highlight timer color when < 5 mins remaining
            if (student.sessionTimer < 300) {
                timerElem.classList.add('timer-warning');
            } else {
                timerElem.classList.remove('timer-warning');
            }
        }
    },

    // Session completion handler
    expireStudentSession: function(studentId) {
        if (this.activeTimers[studentId]) {
            clearInterval(this.activeTimers[studentId]);
            delete this.activeTimers[studentId];
        }

        const student = AppState.students.find(s => s.id === studentId);
        if (student) {
            student.sessionActive = false;
            student.sessionTimer = 0;
            
            App.addActivityLog(`⏱️ 45-Min Class Session completed for ${student.name} (${student.rollNo}). Auto-checked out.`);
            App.showNotification(`Class session ended for ${student.name}.`, "info");
            App.renderAll();
        }
    },

    // Start Master Class 45-Minute Timer
    startGlobalClassSession: function() {
        if (this.globalTimerInterval) clearInterval(this.globalTimerInterval);

        this.globalClassTimer = CLASSROOM_GEOFENCE.maxClassDurationMinutes * 60; // 2700s

        this.globalTimerInterval = setInterval(() => {
            if (this.globalClassTimer > 0) {
                this.globalClassTimer--;
                const globalElem = document.getElementById('globalClassTimer');
                if (globalElem) {
                    globalElem.innerText = this.formatTime(this.globalClassTimer);
                }
            } else {
                clearInterval(this.globalTimerInterval);
                App.showNotification("🔔 45-Minute Class Session Period Ended!", "warning");
                App.addActivityLog("🔔 Master Class 45-Minute Session Period Concluded.");
            }
        }, 1000);
    }
};
