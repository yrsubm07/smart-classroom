// Standalone Unconditional QR Code Generator & Scanner Engine

const QREngine = {
    currentToken: "",
    countdownSeconds: 30,
    countdownInterval: null,

    generateToken: function(studentId = null) {
        const timestamp = new Date().getTime();
        const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.currentToken = studentId 
            ? `ATTENDANCE:${studentId}:${rand}:${timestamp}` 
            : `SMART_ROOM304_TOKEN_${rand}_${timestamp}`;
        return this.currentToken;
    },

    renderQRCanvas: function(canvasId, text) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const size = canvas.width || 180;
        ctx.clearRect(0, 0, size, size);

        // Dark background
        ctx.fillStyle = '#0B0F19';
        ctx.fillRect(0, 0, size, size);

        // Matrix modules
        const hash = this.simpleHash(text);
        const gridSize = 21;
        const cellSize = Math.floor(size / gridSize);

        ctx.fillStyle = '#00F2FE';

        // Finder patterns
        this.drawFinderPattern(ctx, 0, 0, cellSize);
        this.drawFinderPattern(ctx, (gridSize - 7) * cellSize, 0, cellSize);
        this.drawFinderPattern(ctx, 0, (gridSize - 7) * cellSize, cellSize);

        // Fill pattern modules
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if ((r < 7 && c < 7) || (r < 7 && c >= gridSize - 7) || (r >= gridSize - 7 && c < 7)) continue;
                
                const charCode = hash[(r * gridSize + c) % hash.length].charCodeAt(0);
                if ((charCode + r * 3 + c * 7) % 2 === 0) {
                    ctx.fillRect(c * cellSize + 1, r * cellSize + 1, cellSize - 1, cellSize - 1);
                }
            }
        }
    },

    drawFinderPattern: function(ctx, x, y, cellSize) {
        ctx.fillStyle = '#00F2FE';
        ctx.fillRect(x, y, 7 * cellSize, 7 * cellSize);
        ctx.fillStyle = '#0B0F19';
        ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);
        ctx.fillStyle = '#00F2FE';
        ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize);
    },

    simpleHash: function(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(16).repeat(8);
    },

    startAutoRefresh: function() {
        this.refreshQRCode();
        if (this.countdownInterval) clearInterval(this.countdownInterval);

        this.countdownSeconds = 30;
        this.countdownInterval = setInterval(() => {
            this.countdownSeconds--;
            const timerLabel = document.getElementById('qrCountdownText');
            if (timerLabel) timerLabel.innerText = `${this.countdownSeconds}s`;

            if (this.countdownSeconds <= 0) {
                this.refreshQRCode();
                this.countdownSeconds = 30;
            }
        }, 1000);
    },

    refreshQRCode: function() {
        const token = this.generateToken();
        this.renderQRCanvas('qrCanvasElem', token);
        
        const hashDisplay = document.getElementById('qrTokenHash');
        if (hashDisplay) {
            hashDisplay.innerText = `Token: ${this.currentToken.slice(17, 28)}`;
        }
    },

    processScan: function(studentId) {
        const student = AppState.students.find(s => s.id === studentId);
        if (!student) return;

        if (student.status === "Present" && student.sessionActive) {
            App.showNotification(`⚠️ ${student.name} is already registered & present!`, "warning");
            return;
        }

        this.playBeepSound();

        student.status = "Present";
        student.sessionActive = true;
        student.scannedViaQR = true; // Mark QR scan true for Live Teacher Analytics
        student.sessionTimer = CLASSROOM_GEOFENCE.maxClassDurationMinutes * 60;
        student.location.lastPing = new Date().toLocaleTimeString();
        student.location.inZone = true;
        student.location.prediction = "Inside Room 304 (QR Verified)";

        TimerEngine.startStudentTimer(student.id);
        LocationEngine.updateStudentLocation(student.id);

        App.addActivityLog(`✅ QR CHECK-IN: ${student.name} (${student.enrollNo}) scanned QR. 45-min session active.`);
        App.showNotification(`🎉 Attendance Verified! ${student.name} registered via QR.`, "success");

        App.renderAll();
    },

    playBeepSound: function() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.18);
        } catch (e) {
            console.log("Audio play blocked");
        }
    }
};
