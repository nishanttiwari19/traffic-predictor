const express = require('express');
const router = express.Router();
const trafficService = require('../services/trafficService');

/**
 * GET /api/route
 * Retrieves traffic-aware routing between origin and destination coordinates.
 */
router.get('/route', async (req, res) => {
    try {
        const { startLat, startLng, endLat, endLng } = req.query;

        // 1. Validate coordinates
        if (!startLat || !startLng || !endLat || !endLng) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required coordinate parameters (startLat, startLng, endLat, endLng).' 
            });
        }

        const origin = { lat: parseFloat(startLat), lng: parseFloat(startLng) };
        const dest = { lat: parseFloat(endLat), lng: parseFloat(endLng) };

        if (isNaN(origin.lat) || isNaN(origin.lng) || isNaN(dest.lat) || isNaN(dest.lng)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Coordinate parameters must be valid numbers.' 
            });
        }

        // 2. Call the external routing service (handled securely on the backend)
        const routeData = await trafficService.getRoute(origin, dest);

        // 3. Return sanitized, structured data to frontend
        return res.json({
            success: true,
            route: routeData
        });

    } catch (error) {
        console.error('Error in /api/route:', error.message);
        return res.status(500).json({ 
            success: false, 
            error: 'Unable to calculate the route right now. Please try again.' 
        });
    }
});

/**
 * POST /api/predict
 * Proxies to Python ML service for traffic forecasting.
 */
router.post('/predict', async (req, res) => {
    try {
        const payload = req.body;
        
        if (!payload.road || payload.hour === undefined) {
            return res.status(400).json({ success: false, error: 'Missing required prediction features.' });
        }
        
        // Proxy to Python FastAPI
        const response = await fetch('http://localhost:8000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`Prediction service returned status ${response.status}`);
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error in /api/predict:', error.message);
        res.status(503).json({ success: false, error: 'Prediction service unavailable' });
    }
});

module.exports = router;
