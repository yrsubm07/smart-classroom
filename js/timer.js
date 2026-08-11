// Session & 45-Minute Timer Manager

const TimerEngine = {
    activeTimers: {},
    masterTimerSeconds: 2700, // 45 Minutes in seconds
    masterInterval: null,

    // Start 45-min timer for student
    startStudentTimer: function(studentId) {
        const student = AppState.students.find(s => s.id === studentId);
        if (!student) return;

        if (this.activeTimers[studentId]) {
            clearInterval(this.activeTimers[studentId]);
        }

        student.sessionActive = true;

        this.activeTimers[studentId] = setInterval(() => {
            if (student.sessionTimer > 0) {
                student.sessionTimer--;
                
                // Auto GPS update every 60 seconds
                if (student.sessionTimer % 60 === 0) {
                    LocationEngine.updateStudentLocation(studentId);
                }

                this.updateStudentTimerUI(studentId);
            } else {
                this.expireSession(studentId);
            }
        }, 1000);
    },

    formatTime: function(seconds) {
        if (!seconds || seconds <= 0) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },

    updateStudentTimerUI: function(studentId) {
        const elem = document.getElementById(`timer-${studentId}`);
        const student = AppState.students.find(s => s.id === studentId);
        
        if (elem && student) {
            elem.innerText = this.formatTime(student.sessionTimer);
            if (student.sessionTimer < 300) {
                elem.classList.add('timer-warning');
            } else {
                elem.classList.remove('timer-warning');
            }
        }

        // Also update student self-portal timer if visible
        if (AppState.currentRole === "student" && AppState.selectedStudentId === studentId) {
            const selfElem = document.getElementById('studentPortalTimer');
            if (selfElem && student) {
                selfElem.innerText = this.formatTime(student.sessionTimer);
            }
        }
    },

    expireSession: function(studentId) {
        if (this.activeTimers[studentId]) {
            clearInterval(this.activeTimers[studentId]);
            delete this.activeTimers[studentId];
        }

        const student = AppState.students.find(s => s.id === studentId);
        if (student) {
            student.sessionActive = false;
            student.sessionTimer = 0;
            
            App.addActivityLog(`⏱️ 45-Min Session Completed: ${student.name} (${student.rollNo}) auto-checked out.`);
            App.showNotification(`45-minute class session ended for ${student.name}.`, "info");
            App.renderAll();
        }
    },

    startMasterTimer: function() {
        if (this.masterInterval) clearInterval(this.masterInterval);

        this.masterTimerSeconds = CLASSROOM_GEOFENCE.maxClassDurationMinutes * 60; // 2700s

        this.masterInterval = setInterval(() => {
            if (this.masterTimerSeconds > 0) {
                this.masterTimerSeconds--;
                const elem = document.getElementById('globalClassTimer');
                if (elem) elem.innerText = this.formatTime(this.masterTimerSeconds);
            } else {
                clearInterval(this.masterInterval);
                App.showNotification("🔔 Master 45-Minute Class Period Ended!", "warning");
                App.addActivityLog("🔔 Master 45-Minute Class Period Concluded.");
            }
        }, 1000);
    }
};
