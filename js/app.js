// Master Application Controller & UI Orchestrator

const AppState = {
    students: INITIAL_STUDENTS,
    filterStatus: "all",
    searchQuery: "",
    selectedStudentId: "STU-101"
};

const App = {
    init: function() {
        AuthEngine.init();
        
        // Initialize Timers & QR Auto-Refresh
        TimerEngine.startMasterTimer();
        QREngine.startAutoRefresh();

        // Populate dropdowns
        this.populateDropdowns();

        // Check authentication state
        if (AuthEngine.currentUser) {
            this.showMainApp();
        } else {
            this.showLoginScreen();
        }

        // Bind events defensively
        this.bindEvents();
    },

    showLoginScreen: function() {
        const loginView = document.getElementById('loginGatewayView');
        const mainApp = document.getElementById('mainAppContainer');
        const navActions = document.getElementById('userNavbarActions');

        if (loginView) loginView.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
        if (navActions) navActions.style.display = 'none';
    },

    showMainApp: function() {
        const loginView = document.getElementById('loginGatewayView');
        const mainApp = document.getElementById('mainAppContainer');
        const navActions = document.getElementById('userNavbarActions');

        if (loginView) loginView.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';
        if (navActions) navActions.style.display = 'flex';

        const user = AuthEngine.currentUser;
        const navBadgeText = document.getElementById('kebabNavUserText');
        if (user && navBadgeText) {
            navBadgeText.innerText = `${user.name} (${user.role.toUpperCase()})`;
        }

        const teacherDash = document.getElementById('teacherDashboardView');
        const studentPortal = document.getElementById('studentPortalView');

        if (user && user.role === "teacher") {
            if (teacherDash) teacherDash.style.display = 'grid';
            if (studentPortal) studentPortal.style.display = 'none';
        } else {
            if (teacherDash) teacherDash.style.display = 'none';
            if (studentPortal) studentPortal.style.display = 'block';
            if (user) AppState.selectedStudentId = user.id;
        }

        this.renderAll();
    },

    populateDropdowns: function() {
        const scanSelect = document.getElementById('scanStudentSelect');
        const breachSelect = document.getElementById('breachStudentSelect');

        if (scanSelect && breachSelect) {
            scanSelect.innerHTML = '';
            breachSelect.innerHTML = '';

            AppState.students.forEach(s => {
                const opt1 = document.createElement('option');
                opt1.value = s.id;
                opt1.innerText = `${s.name} (${s.enrollNo})`;
                scanSelect.appendChild(opt1);

                const opt2 = document.createElement('option');
                opt2.value = s.id;
                opt2.innerText = `${s.name} (${s.enrollNo})`;
                breachSelect.appendChild(opt2);
            });
        }
    },

    renderAll: function() {
        this.renderStats();
        this.renderSeatingGrid();
        this.renderRadarMap();
        this.renderStudentTable();
        this.renderActivityLogs();
        this.renderStudentPortal();
        this.renderTeacherProfile();
        this.renderScheduleTable();
        this.renderLeaderboard();
        this.renderQRAnalyticsBadge();
        ChatEngine.renderMessages();
    },

    // Metrics summary stats
    renderStats: function() {
        const total = AppState.students.length;
        const presentCount = AppState.students.filter(s => s.status === "Present" && s.location.inZone).length;
        const breachCount = AppState.students.filter(s => s.status === "Present" && !s.location.inZone).length;
        const absentCount = total - presentCount - breachCount;
        const rate = Math.round(((presentCount + breachCount) / (total || 1)) * 100);

        const totalElem = document.getElementById('totalStudentsCount');
        const presentElem = document.getElementById('presentCount');
        const absentElem = document.getElementById('absentCount');
        const rateElem = document.getElementById('attendanceRate');
        const breachElem = document.getElementById('breachAlertCount');

        if (totalElem) totalElem.innerText = total;
        if (presentElem) presentElem.innerText = presentCount;
        if (absentElem) absentElem.innerText = absentCount;
        if (rateElem) rateElem.innerText = `${rate}%`;
        if (breachElem) breachElem.innerText = breachCount;
    },

    // Teacher QR Scan Real-Time Analytics Badge
    renderQRAnalyticsBadge: function() {
        const qrScannedCount = AppState.students.filter(s => s.scannedViaQR).length;
        const total = AppState.students.length;

        const badgeElem = document.getElementById('qrScanAnalyticsText');
        if (badgeElem) {
            badgeElem.innerText = `Registered via QR: ${qrScannedCount} / ${total} Students`;
        }
    },

    // 10 Desk Seating Chart
    renderSeatingGrid: function() {
        const container = document.getElementById('seatingGridContainer');
        if (!container) return;

        container.innerHTML = '';

        AppState.students.forEach(student => {
            const card = document.createElement('div');
            
            let statusClass = "status-absent";
            let badgeText = "ABSENT";
            let badgeClass = "absent";

            if (student.status === "Present") {
                if (student.location.inZone) {
                    statusClass = "status-present";
                    badgeText = "IN CLASS";
                    badgeClass = "present";
                } else {
                    statusClass = "status-out-of-zone";
                    badgeText = "OUT OF RANGE!";
                    badgeClass = "warning";
                }
            }

            card.className = `seat-card ${statusClass}`;
            card.onclick = () => this.openDeskModal(student.id);

            card.innerHTML = `
                <span class="seat-badge ${badgeClass}">${badgeText}</span>
                <img src="${student.avatar}" alt="${student.name}" class="seat-avatar" />
                <div class="student-name">${student.name}</div>
                <div class="student-roll">${student.seatNo} • ${student.enrollNo}</div>
                <div class="timer-pill" id="timer-${student.id}">
                    ${student.sessionActive ? TimerEngine.formatTime(student.sessionTimer) : "00:00"}
                </div>
            `;

            container.appendChild(card);
        });
    },

    // Radar Map Pins
    renderRadarMap: function() {
        const container = document.getElementById('radarMapContainer');
        if (!container) return;

        const existingPins = container.querySelectorAll('.radar-pin');
        existingPins.forEach(p => p.remove());

        AppState.students.forEach((student) => {
            if (student.status !== "Present") return;

            const pin = document.createElement('div');
            pin.className = `radar-pin ${student.location.inZone ? '' : 'pin-breach'}`;

            const latDiff = (student.location.lat - CLASSROOM_GEOFENCE.centerLat) * 140000;
            const lngDiff = (student.location.lng - CLASSROOM_GEOFENCE.centerLng) * 140000;

            const x = 110 + lngDiff;
            const y = 110 - latDiff;

            pin.style.left = `${Math.min(Math.max(x, 15), 205)}px`;
            pin.style.top = `${Math.min(Math.max(y, 15), 205)}px`;
            pin.title = `${student.name}: ${student.location.prediction}`;

            pin.onclick = () => this.showNotification(`GPS Fix: ${student.name} - ${student.location.prediction}`, student.location.inZone ? "info" : "warning");

            container.appendChild(pin);
        });
    },

    // Student Roster Directory Table with Remove Student Action
    renderStudentTable: function() {
        const tbody = document.getElementById('studentTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        let filtered = AppState.students;

        if (AppState.filterStatus === "present") {
            filtered = filtered.filter(s => s.status === "Present" && s.location.inZone);
        } else if (AppState.filterStatus === "breach") {
            filtered = filtered.filter(s => s.status === "Present" && !s.location.inZone);
        } else if (AppState.filterStatus === "absent") {
            filtered = filtered.filter(s => s.status === "Absent");
        }

        if (AppState.searchQuery) {
            const q = AppState.searchQuery.toLowerCase();
            filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.enrollNo.toLowerCase().includes(q) || s.seatNo.toLowerCase().includes(q));
        }

        filtered.forEach(s => {
            const tr = document.createElement('tr');
            
            let statusBadge = `<span class="seat-badge absent">Absent</span>`;
            if (s.status === "Present") {
                statusBadge = s.location.inZone 
                    ? `<span class="seat-badge present">Present (In Zone)</span>` 
                    : `<span class="seat-badge warning">Out of Range</span>`;
            }

            const dist = LocationEngine.checkGeofence(s.location.lat, s.location.lng).distanceMeters;

            tr.innerHTML = `
                <td>
                    <div class="user-cell">
                        <img src="${s.avatar}" alt="${s.name}">
                        <div>
                            <strong>${s.name}</strong><br>
                            <small class="student-roll">${s.enrollNo}</small>
                        </div>
                    </div>
                </td>
                <td>${s.seatNo}</td>
                <td>${statusBadge}</td>
                <td><strong>${s.sessionActive ? TimerEngine.formatTime(s.sessionTimer) : "Inactive"}</strong></td>
                <td>
                    <div style="font-size: 0.8rem; font-weight: 600;">${s.location.prediction}</div>
                    <small style="color: var(--text-muted);">${dist}m • ${s.location.lastPing}</small>
                </td>
                <td>
                    <button class="btn-primary" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 6px;" onclick="QREngine.processScan('${s.id}')">
                        <i class='bx bx-qr-scan'></i> Check-In
                    </button>
                    <button class="btn-glass" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 6px;" onclick="LocationEngine.pingRealGPS('${s.id}')">
                        <i class='bx bx-map-pin'></i> GPS
                    </button>
                    <button class="btn-delete" onclick="App.removeStudent('${s.id}')" title="Remove Student">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            `;

            tbody.appendChild(tr);
        });
    },

    // DYNAMICALLY ADD NEW STUDENT TO ROSTER
    addNewStudent: function(name, enrollNo, seatNo) {
        if (!name || !enrollNo) {
            this.showNotification("Please enter student name and enrollment number!", "error");
            return;
        }

        const newId = `STU-${100 + AppState.students.length + 1}`;
        const newStudent = {
            id: newId,
            enrollNo: enrollNo.toUpperCase(),
            password: "password123",
            name: name,
            seatNo: seatNo || `Desk ${Math.ceil((AppState.students.length + 1)/2)}${(AppState.students.length % 2 === 0) ? 'A':'B'}`,
            xpPoints: 200,
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
            status: "Absent",
            sessionTimer: 2700,
            sessionActive: false,
            scannedViaQR: false,
            location: { lat: 28.6139, lng: 77.2090, inZone: true, prediction: "Inside Room 304", accuracy: 3.0, lastPing: "Just Now" }
        };

        AppState.students.push(newStudent);
        this.populateDropdowns();
        this.renderAll();

        this.showNotification(`Added new student: ${name} (${enrollNo})`, "success");
        this.addActivityLog(`➕ DYNAMIC ADD: New student ${name} (${enrollNo}) added to Room 304 roster.`);

        this.closeAddStudentModal();
    },

    // REMOVE STUDENT FROM ROSTER
    removeStudent: function(id) {
        const student = AppState.students.find(s => s.id === id);
        if (!student) return;

        if (confirm(`Are you sure you want to remove ${student.name} (${student.enrollNo}) from Room 304?`)) {
            AppState.students = AppState.students.filter(s => s.id !== id);
            this.populateDropdowns();
            this.renderAll();

            this.showNotification(`Removed ${student.name} from roster.`, "info");
            this.addActivityLog(`➖ REMOVED: Student ${student.name} (${student.enrollNo}) deleted from Room 304.`);
        }
    },

    openAddStudentModal: function() {
        const modal = document.getElementById('addStudentModal');
        if (modal) modal.style.display = 'flex';
    },

    closeAddStudentModal: function() {
        const modal = document.getElementById('addStudentModal');
        if (modal) modal.style.display = 'none';
    },

    // Class Leaderboard (XP Rankings)
    renderLeaderboard: function() {
        const tbody = document.getElementById('leaderboardTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        const sorted = [...AppState.students].sort((a, b) => b.xpPoints - a.xpPoints);

        sorted.forEach((s, rank) => {
            const tr = document.createElement('tr');
            let medal = `#${rank + 1}`;
            if (rank === 0) medal = '🥇 #1';
            if (rank === 1) medal = '🥈 #2';
            if (rank === 2) medal = '🥉 #3';

            tr.innerHTML = `
                <td><strong style="color: var(--warning-amber);">${medal}</strong></td>
                <td>
                    <div class="user-cell">
                        <img src="${s.avatar}" alt="${s.name}">
                        <strong>${s.name}</strong>
                    </div>
                </td>
                <td>${s.enrollNo}</td>
                <td><strong style="color: var(--primary-cyan);">${s.xpPoints} XP</strong></td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderTeacherProfile: function() {
        const nameElem = document.getElementById('teacherInfoName');
        const desigElem = document.getElementById('teacherInfoDesig');
        const subjElem = document.getElementById('teacherInfoSubj');
        const roomElem = document.getElementById('teacherInfoRoom');

        if (nameElem) nameElem.innerText = TEACHER_PROFILE.name;
        if (desigElem) desigElem.innerText = TEACHER_PROFILE.designation;
        if (subjElem) subjElem.innerText = TEACHER_PROFILE.subject;
        if (roomElem) roomElem.innerText = `${TEACHER_PROFILE.roomNo} • Hours: ${TEACHER_PROFILE.officeHours}`;
    },

    renderScheduleTable: function() {
        const tbody = document.getElementById('scheduleTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        CLASS_SCHEDULE.forEach(item => {
            const tr = document.createElement('tr');
            let badgeClass = item.status.includes('Active') ? 'present' : (item.status === 'Completed' ? 'absent' : 'warning');
            
            tr.innerHTML = `
                <td><strong>${item.time}</strong></td>
                <td>${item.subject}</td>
                <td>${item.room}</td>
                <td>${item.instructor}</td>
                <td><span class="seat-badge ${badgeClass}">${item.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderStudentPortal: function() {
        const currentStudentId = (AuthEngine.currentUser && AuthEngine.currentUser.role === 'student') 
            ? AuthEngine.currentUser.id 
            : AppState.selectedStudentId;

        const student = AppState.students.find(s => s.id === currentStudentId);
        if (!student) return;

        const nameElem = document.getElementById('portalStudentName');
        const enrollElem = document.getElementById('portalStudentEnroll');
        const avatarElem = document.getElementById('portalStudentAvatar');
        const timerElem = document.getElementById('studentPortalTimer');
        const distElem = document.getElementById('portalDistanceText');
        const predElem = document.getElementById('portalPredictionText');
        const statusBadgeElem = document.getElementById('portalStatusBadge');

        if (nameElem) nameElem.innerText = student.name;
        if (enrollElem) enrollElem.innerText = `${student.enrollNo} • ${student.seatNo}`;
        if (avatarElem) avatarElem.src = student.avatar;
        if (timerElem) timerElem.innerText = student.sessionActive ? TimerEngine.formatTime(student.sessionTimer) : "00:00";

        const dist = LocationEngine.checkGeofence(student.location.lat, student.location.lng).distanceMeters;
        if (distElem) distElem.innerText = `${dist} Meters`;
        if (predElem) predElem.innerText = student.location.prediction;

        if (statusBadgeElem) {
            if (student.status === "Present") {
                statusBadgeElem.className = student.location.inZone ? "seat-badge present" : "seat-badge warning";
                statusBadgeElem.innerText = student.location.inZone ? "45-MIN SESSION ACTIVE" : "GEOFENCE BREACH ALERT";
            } else {
                statusBadgeElem.className = "seat-badge absent";
                statusBadgeElem.innerText = "NOT CHECKED IN YET";
            }
        }
    },

    // TEACHER ANNOY CONTROLS
    triggerPopQuizAttack: function() {
        QREngine.playBeepSound();
        this.showNotification("⚡ POP QUIZ ATTACK! Triggering 10-second sudden quiz alert on student screens...", "warning");
        this.addActivityLog("⚡ TEACHER ACTION: Initiated sudden Pop Quiz Attack on Room 304.");
        alert("🚨 TEACHER POP QUIZ ATTACK! All students must answer Q1 within 10 seconds!");
    },

    triggerDeskVibration: function() {
        QREngine.playBeepSound();
        this.showNotification("📳 WAKE-UP SHAKE ALERT: Shaking sleeping students' desk screens!", "error");
        this.addActivityLog("📳 TEACHER ACTION: Triggered WAKE-UP Desk Vibration Shake Alert.");
        
        document.body.style.animation = "shake 0.5s ease";
        setTimeout(() => document.body.style.animation = "", 500);
    },

    triggerDiscoParty: function() {
        this.showNotification("🎉 NEON DISCO BREAK: Flashing celebration lights in Room 304!", "info");
        this.addActivityLog("🎉 TEACHER ACTION: Started 5-second Classroom Disco Party Break.");

        let count = 0;
        const interval = setInterval(() => {
            document.body.style.background = count % 2 === 0 ? "#1e0b36" : "#070a13";
            count++;
            if (count > 6) {
                clearInterval(interval);
                document.body.style.background = "#070a13";
            }
        }, 300);
    },

    openDeskModal: function(studentId) {
        AppState.selectedStudentId = studentId;
        const student = AppState.students.find(s => s.id === studentId);
        if (!student) return;

        const modal = document.getElementById('deskModal');
        const title = document.getElementById('deskModalTitle');
        const info = document.getElementById('deskModalInfo');

        if (modal && title && info) {
            title.innerText = `${student.seatNo} - ${student.name}`;
            info.innerHTML = `
                <strong>Enrollment No:</strong> ${student.enrollNo}<br>
                <strong>Attendance Status:</strong> ${student.status}<br>
                <strong>45-Min Class Timer:</strong> ${student.sessionActive ? TimerEngine.formatTime(student.sessionTimer) : "Inactive"}<br>
                <strong>Predicted Zone:</strong> ${student.location.prediction}<br>
                <strong>Distance to Room 304:</strong> ${LocationEngine.checkGeofence(student.location.lat, student.location.lng).distanceMeters}m
            `;
            modal.style.display = 'flex';
        }
    },

    closeDeskModal: function() {
        const modal = document.getElementById('deskModal');
        if (modal) modal.style.display = 'none';
    },

    addActivityLog: function(msg) {
        const time = new Date().toLocaleTimeString();
        AppState.activityLogs.unshift(`[${time}] ${msg}`);
        if (AppState.activityLogs.length > 25) AppState.activityLogs.pop();
        this.renderActivityLogs();
    },

    renderActivityLogs: function() {
        const container = document.getElementById('activityLogsContainer');
        if (!container) return;

        container.innerHTML = '';
        AppState.activityLogs.forEach(log => {
            const div = document.createElement('div');
            div.className = 'log-item';
            div.innerText = log;
            container.appendChild(div);
        });
    },

    showNotification: function(msg, type = "info") {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = msg;

        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    },

    exportCSVReport: function() {
        let csv = "data:text/csv;charset=utf-8,ID,Name,EnrollNo,SeatNo,Status,TimerSec,DistanceMeters,PredictedZone,XPPoints,LastPingTimestamp\n";

        AppState.students.forEach(s => {
            const dist = LocationEngine.checkGeofence(s.location.lat, s.location.lng).distanceMeters;
            csv += `${s.id},"${s.name}",${s.enrollNo},${s.seatNo},${s.status},${s.sessionTimer},${dist},"${s.location.prediction}",${s.xpPoints},"${s.location.lastPing}"\n`;
        });

        const uri = encodeURI(csv);
        const link = document.createElement("a");
        link.setAttribute("href", uri);
        link.setAttribute("download", `Classroom_Attendance_Report_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification("📥 CSV Report Downloaded Successfully!", "success");
    },

    bindEvents: function() {
        // KEBAB 3-DOT MENU TOGGLE
        const kebabBtn = document.getElementById('kebabMenuBtn');
        const kebabDropdown = document.getElementById('kebabDropdownMenu');

        if (kebabBtn && kebabDropdown) {
            kebabBtn.onclick = (e) => {
                e.stopPropagation();
                kebabDropdown.classList.toggle('active');
            };

            document.addEventListener('click', (e) => {
                if (!kebabDropdown.contains(e.target) && e.target !== kebabBtn) {
                    kebabDropdown.classList.remove('active');
                }
            });
        }

        // Add Student Form submit
        const addStudentForm = document.getElementById('addStudentForm');
        if (addStudentForm) {
            addStudentForm.onsubmit = (e) => {
                e.preventDefault();
                const name = document.getElementById('newStudentName').value;
                const enroll = document.getElementById('newStudentEnroll').value;
                const seat = document.getElementById('newStudentSeat').value;
                this.addNewStudent(name, enroll, seat);
            };
        }

        // Login Gateway Tab switching
        const teacherTab = document.getElementById('teacherTabBtn');
        const studentTab = document.getElementById('studentTabBtn');
        const teacherForm = document.getElementById('teacherLoginForm');
        const studentForm = document.getElementById('studentLoginForm');

        if (teacherTab && studentTab && teacherForm && studentForm) {
            teacherTab.onclick = () => {
                teacherTab.classList.add('active');
                studentTab.classList.remove('active');
                teacherForm.style.display = 'block';
                studentForm.style.display = 'none';
            };

            studentTab.onclick = () => {
                studentTab.classList.add('active');
                teacherTab.classList.remove('active');
                studentForm.style.display = 'block';
                teacherForm.style.display = 'none';
            };
        }

        // Login form submit
        if (teacherForm) {
            teacherForm.onsubmit = (e) => {
                e.preventDefault();
                const id = document.getElementById('teacherIdInput').value;
                const pass = document.getElementById('teacherPassInput').value;
                if (AuthEngine.loginTeacher(id, pass)) {
                    this.showMainApp();
                }
            };
        }

        if (studentForm) {
            studentForm.onsubmit = (e) => {
                e.preventDefault();
                const enroll = document.getElementById('studentEnrollInput').value;
                const pass = document.getElementById('studentPassInput').value;
                if (AuthEngine.loginStudent(enroll, pass)) {
                    this.showMainApp();
                }
            };
        }

        // Logout
        const logoutBtn = document.getElementById('kebabLogoutBtn');
        if (logoutBtn) {
            logoutBtn.onclick = () => {
                if (kebabDropdown) kebabDropdown.classList.remove('active');
                AuthEngine.logout();
            };
        }

        // Floating QR toggle
        const toggleBtn = document.getElementById('qrToggleBtn');
        const qrModal = document.getElementById('qrWidgetModal');
        if (toggleBtn && qrModal) {
            toggleBtn.onclick = () => {
                qrModal.classList.toggle('active');
                QREngine.refreshQRCode();
            };
        }

        // Refresh QR
        const refreshQrBtn = document.getElementById('refreshQrBtn');
        if (refreshQrBtn) {
            refreshQrBtn.onclick = () => {
                QREngine.refreshQRCode();
                App.showNotification("QR Token refreshed!", "info");
            };
        }

        // Class Bell Alarm Trigger Button
        const alarmBtn = document.getElementById('kebabAlarmBtn');
        if (alarmBtn) {
            alarmBtn.onclick = () => {
                if (kebabDropdown) kebabDropdown.classList.remove('active');
                TimerEngine.triggerClassBellAlarm();
            };
        }

        // Group Chat Submit Forms
        const chatFormStudent = document.getElementById('groupChatFormStudent');
        if (chatFormStudent) {
            chatFormStudent.onsubmit = (e) => {
                e.preventDefault();
                const input = document.getElementById('chatTextInputStudent');
                if (input && input.value) {
                    ChatEngine.sendMessage(input.value);
                    input.value = '';
                }
            };
        }

        const chatFormTeacher = document.getElementById('groupChatFormTeacher');
        if (chatFormTeacher) {
            chatFormTeacher.onsubmit = (e) => {
                e.preventDefault();
                const input = document.getElementById('chatTextInputTeacher');
                if (input && input.value) {
                    ChatEngine.sendMessage(input.value);
                    input.value = '';
                }
            };
        }

        // Search Input
        const searchInput = document.getElementById('studentSearchInput');
        if (searchInput) {
            searchInput.oninput = (e) => {
                AppState.searchQuery = e.target.value;
                this.renderStudentTable();
            };
        }

        // Filter Buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.onclick = (e) => {
                filterBtns.forEach(b => {
                    b.classList.remove('btn-primary');
                    b.classList.add('btn-glass');
                });
                e.target.classList.remove('btn-glass');
                e.target.classList.add('btn-primary');

                AppState.filterStatus = e.target.getAttribute('data-filter');
                this.renderStudentTable();
            };
        });

        // Sim Forms
        const scanForm = document.getElementById('simulateScanForm');
        if (scanForm) {
            scanForm.onsubmit = (e) => {
                e.preventDefault();
                const id = document.getElementById('scanStudentSelect').value;
                QREngine.processScan(id);
            };
        }

        const breachForm = document.getElementById('simulateBreachForm');
        if (breachForm) {
            breachForm.onsubmit = (e) => {
                e.preventDefault();
                const id = document.getElementById('breachStudentSelect').value;
                LocationEngine.triggerBreach(id);
            };
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
