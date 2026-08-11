// Pre-loaded Students, Teacher Profiles, Class Schedules, Dynamic Quiz & Helper Store

const TEACHER_PROFILE = {
    id: "T-304",
    name: "Dr. Rajesh K. Sharma",
    designation: "Head of AI & Smart Systems",
    email: "r.sharma@university.edu",
    roomNo: "Room 304 - AI Systems Lab",
    subject: "CS-402: Advanced AI & Smart Systems",
    officeHours: "10:00 AM - 04:00 PM",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
};

const CLASS_SCHEDULE = [
    { time: "09:00 AM - 09:45 AM", subject: "Mathematics for AI", room: "Room 102", instructor: "Dr. Anita Roy", status: "Completed" },
    { time: "10:00 AM - 10:45 AM", subject: "CS-402: Advanced AI & Smart Systems", room: "Room 304 (AI Lab)", instructor: "Dr. Rajesh K. Sharma", status: "Active (Current Class)" },
    { time: "11:00 AM - 11:45 AM", subject: "Data Structures & Algorithms", room: "Room 205", instructor: "Prof. V. Kapoor", status: "Upcoming" },
    { time: "01:30 PM - 02:15 PM", subject: "Machine Learning Lab", room: "Lab 4", instructor: "Dr. Rajesh K. Sharma", status: "Upcoming" }
];

// Pre-loaded Quiz Questions (Can be customized by teacher)
const DEFAULT_TEACHER_QUIZ = [
    {
        q: "1. Which formula calculates spherical distance between GPS coordinates in geofencing?",
        options: ["Haversine Formula", "Pythagoras Theorem", "Euclidean Distance", "Manhattan Distance"],
        ans: 0
    },
    {
        q: "2. What is the standard duration of the class session timer in Room 304?",
        options: ["30 Minutes", "45 Minutes", "60 Minutes", "90 Minutes"],
        ans: 1
    },
    {
        q: "3. What frequency does the dynamic QR token refresh for security?",
        options: ["Every 10s", "Every 30s", "Every 5m", "Never"],
        ans: 1
    }
];

