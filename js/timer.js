// Timer & Class Alarm Manager

const TimerEngine = {
    activeTimers: {},
    masterTimerSeconds: 2700,
    masterInterval: null,

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

        if (AuthEngine.currentUser && AuthEngine.currentUser.role === 'student' && AuthEngine.currentUser.id === studentId) {
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
            
            App.addActivityLog(`⏱️ 45-Min Session Ended: ${student.name} (${student.enrollNo}) auto-checked out.`);
            App.showNotification(`45-minute class session ended for ${student.name}.`, "info");
            App.renderAll();
        }
    },

    startMasterTimer: function() {
        if (this.masterInterval) clearInterval(this.masterInterval);

        this.masterTimerSeconds = CLASSROOM_GEOFENCE.maxClassDurationMinutes * 60;

        this.masterInterval = setInterval(() => {
            if (this.masterTimerSeconds > 0) {
                this.masterTimerSeconds--;
                const elem = document.getElementById('globalClassTimer');
                if (elem) elem.innerText = this.formatTime(this.masterTimerSeconds);
            } else {
                clearInterval(this.masterInterval);
                this.triggerClassBellAlarm("🔔 45-MINUTE CLASS PERIOD HAS CONCLUDED!");
            }
        }, 1000);
    },

    // Class Bell / Alarm System Sound & Notification
    triggerClassBellAlarm: function(customMessage = "🔔 CLASS ALARM TRIGGERED BY INSTRUCTOR!") {
        QREngine.playBeepSound();
        setTimeout(() => QREngine.playBeepSound(), 200);
        setTimeout(() => QREngine.playBeepSound(), 400);

        App.showNotification(customMessage, "warning");
        App.addActivityLog(`🔊 ALARM SYSTEM: ${customMessage}`);
    }
};
