// QR Code Engine - Handles Dynamic Token Generation & Attendance Verification Scanning

const QREngine = {
    currentToken: null,
    tokenRefreshInterval: null,
    scanTimeout: null,

    // Generate a secure dynamic QR token for class session
    generateDynamicToken: function() {
        const timestamp = new Date().getTime();
        const randomHash = Math.random().toString(36).substring(2, 9);
        this.currentToken = `SMART_CLASS_ROOM304_${timestamp}_${randomHash}`;
        return this.currentToken;
    },

    // Render QR Code inside container
    renderQRCode: function(containerId, studentId = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = ''; // Clear previous

        const token = studentId 
            ? `ATTENDANCE:${studentId}:${this.generateDynamicToken()}` 
            : `ROOM_SESSION:${CLASSROOM_GEOFENCE.name}:${this.generateDynamicToken()}`;

        // Uses QRCodeJS or Google Charts QR API fallback for high reliability
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(token)}&color=00F2FE&bgcolor=0B0F19`;

        const img = document.createElement('img');
        img.src = qrUrl;
        img.alt = "Dynamic Classroom QR Code";
        img.className = "qr-code-img";
        container.appendChild(img);

        // Update token text display
        const tokenLabel = document.getElementById('qrTokenHash');
        if (tokenLabel) {
            tokenLabel.innerText = `Token: ${this.currentToken.slice(-8).toUpperCase()}`;
        }
    },

    // Start auto-refreshing QR code every 30 seconds
    startAutoRefresh: function(containerId) {
        this.renderQRCode(containerId);
        if (this.tokenRefreshInterval) clearInterval(this.tokenRefreshInterval);
        
        this.tokenRefreshInterval = setInterval(() => {
            this.renderQRCode(containerId);
            this.showToast("QR Code refreshed for security 🔒", "info");
        }, 30000);
    },

    // Simulate scanning a student QR code to mark attendance
    simulateScan: function(studentId, onSuccessCallback) {
        const student = AppState.students.find(s => s.id === studentId);
        if (!student) return;

        // Verify if student is already marked present
        if (student.status === "Present" && student.sessionActive) {
            App.showNotification(`${student.name} is already registered & present in class!`, "warning");
            return;
        }

        // Play scanner beep effect (using Web Audio API)
        this.playBeepSound();

        // Mark attendance & start 45-min timer
        student.status = "Present";
        student.sessionActive = true;
        student.sessionTimer = CLASSROOM_GEOFENCE.maxClassDurationMinutes * 60; // 2700s
        student.location.lastPing = new Date().toLocaleTimeString();
        student.location.inZone = true;

        // Start student timer in TimerEngine
        TimerEngine.startStudentTimer(student.id);

        // Fetch live GPS location
        LocationEngine.updateStudentLocation(student.id);

        // Log entry
        App.addActivityLog(`${student.name} (${student.rollNo}) scanned QR & registered for 45-min class session.`);

        App.showNotification(`Attendance Verified! ${student.name} is now registered (45 min session active).`, "success");

        if (onSuccessCallback) onSuccessCallback(student);

        // Re-render UI
        App.renderAll();
    },

    // Simple synthesized beep sound using Web Audio API
    playBeepSound: function() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) {
            console.log("Audio play prevented");
        }
    },

    showToast: function(msg, type) {
        if (typeof App !== 'undefined' && App.showNotification) {
            App.showNotification(msg, type);
        }
    }
};
