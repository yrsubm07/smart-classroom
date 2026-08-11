// Advanced Geolocation & Geofencing Engine

const LocationEngine = {
    classroomCenter: CLASSROOM_GEOFENCE,

    // Calculate distance in meters using Haversine formula
    calculateDistanceMeters: function(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
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

    // Verify geofence compliance
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

    // Trigger Real Browser Geolocation to update student's location
    pingRealGPS: function(studentId) {
        if (!navigator.geolocation) {
            App.showNotification("Browser Geolocation not supported on this device.", "error");
            return;
        }

        App.showNotification("📡 Fetching live GPS satellites...", "info");

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
                    student.location.lastPing = new Date().toLocaleTimeString();

                    const msg = `GPS Satellite Fix: ${student.name} is ${check.distanceMeters}m from Room 304 (${check.inZone ? "Inside Classroom Zone" : "OUT OF BOUNDS!"})`;
                    App.showNotification(msg, check.inZone ? "success" : "warning");
                    App.addActivityLog(`📡 GPS PING: ${student.name} (${lat.toFixed(4)}, ${lng.toFixed(4)}) - Distance: ${check.distanceMeters}m`);

                    App.renderAll();
                }
            },
            (err) => {
                console.warn("Real GPS unavailable, switching to simulated indoor GPS:", err.message);
                this.updateStudentLocation(studentId);
                App.showNotification("Indoor GPS fallback active for testing.", "info");
            },
            { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
        );
    },

    // Simulate location update around classroom center
    updateStudentLocation: function(studentId) {
        const student = AppState.students.find(s => s.id === studentId);
        if (!student) return;

        // Slight random offset inside ~15 meters
        const offsetLat = (Math.random() - 0.5) * 0.00015;
        const offsetLng = (Math.random() - 0.5) * 0.00015;

        student.location.lat = parseFloat((this.classroomCenter.centerLat + offsetLat).toFixed(6));
        student.location.lng = parseFloat((this.classroomCenter.centerLng + offsetLng).toFixed(6));
        student.location.accuracy = (Math.random() * 3 + 2).toFixed(1);
        
        const check = this.checkGeofence(student.location.lat, student.location.lng);
        student.location.inZone = check.inZone;
        student.location.lastPing = new Date().toLocaleTimeString();
    },

    // Simulate student leaving the room (Geofence Breach Event)
    triggerBreach: function(studentId) {
        const student = AppState.students.find(s => s.id === studentId);
        if (!student) return;

        if (student.status !== "Present") {
            App.showNotification(`${student.name} is not marked present!`, "warning");
            return;
        }

        // Shift student 140 meters away outside the 30m geofence
        student.location.lat = this.classroomCenter.centerLat + 0.0012;
        student.location.lng = this.classroomCenter.centerLng + 0.0012;
        student.location.inZone = false;
        student.location.lastPing = new Date().toLocaleTimeString();

        App.addActivityLog(`🚨 GEOFENCE BREACH ALERT: ${student.name} (${student.rollNo}) walked 140m away from Room 304!`);
        App.showNotification(`⚠️ GEOFENCE ALERT: ${student.name} left Room 304 while session is active!`, "error");

        QREngine.playBeepSound();
        App.renderAll();
    }
};
