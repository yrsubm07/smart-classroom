// Geolocation & Location Prediction Engine

const LocationEngine = {
    classroomCenter: CLASSROOM_GEOFENCE,

    calculateDistanceMeters: function(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return Math.round(R * c);
    },

    checkGeofence: function(lat, lng) {
        const dist = this.calculateDistanceMeters(
            lat, lng, 
            this.classroomCenter.centerLat, 
            this.classroomCenter.centerLng
        );
        return {
            inZone: dist <= this.classroomCenter.radiusMeters,
            distanceMeters: dist
        };
    },

    predictLocationZone: function(distanceMeters) {
        if (distanceMeters <= 10) return "Inside Room 304 (Center Desk)";
        if (distanceMeters <= 30) return "Inside Room 304 (Within Boundary)";
        if (distanceMeters <= 60) return "Department Corridor (Near Room 304)";
        if (distanceMeters <= 120) return "Library Building";
        return `Out of Campus (${distanceMeters}m away)`;
    },

    pingRealGPS: function(studentId) {
        if (!navigator.geolocation) {
            App.showNotification("Browser Geolocation not supported on this device.", "error");
            return;
        }

        App.showNotification("📡 Connecting to GPS Satellites...", "info");

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const acc = Math.round(pos.coords.accuracy);

                const check = this.checkGeofence(lat, lng);
                const student = AppState.students.find(s => s.id === studentId);

                if (student) {
                    student.location.lat = lat;
                    student.location.lng = lng;
                    student.location.accuracy = acc;
                    student.location.inZone = check.inZone;
                    student.location.prediction = this.predictLocationZone(check.distanceMeters);
                    student.location.lastPing = new Date().toLocaleTimeString();

                    const msg = `GPS Satellite Fix: ${student.name} is ${check.distanceMeters}m from Room 304 (${student.location.prediction})`;
                    App.showNotification(msg, check.inZone ? "success" : "warning");
                    App.addActivityLog(`📡 GPS PING: ${student.name} (${lat.toFixed(4)}, ${lng.toFixed(4)}) - Zone: ${student.location.prediction}`);

                    App.renderAll();
                }
            },
            (err) => {
                console.warn("Real GPS unavailable, using indoor simulated GPS:", err.message);
                this.updateStudentLocation(studentId);
                App.showNotification("Indoor GPS fallback active for testing.", "info");
            },
            { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
        );
    },

    updateStudentLocation: function(studentId) {
        const student = AppState.students.find(s => s.id === studentId);
        if (!student) return;

        const offsetLat = (Math.random() - 0.5) * 0.00015;
        const offsetLng = (Math.random() - 0.5) * 0.00015;

        student.location.lat = parseFloat((this.classroomCenter.centerLat + offsetLat).toFixed(6));
        student.location.lng = parseFloat((this.classroomCenter.centerLng + offsetLng).toFixed(6));
        student.location.accuracy = (Math.random() * 3 + 2).toFixed(1);
        
        const check = this.checkGeofence(student.location.lat, student.location.lng);
        student.location.inZone = check.inZone;
        student.location.prediction = this.predictLocationZone(check.distanceMeters);
        student.location.lastPing = new Date().toLocaleTimeString();
    },

    triggerBreach: function(studentId) {
        const student = AppState.students.find(s => s.id === studentId);
        if (!student) return;

        if (student.status !== "Present") {
            App.showNotification(`${student.name} is not marked present!`, "warning");
            return;
        }

        student.location.lat = this.classroomCenter.centerLat + 0.0014;
        student.location.lng = this.classroomCenter.centerLng + 0.0014;
        student.location.inZone = false;
        student.location.prediction = "Campus Cafeteria (140m away)";
        student.location.lastPing = new Date().toLocaleTimeString();

        App.addActivityLog(`🚨 GEOFENCE BREACH: ${student.name} (${student.enrollNo}) walked 140m away to Cafeteria!`);
        App.showNotification(`⚠️ GEOFENCE ALERT: ${student.name} left Room 304 area!`, "error");

        QREngine.playBeepSound();
        App.renderAll();
    }
};
