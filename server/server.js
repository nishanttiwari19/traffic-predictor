require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const trafficRoutes = require('./routes/trafficRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS configuration (allow all for local dev, restrict in prod)
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://bhopal-traffic-predictor.web.app']
}));

// Rate limiting to protect the external traffic API from abuse
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true, 
    legacyHeaders: false, 
});

// Apply rate limiter specifically to API routes
app.use('/api', apiLimiter);

// Serve the frontend static files from the root directory
app.use(express.static(path.join(__dirname, '../')));

// API Routes
app.use('/api', trafficRoutes);
app.use('/api/analytics', analyticsRoutes);

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Traffic Predictor Backend running at http://0.0.0.0:${PORT}`);
    if (process.env.DEMO_MODE === 'true') {
        console.log('Running in DEMO_MODE: using simulated traffic data.');
    }
});
