// Geolocation & Geofence Engine - Live GPS Tracking and Boundary Verification

const LocationEngine = {
    classroomCenter: CLASSROOM_GEOFENCE,

    // Calculate distance between two lat/lng points in meters (Haversine Formula)
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

        return R * c; // Distance in meters
    },

    // Verify if coordinates are inside the classroom geofence
    isWithinGeofence: function(lat, lng) {
        const dist = this.calculateDistanceMeters(
            lat, lng, 
            this.classroomCenter.centerLat, 
            this.classroomCenter.centerLng
        );
        return {
            inZone: dist <= this.classroomCenter.radiusMeters,
            distance: Math.round(dist)
        };
    },

    // Trigger Real Browser Geolocation to update student's location
    requestRealGeolocation: function(studentId) {
        if (!navigator.geolocation) {
            App.showNotification("Geolocation API is not supported by your browser.", "error");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;

                const check = this.isWithinGeofence(lat, lng);
                
                const student = AppState.students.find(s => s.id === studentId);
                if (student) {
                    student.location.lat = lat;
                    student.location.lng = lng;
                    student.location.accuracy = Math.round(accuracy);
                    student.location.inZone = check.inZone;
                    student.location.lastPing = new Date().toLocaleTimeString();

                    App.showNotification(`GPS Updated for ${student.name}: ${check.distance}m from classroom (${check.inZone ? "Inside Zone" : "OUT OF ZONE!"})`, check.inZone ? "success" : "warning");
                    
                    App.renderAll();
                }
            },
            (error) => {
                console.warn("Geolocation fallback to indoor simulated GPS:", error.message);
                this.updateStudentLocation(studentId); // Fallback to simulation
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    },

    // Simulate location update with small indoor GPS variations
    updateStudentLocation: function(studentId) {
        const student = AppState.students.find(s => s.id === studentId);
        if (!student) return;

        // Slight random deviation around classroom center
        const offsetLat = (Math.random() - 0.5) * 0.0002;
        const offsetLng = (Math.random() - 0.5) * 0.0002;

        student.location.lat = parseFloat((this.classroomCenter.centerLat + offsetLat).toFixed(6));
        student.location.lng = parseFloat((this.classroomCenter.centerLng + offsetLng).toFixed(6));
        student.location.accuracy = (Math.random() * 3 + 2).toFixed(1);
        
        const check = this.isWithinGeofence(student.location.lat, student.location.lng);
        student.location.inZone = check.inZone;
        student.location.lastPing = new Date().toLocaleTimeString();
    },

    // Simulate a student walking out of classroom (Geofence Breach Event)
    simulateGeofenceBreach: function(studentId) {
        const student = AppState.students.find(s => s.id === studentId);
        if (!student) return;

        // Shift location far away (~120 meters)
        student.location.lat = this.classroomCenter.centerLat + 0.0015;
        student.location.lng = this.classroomCenter.centerLng + 0.0015;
        student.location.inZone = false;
        student.location.lastPing = new Date().toLocaleTimeString();

        App.addActivityLog(`⚠️ GEOFENCE BREACH ALERT: ${student.name} (${student.rollNo}) moved out of Room 304 while session is active!`);
        App.showNotification(`🚨 ALERT: ${student.name} left the classroom area!`, "error");

        App.renderAll();
    }
};
