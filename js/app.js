// Full-Featured Smart Classroom UI Orchestrator & Controller

const AppState = {
    students: INITIAL_STUDENTS,
    currentRole: "teacher", // "teacher" | "student"
    selectedStudentId: "STU-101",
    activityLogs: [],
    filterStatus: "all",
    searchQuery: ""
};

const App = {
    init: function() {
        this.addActivityLog("🚀 Smart AI Classroom Room 304 Initialized.");
        
        // Start Timers & QR Generator
        TimerEngine.startMasterTimer();
        QREngine.startAutoRefresh();

        // Populate Select Controls
        this.populateDropdowns();

        // Initial UI Render
        this.renderAll();

        // Bind Controls & Event Listeners
        this.bindEvents();
    },

    populateDropdowns: function() {
        const scanSelect = document.getElementById('scanStudentSelect');
        const breachSelect = document.getElementById('breachStudentSelect');
        const studentPortalSelect = document.getElementById('studentPortalSelect');

        if (scanSelect && breachSelect) {
            scanSelect.innerHTML = '';
            breachSelect.innerHTML = '';

            if (studentPortalSelect) studentPortalSelect.innerHTML = '';

            AppState.students.forEach(s => {
                const opt1 = document.createElement('option');
                opt1.value = s.id;
                opt1.innerText = `${s.name} (${s.rollNo})`;
                scanSelect.appendChild(opt1);

                const opt2 = document.createElement('option');
                opt2.value = s.id;
                opt2.innerText = `${s.name} (${s.rollNo})`;
                breachSelect.appendChild(opt2);

                if (studentPortalSelect) {
                    const opt3 = document.createElement('option');
                    opt3.value = s.id;
                    opt3.innerText = `${s.name} (${s.seatNo})`;
                    studentPortalSelect.appendChild(opt3);
                }
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
        this.renderAttendanceGraph();
    },

    // Metrics summary stats
    renderStats: function() {
        const total = AppState.students.length;
        const presentCount = AppState.students.filter(s => s.status === "Present" && s.location.inZone).length;
        const breachCount = AppState.students.filter(s => s.status === "Present" && !s.location.inZone).length;
        const absentCount = total - presentCount - breachCount;
        const rate = Math.round(((presentCount + breachCount) / total) * 100);

        document.getElementById('totalStudentsCount').innerText = total;
        document.getElementById('presentCount').innerText = presentCount;
        document.getElementById('absentCount').innerText = absentCount;
        document.getElementById('attendanceRate').innerText = `${rate}%`;
        document.getElementById('breachAlertCount').innerText = breachCount;
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
                <div class="student-roll">${student.seatNo} • ${student.rollNo}</div>
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

            // Scale offsets for radar
            const latDiff = (student.location.lat - CLASSROOM_GEOFENCE.centerLat) * 140000;
            const lngDiff = (student.location.lng - CLASSROOM_GEOFENCE.centerLng) * 140000;

            const x = 110 + lngDiff;
            const y = 110 - latDiff;

            pin.style.left = `${Math.min(Math.max(x, 15), 205)}px`;
            pin.style.top = `${Math.min(Math.max(y, 15), 205)}px`;
            pin.title = `${student.name}: ${student.location.inZone ? "Inside Room 304" : "BREACH ALERT!"}`;

            pin.onclick = () => this.showNotification(`GPS Fix: ${student.name} is ${LocationEngine.checkGeofence(student.location.lat, student.location.lng).distanceMeters}m away`, student.location.inZone ? "info" : "warning");

            container.appendChild(pin);
        });
    },

    // Student Roster Table with Search & Filter
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
            filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q) || s.seatNo.toLowerCase().includes(q));
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
                            <small class="student-roll">${s.rollNo}</small>
                        </div>
                    </div>
                </td>
                <td>${s.seatNo}</td>
                <td>${statusBadge}</td>
                <td><strong>${s.sessionActive ? TimerEngine.formatTime(s.sessionTimer) : "Inactive"}</strong></td>
                <td><small>${dist}m • ${s.location.lastPing}</small></td>
                <td>
                    <button class="btn-primary" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 6px;" onclick="QREngine.processScan('${s.id}')">
                        <i class='bx bx-qr-scan'></i> Scan
                    </button>
                    <button class="btn-glass" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 6px;" onclick="LocationEngine.pingRealGPS('${s.id}')">
                        <i class='bx bx-map-pin'></i> GPS
                    </button>
                </td>
            `;

            tbody.appendChild(tr);
        });
    },

    // Render Student Self-Portal View
    renderStudentPortal: function() {
        const student = AppState.students.find(s => s.id === AppState.selectedStudentId);
        if (!student) return;

        const nameElem = document.getElementById('portalStudentName');
        const rollElem = document.getElementById('portalStudentRoll');
        const avatarElem = document.getElementById('portalStudentAvatar');
        const timerElem = document.getElementById('studentPortalTimer');
        const distElem = document.getElementById('portalDistanceText');
        const statusBadgeElem = document.getElementById('portalStatusBadge');

        if (nameElem) nameElem.innerText = student.name;
        if (rollElem) rollElem.innerText = `${student.rollNo} • ${student.seatNo}`;
        if (avatarElem) avatarElem.src = student.avatar;
        if (timerElem) timerElem.innerText = student.sessionActive ? TimerEngine.formatTime(student.sessionTimer) : "00:00";

        const dist = LocationEngine.checkGeofence(student.location.lat, student.location.lng).distanceMeters;
        if (distElem) distElem.innerText = `${dist} Meters`;

        if (statusBadgeElem) {
            if (student.status === "Present") {
                statusBadgeElem.className = student.location.inZone ? "seat-badge present" : "seat-badge warning";
                statusBadgeElem.innerText = student.location.inZone ? "45-MIN SESSION ACTIVE" : "GEOFENCE BREACH ALERT";
            } else {
                statusBadgeElem.className = "seat-badge absent";
                statusBadgeElem.innerText = "NOT CHECKED IN";
            }
        }
    },

    // Render CSS 7-Day Attendance Trend Bar Graph
    renderAttendanceGraph: function() {
        const graphContainer = document.getElementById('weeklyTrendGraph');
        if (!graphContainer) return;

        const mockData = [
            { day: "Mon", rate: 90 },
            { day: "Tue", rate: 95 },
            { day: "Wed", rate: 85 },
            { day: "Thu", rate: 100 },
            { day: "Fri", rate: 90 },
            { day: "Sat", rate: 70 },
            { day: "Today", rate: Math.round((AppState.students.filter(s=>s.status==="Present").length / 10) * 100) }
        ];

        graphContainer.innerHTML = '';
        mockData.forEach(d => {
            const barWrap = document.createElement('div');
            barWrap.style.cssText = "display:flex; flex-direction:column; align-items:center; flex:1; height:100%; justify-content:flex-end;";
            
            barWrap.innerHTML = `
                <span style="font-size:0.7rem; color:var(--primary-cyan); font-weight:700; margin-bottom:4px;">${d.rate}%</span>
                <div style="width:100%; height:${d.rate}%; background:var(--accent-glow); border-radius:6px 6px 0 0; transition:height 0.5s;"></div>
                <span style="font-size:0.72rem; color:var(--text-secondary); margin-top:6px;">${d.day}</span>
            `;
            graphContainer.appendChild(barWrap);
        });
    },

    // Desk Manual Action Modal
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
                <strong>Roll No:</strong> ${student.rollNo}<br>
                <strong>Status:</strong> ${student.status}<br>
                <strong>45-Min Session Timer:</strong> ${student.sessionActive ? TimerEngine.formatTime(student.sessionTimer) : "Inactive"}<br>
                <strong>GPS Distance to Room 304:</strong> ${LocationEngine.checkGeofence(student.location.lat, student.location.lng).distanceMeters}m
            `;
            modal.style.display = 'flex';
        }

        this.renderStudentPortal();
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
        let csv = "data:text/csv;charset=utf-8,ID,Name,RollNo,SeatNo,Status,SessionTimerSec,DistanceMeters,InGeofence,LastPingTimestamp\n";

        AppState.students.forEach(s => {
            const dist = LocationEngine.checkGeofence(s.location.lat, s.location.lng).distanceMeters;
            csv += `${s.id},"${s.name}",${s.rollNo},${s.seatNo},${s.status},${s.sessionTimer},${dist},${s.location.inZone},"${s.location.lastPing}"\n`;
        });

        const uri = encodeURI(csv);
        const link = document.createElement("a");
        link.setAttribute("href", uri);
        link.setAttribute("download", `Classroom_Attendance_Report_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification("📥 CSV Attendance & GPS Report Downloaded!", "success");
    },

    bindEvents: function() {
        // Floating QR toggle
        const toggleBtn = document.getElementById('qrToggleBtn');
        const qrModal = document.getElementById('qrWidgetModal');
        if (toggleBtn && qrModal) {
            toggleBtn.onclick = () => qrModal.classList.toggle('active');
        }

        // Quick Refresh QR button
        const refreshQrBtn = document.getElementById('refreshQrBtn');
        if (refreshQrBtn) {
            refreshQrBtn.onclick = () => {
                QREngine.refreshQRCode();
                App.showNotification("QR Token refreshed manually!", "info");
            };
        }

        // Teacher / Student Role Toggle
        const roleToggleBtn = document.getElementById('roleToggleBtn');
        if (roleToggleBtn) {
            roleToggleBtn.onclick = () => {
                if (AppState.currentRole === "teacher") {
                    AppState.currentRole = "student";
                    document.getElementById('teacherDashboard').style.display = 'none';
                    document.getElementById('studentPortalSection').style.display = 'block';
                    roleToggleBtn.innerText = "Switch to Teacher Mode";
                } else {
                    AppState.currentRole = "teacher";
                    document.getElementById('teacherDashboard').style.display = 'grid';
                    document.getElementById('studentPortalSection').style.display = 'none';
                    roleToggleBtn.innerText = "Switch to Student View";
                }
                this.showNotification(`Switched to ${AppState.currentRole.toUpperCase()} View`, "info");
            };
        }

        // Student Portal Selector
        const portalSelect = document.getElementById('studentPortalSelect');
        if (portalSelect) {
            portalSelect.onchange = (e) => {
                AppState.selectedStudentId = e.target.value;
                this.renderStudentPortal();
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
