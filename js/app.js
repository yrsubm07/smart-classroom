// Main Smart Classroom Application State & UI Renderer

const AppState = {
    students: INITIAL_STUDENTS,
    currentRole: "teacher", // "teacher" or "student"
    selectedStudentId: "STU-101",
    activityLogs: [],
    filterStatus: "all"
};

const App = {
    init: function() {
        this.addActivityLog("System Initialized: Smart AI Classroom Room 304 Ready.");
        
        // Start Master Class Session Timer
        TimerEngine.startGlobalClassSession();

        // Start Auto-Refreshing Side-Corner QR Token
        QREngine.startAutoRefresh('qrCodeContainer');

        // Populate Student Select Dropdowns
        this.populateStudentDropdowns();

        // Initial UI Render
        this.renderAll();

        // Setup Event Listeners
        this.setupEventListeners();
    },

    // Populate student select options
    populateStudentDropdowns: function() {
        const scannerSelect = document.getElementById('scanStudentSelect');
        const breachSelect = document.getElementById('breachStudentSelect');

        if (scannerSelect && breachSelect) {
            scannerSelect.innerHTML = '';
            breachSelect.innerHTML = '';

            AppState.students.forEach(s => {
                const opt1 = document.createElement('option');
                opt1.value = s.id;
                opt1.innerText = `${s.name} (${s.rollNo})`;
                scannerSelect.appendChild(opt1);

                const opt2 = document.createElement('option');
                opt2.value = s.id;
                opt2.innerText = `${s.name} (${s.rollNo})`;
                breachSelect.appendChild(opt2);
            });
        }
    },

    // Render all UI components
    renderAll: function() {
        this.renderStats();
        this.renderSeatingGrid();
        this.renderRadarMap();
        this.renderStudentTable();
        this.renderActivityLogs();
    },

    // Update Top Summary Stats
    renderStats: function() {
        const total = AppState.students.length;
        const presentCount = AppState.students.filter(s => s.status === "Present" && s.location.inZone).length;
        const breachCount = AppState.students.filter(s => !s.location.inZone && s.status === "Present").length;
        const absentCount = total - presentCount - breachCount;
        const rate = Math.round((presentCount / total) * 100);

        document.getElementById('totalStudentsCount').innerText = total;
        document.getElementById('presentCount').innerText = presentCount;
        document.getElementById('absentCount').innerText = absentCount;
        document.getElementById('attendanceRate').innerText = `${rate}%`;
        document.getElementById('breachAlertCount').innerText = breachCount;
    },

    // Render 10 Desk Seating Grid
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
            card.onclick = () => this.selectStudent(student.id);

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

    // Render Interactive Radar Map Pins
    renderRadarMap: function() {
        const container = document.getElementById('radarMapContainer');
        if (!container) return;

        // Keep radar circles, remove old pins
        const existingPins = container.querySelectorAll('.radar-pin');
        existingPins.forEach(p => p.remove());

        AppState.students.forEach((student, index) => {
            if (student.status !== "Present") return;

            const pin = document.createElement('div');
            pin.className = `radar-pin ${student.location.inZone ? '' : 'pin-breach'}`;

            // Calculate pin position relative to center based on simulated offsets
            const latDiff = (student.location.lat - CLASSROOM_GEOFENCE.centerLat) * 120000;
            const lngDiff = (student.location.lng - CLASSROOM_GEOFENCE.centerLng) * 120000;

            const x = 110 + lngDiff;
            const y = 110 - latDiff;

            pin.style.left = `${Math.min(Math.max(x, 15), 205)}px`;
            pin.style.top = `${Math.min(Math.max(y, 15), 205)}px`;
            pin.title = `${student.name}: ${student.location.inZone ? "Inside Classroom" : "OUTSIDE GEOFENCE!"}`;

            pin.onclick = () => this.showNotification(`GPS Ping: ${student.name} (${student.location.lat.toFixed(4)}, ${student.location.lng.toFixed(4)}) - ${student.location.inZone ? "In Zone" : "Out of Zone"}`, student.location.inZone ? "info" : "warning");

            container.appendChild(pin);
        });
    },

    // Render Student Table Roster
    renderStudentTable: function() {
        const tbody = document.getElementById('studentTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        let filtered = AppState.students;
        if (AppState.filterStatus === "present") {
            filtered = AppState.students.filter(s => s.status === "Present" && s.location.inZone);
        } else if (AppState.filterStatus === "breach") {
            filtered = AppState.students.filter(s => s.status === "Present" && !s.location.inZone);
        } else if (AppState.filterStatus === "absent") {
            filtered = AppState.students.filter(s => s.status === "Absent");
        }

        filtered.forEach(s => {
            const tr = document.createElement('tr');
            
            let statusBadge = `<span class="seat-badge absent">Absent</span>`;
            if (s.status === "Present") {
                statusBadge = s.location.inZone 
                    ? `<span class="seat-badge present">Present (In Zone)</span>` 
                    : `<span class="seat-badge warning">Out of Range</span>`;
            }

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
                <td>${s.location.lastPing}</td>
                <td>
                    <button class="btn-glass" style="padding: 4px 10px; font-size: 0.75rem;" onclick="LocationEngine.requestRealGeolocation('${s.id}')">
                        <i class='bx bx-map-pin'></i> Ping GPS
                    </button>
                </td>
            `;

            tbody.appendChild(tr);
        });
    },

    // Add log item
    addActivityLog: function(text) {
        const timestamp = new Date().toLocaleTimeString();
        AppState.activityLogs.unshift(`[${timestamp}] ${text}`);
        if (AppState.activityLogs.length > 20) AppState.activityLogs.pop();
        this.renderActivityLogs();
    },

    // Render activity logs box
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

    // Notification toast popups
    showNotification: function(message, type = "info") {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 4000);
    },

    // Select student to trigger quick actions
    selectStudent: function(id) {
        AppState.selectedStudentId = id;
        const s = AppState.students.find(student => student.id === id);
        if (s) {
            this.showNotification(`Selected ${s.name} (${s.seatNo}). 45-min Session Timer: ${TimerEngine.formatTime(s.sessionTimer)}`, "info");
        }
    },

    // Export Attendance & Location Data as CSV
    exportCSVReport: function() {
        let csvContent = "data:text/csv;charset=utf-8,ID,Name,RollNo,Seat,Status,InGeofence,TimerRemainingSec,LastGPSPing\n";

        AppState.students.forEach(s => {
            csvContent += `${s.id},${s.name},${s.rollNo},${s.seatNo},${s.status},${s.location.inZone},${s.sessionTimer},"${s.location.lastPing}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Classroom_Attendance_Report_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification("Attendance & Location CSV report downloaded successfully!", "success");
    },

    setupEventListeners: function() {
        // Floating QR toggle modal
        const toggleBtn = document.getElementById('qrToggleBtn');
        const modal = document.getElementById('qrWidgetModal');

        if (toggleBtn && modal) {
            toggleBtn.onclick = () => {
                modal.classList.toggle('active');
            };
        }

        // Simulate Scan Form submit
        const scanForm = document.getElementById('simulateScanForm');
        if (scanForm) {
            scanForm.onsubmit = (e) => {
                e.preventDefault();
                const studentId = document.getElementById('scanStudentSelect').value;
                QREngine.simulateScan(studentId);
            };
        }

        // Simulate Geofence Breach Form submit
        const breachForm = document.getElementById('simulateBreachForm');
        if (breachForm) {
            breachForm.onsubmit = (e) => {
                e.preventDefault();
                const studentId = document.getElementById('breachStudentSelect').value;
                LocationEngine.simulateGeofenceBreach(studentId);
            };
        }

        // Filter button listeners
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.onclick = (e) => {
                filterBtns.forEach(b => b.classList.remove('btn-primary'));
                filterBtns.forEach(b => b.classList.add('btn-glass'));

                e.target.classList.remove('btn-glass');
                e.target.classList.add('btn-primary');

                AppState.filterStatus = e.target.getAttribute('data-filter');
                this.renderStudentTable();
            };
        });
    }
};

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
