// Pre-loaded 10 Student Profiles with mock metadata, initial states & stats
const INITIAL_STUDENTS = [
    {
        id: "STU-101",
        name: "Aarav Sharma",
        rollNo: "CS2026-01",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        seatNo: "Desk 1A",
        status: "Absent", // Present, Absent, Late
        attendanceRate: 94,
        sessionTimer: 2700, // 45 minutes in seconds
        sessionActive: false,
        location: {
            lat: 28.6139,
            lng: 77.2090,
            inZone: true,
            accuracy: 4.2,
            lastPing: "Not Checked"
        }
    },
    {
        id: "STU-102",
        name: "Ananya Verma",
        rollNo: "CS2026-02",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
        seatNo: "Desk 1B",
        status: "Absent",
        attendanceRate: 98,
        sessionTimer: 2700,
        sessionActive: false,
        location: {
            lat: 28.6140,
            lng: 77.2092,
            inZone: true,
            accuracy: 3.8,
            lastPing: "Not Checked"
        }
    },
    {
        id: "STU-103",
        name: "Rohan Gupta",
        rollNo: "CS2026-03",
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
        seatNo: "Desk 2A",
        status: "Absent",
        attendanceRate: 88,
        sessionTimer: 2700,
        sessionActive: false,
        location: {
            lat: 28.6138,
            lng: 77.2088,
            inZone: true,
            accuracy: 5.1,
            lastPing: "Not Checked"
        }
    },
    {
        id: "STU-104",
        name: "Diya Patel",
        rollNo: "CS2026-04",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
        seatNo: "Desk 2B",
        status: "Absent",
        attendanceRate: 92,
        sessionTimer: 2700,
        sessionActive: false,
        location: {
            lat: 28.6141,
            lng: 77.2091,
            inZone: true,
            accuracy: 2.9,
            lastPing: "Not Checked"
        }
    },
    {
        id: "STU-105",
        name: "Kabir Singh",
        rollNo: "CS2026-05",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        seatNo: "Desk 3A",
        status: "Absent",
        attendanceRate: 81,
        sessionTimer: 2700,
        sessionActive: false,
        location: {
            lat: 28.6137,
            lng: 77.2095,
            inZone: false, // Simulated out of zone
            accuracy: 12.4,
            lastPing: "Not Checked"
        }
    },
    {
        id: "STU-106",
        name: "Isha Nair",
        rollNo: "CS2026-06",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        seatNo: "Desk 3B",
        status: "Absent",
        attendanceRate: 96,
        sessionTimer: 2700,
        sessionActive: false,
        location: {
            lat: 28.6139,
            lng: 77.2093,
            inZone: true,
            accuracy: 4.0,
            lastPing: "Not Checked"
        }
    },
    {
        id: "STU-107",
        name: "Vihaan Joshi",
        rollNo: "CS2026-07",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
        seatNo: "Desk 4A",
        status: "Absent",
        attendanceRate: 90,
        sessionTimer: 2700,
        sessionActive: false,
        location: {
            lat: 28.6142,
            lng: 77.2089,
            inZone: true,
            accuracy: 3.5,
            lastPing: "Not Checked"
        }
    },
    {
        id: "STU-108",
        name: "Sanya Roy",
        rollNo: "CS2026-08",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
        seatNo: "Desk 4B",
        status: "Absent",
        attendanceRate: 95,
        sessionTimer: 2700,
        sessionActive: false,
        location: {
            lat: 28.6139,
            lng: 77.2091,
            inZone: true,
            accuracy: 3.1,
            lastPing: "Not Checked"
        }
    },
    {
        id: "STU-109",
        name: "Aryan Malhotra",
        rollNo: "CS2026-09",
        avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
        seatNo: "Desk 5A",
        status: "Absent",
        attendanceRate: 85,
        sessionTimer: 2700,
        sessionActive: false,
        location: {
            lat: 28.6135,
            lng: 77.2087,
            inZone: true,
            accuracy: 4.8,
            lastPing: "Not Checked"
        }
    },
    {
        id: "STU-110",
        name: "Tara Mehta",
        rollNo: "CS2026-10",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
        seatNo: "Desk 5B",
        status: "Absent",
        attendanceRate: 99,
        sessionTimer: 2700,
        sessionActive: false,
        location: {
            lat: 28.6140,
            lng: 77.2094,
            inZone: true,
            accuracy: 2.5,
            lastPing: "Not Checked"
        }
    }
];

// Classroom Geofence Anchor (Latitude, Longitude, Radius in Meters)
const CLASSROOM_GEOFENCE = {
    name: "Room 304 - Smart AI Lab",
    centerLat: 28.6139,
    centerLng: 77.2090,
    radiusMeters: 30, // 30 meters geofence radius
    maxClassDurationMinutes: 45
};