let INITIAL_STUDENTS = [
    {
        id: "STU-101",
        enrollNo: "CS2026-01",
        password: "password123",
        name: "Aarav Sharma",
        seatNo: "Desk 1A",
        xpPoints: 340,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        status: "Absent",
        sessionTimer: 2700,
        sessionActive: false,
        scannedViaQR: false,
        location: { lat: 28.6139, lng: 77.2090, inZone: true, prediction: "Inside Room 304 (AI Lab)", accuracy: 3.2, lastPing: "10:01 AM" }
    },
    {
        id: "STU-102",
        enrollNo: "CS2026-02",
        password: "password123",
        name: "Ananya Verma",
        seatNo: "Desk 1B",
        xpPoints: 480,
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
        status: "Absent",
        sessionTimer: 2700,
        sessionActive: false,
        scannedViaQR: false,
        location: { lat: 28.6140, lng: 77.2092, inZone: true, prediction: "Inside Room 304 (Front Row)", accuracy: 2.8, lastPing: "10:02 AM" }
    },
    {
        id: "STU-103",
        enrollNo: "CS2026-03",
        password: "password123",
        name: "Rohan Gupta",
        seatNo: "Desk 2A",
        xpPoints: 290,
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
        status: "Absent",
        sessionTimer: 2700,
        sessionActive: false,
        scannedViaQR: false,
        location: { lat: 28.6138, lng: 77.2088, inZone: true, prediction: "Inside Room 304 (Middle Row)", accuracy: 4.1, lastPing: "10:00 AM" }
    },
    {
        id: "STU-104",
        enrollNo: "CS2026-04",
        password: "password123",
        name: "Diya Patel",
        seatNo: "Desk 2B",
        xpPoints: 410,
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
        status: "Absent",
        sessionTimer: 2700,
        sessionActive: false,
        scannedViaQR: false,
        location: { lat: 28.6141, lng: 77.2091, inZone: true, prediction: "Inside Room 304 (Window Seat)", accuracy: 2.9, lastPing: "10:03 AM" }
    },
    {
        id: "STU-105",
        enrollNo: "CS2026-05",
        password: "password123",
        name: "Kabir Singh",
        seatNo: "Desk 3A",
        xpPoints: 150,
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        status: "Absent",
        sessionTimer: 2700,
        sessionActive: false,
        scannedViaQR: false,
        location: { lat: 28.6152, lng: 77.2105, inZone: false, prediction: "Campus Cafeteria (140m away)", accuracy: 8.4, lastPing: "10:04 AM" }
    },
    {
        id: "STU-106",
        enrollNo: "CS2026-06",
        password: "password123",
        name: "Isha Nair",
        seatNo: "Desk 3B",
        xpPoints: 370,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        status: "Absent",
        sessionTimer: 2700,
        sessionActive: false,
        scannedViaQR: false,
        location: { lat: 28.6139, lng: 77.2093, inZone: true, prediction: "Inside Room 304 (Back Row)", accuracy: 3.5, lastPing: "10:01 AM" }
    },
    {
        id: "STU-107",
        enrollNo: "CS2026-07",
        password: "password123",
        name: "Vihaan Joshi",
        seatNo: "Desk 4A",
        xpPoints: 310,
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
        status: "Absent",
        sessionTimer: 2700,
        sessionActive: false,
        scannedViaQR: false,
        location: { lat: 28.6142, lng: 77.2089, inZone: true, prediction: "Inside Room 304 (Middle Row)", accuracy: 3.1, lastPing: "10:02 AM" }
    },
    {
        id: "STU-108",
        enrollNo: "CS2026-08",
        password: "password123",
        name: "Sanya Roy",
        seatNo: "Desk 4B",
        xpPoints: 450,
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
        status: "Absent",
        sessionTimer: 2700,
        sessionActive: false,
        scannedViaQR: false,
        location: { lat: 28.6139, lng: 77.2091, inZone: true, prediction: "Inside Room 304 (Front Row)", accuracy: 2.7, lastPing: "10:05 AM" }
    },
    {
        id: "STU-109",
        enrollNo: "CS2026-09",
        password: "password123",
        name: "Aryan Malhotra",
        seatNo: "Desk 5A",
        xpPoints: 260,
        avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
        status: "Absent",
        sessionTimer: 2700,
        sessionActive: false,
        scannedViaQR: false,
        location: { lat: 28.6135, lng: 77.2087, inZone: true, prediction: "Near Room 304 Entrance", accuracy: 4.8, lastPing: "10:01 AM" }
    },
    {
        id: "STU-110",
        enrollNo: "CS2026-10",
        password: "password123",
        name: "Tara Mehta",
        seatNo: "Desk 5B",
        xpPoints: 500,
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
        status: "Absent",
        sessionTimer: 2700,
        sessionActive: false,
        scannedViaQR: false,
        location: { lat: 28.6140, lng: 77.2094, inZone: true, prediction: "Inside Room 304 (Window Seat)", accuracy: 2.3, lastPing: "10:00 AM" }
    }
];

const CLASSROOM_GEOFENCE = {
    name: "Room 304 - AI Systems Lab",
    centerLat: 28.6139,
    centerLng: 77.2090,
    radiusMeters: 30,
    maxClassDurationMinutes: 45
};

const INITIAL_CHAT_MESSAGES = [
    { sender: "Dr. Rajesh K. Sharma", role: "teacher", text: "Welcome to CS-402! Please scan your QR code at the door to start your 45-minute session.", time: "10:00 AM" },
    { sender: "Ananya Verma (CS2026-02)", role: "student", text: "Good morning sir! QR scanned successfully.", time: "10:02 AM" },
    { sender: "Aarav Sharma (CS2026-01)", role: "student", text: "Sir, is today's lab assignment submission due at 11:00 AM?", time: "10:03 AM" },
    { sender: "Dr. Rajesh K. Sharma", role: "teacher", text: "Yes Aarav, submit before the 45-minute timer concludes.", time: "10:04 AM" }
];
