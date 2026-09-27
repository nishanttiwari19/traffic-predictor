/**
 * Demo traffic data for Bhopal.
 * // TODO: Replace demo traffic data with real-time traffic API.
 */

const bhopalLocations = [
    { name: "MP Nagar", lat: 23.2332, lng: 77.4345 },
    { name: "Lalghati", lat: 23.2842, lng: 77.3750 },
    { name: "New Market", lat: 23.2355, lng: 77.4005 },
    { name: "Habibganj", lat: 23.2084, lng: 77.4362 },
    { name: "Kolar Road", lat: 23.1895, lng: 77.4116 },
    { name: "Arera Colony", lat: 23.2086, lng: 77.4237 },
    { name: "Board Office", lat: 23.2312, lng: 77.4326 },
    { name: "AIIMS Bhopal", lat: 23.2032, lng: 77.4604 },
    { name: "Shahpura", lat: 23.1950, lng: 77.4310 },
    { name: "Bairagarh", lat: 23.2825, lng: 77.3486 }
];

const trafficCorridors = [
    {
        id: "c1",
        name: "MP Nagar Road",
        points: [[23.2332, 77.4345], [23.2300, 77.4350], [23.2200, 77.4370]],
        level: "High",
        score: 78,
        speed: 18,
        color: "#f97316", // orange
        status: "Heavy congestion"
    },
    {
        id: "c2",
        name: "Habibganj Underpass",
        points: [[23.2084, 77.4362], [23.2130, 77.4360], [23.2200, 77.4350]],
        level: "Moderate",
        score: 54,
        speed: 27,
        color: "#f59e0b", // yellow
        status: "Moving normally with some slowdown."
    },
    {
        id: "c3",
        name: "VIP Road (Lalghati)",
        points: [[23.2842, 77.3750], [23.2750, 77.3850], [23.2650, 77.3950]],
        level: "Low",
        score: 92,
        speed: 45,
        color: "#10b981", // green
        status: "Clear route, optimal speeds."
    },
    {
        id: "c4",
        name: "New Market Square",
        points: [[23.2355, 77.4005], [23.2380, 77.4050], [23.2420, 77.4100]],
        level: "Severe",
        score: 21,
        speed: 12,
        color: "#ef4444", // red
        status: "Major delays, avoid if possible."
    },
    {
        id: "c5",
        name: "Kolar Road",
        points: [[23.1895, 77.4116], [23.1950, 77.4150], [23.2050, 77.4200]],
        level: "Moderate",
        score: 60,
        speed: 32,
        color: "#f59e0b", // yellow
        status: "Steady traffic flow."
    }
];

const trafficLevelColors = {
    Low: "#10b981",
    Moderate: "#f59e0b",
    High: "#f97316",
    Severe: "#ef4444"
};
