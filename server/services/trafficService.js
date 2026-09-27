/**
 * Traffic Service
 * Handles communication with external traffic APIs, caching, and classification.
 * IMPORTANT: External API keys are kept securely here and never sent to the browser.
 */

// Configuration for traffic classification thresholds
const TRAFFIC_THRESHOLDS = {
    moderate: 0.10, // > 10% delay
    high: 0.25,     // > 25% delay
    severe: 0.50    // > 50% delay
};

// Simple in-memory cache to prevent excessive identical external API calls
// Key: "startLat,startLng|endLat,endLng"
const routeCache = new Map();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Calculates a standard traffic level string based on delay vs normal time.
 */
function calculateTrafficLevel(delayMinutes, normalMinutes) {
    if (normalMinutes <= 0 || delayMinutes <= 0) return 'LOW';
    
    const ratio = delayMinutes / normalMinutes;
    if (ratio >= TRAFFIC_THRESHOLDS.severe) return 'SEVERE';
    if (ratio >= TRAFFIC_THRESHOLDS.high) return 'HIGH';
    if (ratio >= TRAFFIC_THRESHOLDS.moderate) return 'MODERATE';
    
    return 'LOW';
}

/**
 * Calculates a sensible traffic score (0-100) based on measurable delay metrics.
 * 100 = Perfect flow (0 delay)
 * 0 = Complete gridlock
 */
function calculateTrafficScore(delayMinutes, normalMinutes) {
    if (normalMinutes <= 0) return 100;
    
    const ratio = delayMinutes / normalMinutes;
    // Score linearly decreases based on delay ratio. E.g., 50% delay = score 50
    let score = 100 - (ratio * 100);
    return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Fetches routing and traffic information between two points.
 */
async function getRoute(origin, dest) {
    const cacheKey = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}|${dest.lat.toFixed(4)},${dest.lng.toFixed(4)}`;
    
    // Check Cache
    if (routeCache.has(cacheKey)) {
        const cached = routeCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return cached.data;
        }
    }

    const isDemoMode = process.env.DEMO_MODE === 'true';
    let routeData;

    if (isDemoMode) {
        routeData = await getDemoRouteData(origin, dest);
    } else {
        routeData = await getRealApiRouteData(origin, dest);
    }

    // Save to Cache
    routeCache.set(cacheKey, { timestamp: Date.now(), data: routeData });

    return routeData;
}

/**
 * Simulated fallback logic for development/demo when a real API is unavailable.
 */
async function getDemoRouteData(origin, dest) {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 800));

    // Approximate straight-line distance in km for demo purposes
    const dx = origin.lat - dest.lat;
    const dy = origin.lng - dest.lng;
    const distanceDeg = Math.sqrt(dx * dx + dy * dy);
    const distanceKm = Math.round((distanceDeg * 111) * 10) / 10;

    // Simulate travel times (approx 30km/h avg speed)
    const normalDurationMinutes = Math.max(5, Math.round(distanceKm * 2));
    
    // Randomize some delay for the demo
    const delayMinutes = Math.floor(Math.random() * (normalDurationMinutes * 0.7)); 
    const durationMinutes = normalDurationMinutes + delayMinutes;

    const trafficLevel = calculateTrafficLevel(delayMinutes, normalDurationMinutes);
    const trafficScore = calculateTrafficScore(delayMinutes, normalDurationMinutes);

    // Simple 3-point geometry for visualization
    const midLat = (origin.lat + dest.lat) / 2 + 0.005;
    const midLng = (origin.lng + dest.lng) / 2 - 0.005;

    return {
        distanceKm,
        durationMinutes,
        normalDurationMinutes,
        trafficDelayMinutes: delayMinutes,
        trafficLevel,
        trafficScore,
        geometry: [
            [origin.lat, origin.lng],
            [midLat, midLng],
            [dest.lat, dest.lng]
        ]
    };
}

/**
 * Placeholder for actual external API integration (e.g. Mapbox, TomTom, OSRM).
 */
async function getRealApiRouteData(origin, dest) {
    const apiKey = process.env.TRAFFIC_API_KEY;
    if (!apiKey) {
        throw new Error('TRAFFIC_API_KEY is missing in environment variables. Please set it or enable DEMO_MODE=true.');
    }

    // TODO: Make actual HTTP request to provider here using `fetch` or `axios`
    // const response = await fetch(`https://api.externalprovider.com/route?...&key=${apiKey}`);
    // const rawData = await response.json();
    // return processRawDataIntoStandardFormat(rawData);

    throw new Error('Real traffic API provider not yet implemented. Set DEMO_MODE=true in .env');
}

module.exports = {
    getRoute,
    calculateTrafficLevel,
    calculateTrafficScore
};
