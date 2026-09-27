/**
 * Traffic Predictor - Frontend Logic with Interactive Map
 */

// --- Map State ---
let map;
let startMarker;
let destMarker;
let routeLayerGroup;
let wardLayerGroup;
let markersLayerGroup;
let forecastChartInstance = null;
let mapLayersControl = null;

const BHOPAL_CENTER = [23.2599, 77.4126];
const ZOOM_LEVEL = 13;

document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 60000);
    setDefaultDateTime();

    initializeMap();
    setupAutocomplete();
    setupEventListeners();

    const prefillDest = sessionStorage.getItem('prefillDest');
    if (prefillDest) {
        const destInput = document.getElementById('destination');
        if (destInput) {
            destInput.value = prefillDest;
        }
        sessionStorage.removeItem('prefillDest');
    }
});

// --- Utilities ---
const updateTime = () => {
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
};

const setDefaultDateTime = () => {
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');
    if (dateInput && timeInput) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
        
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeInput.value = `${hours}:${minutes}`;
    }
};

function initializeMap() {
    map = L.map('map', { zoomControl: false }).setView(BHOPAL_CENTER, ZOOM_LEVEL);
    
    const googleLayer = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3'],
        attribution: '&copy; <a href="https://maps.google.com/">Google Maps</a>',
        className: 'map-tiles'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    routeLayerGroup = L.layerGroup().addTo(map);
    wardLayerGroup = L.layerGroup().addTo(map);
    markersLayerGroup = L.layerGroup().addTo(map);

    const baseMaps = {
        "Google Maps": googleLayer
    };

    const overlayMaps = {
        "Bhopal Ward Boundaries": wardLayerGroup,
        "Traffic Route": routeLayerGroup,
        "Locations": markersLayerGroup
    };

    mapLayersControl = L.control.layers(baseMaps, overlayMaps, { position: 'topright' }).addTo(map);

    const resetControl = L.control({position: 'topright'});
    resetControl.onAdd = function() {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control custom-map-control');
        div.innerHTML = `<button type="button" title="Reset Bhopal View"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg></button>`;
        div.onclick = resetBhopalView;
        return div;
    };
    resetControl.addTo(map);

    loadBhopalWards();
}

let loadedWards = null;
async function loadBhopalWards() {
    try {
        const response = await fetch('data/Bhopal_wards.geojson');
        if (!response.ok) throw new Error("GeoJSON not found");
        
        loadedWards = await response.json();
        const geoJsonLayer = L.geoJSON(loadedWards, {
            style: {
                color: '#2563eb',
                weight: 1,
                opacity: 0.5,
                fillColor: '#3b82f6',
                fillOpacity: 0.1
            },
            onEachFeature: function (feature, layer) {
                let popupContent = "<strong>Ward Details</strong><br/>";
                if (feature.properties) {
                    for (const [key, value] of Object.entries(feature.properties)) {
                        popupContent += `<strong>${key}:</strong> ${value}<br/>`;
                    }
                }
                layer.bindPopup(popupContent);
                layer.on('click', function (e) {
                    layer.setStyle({ fillOpacity: 0.3 });
                    setTimeout(() => { layer.setStyle({ fillOpacity: 0.1 }); }, 2000);
                });
            }
        });
        
        geoJsonLayer.addTo(wardLayerGroup);
        const bounds = geoJsonLayer.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds);
        }
    } catch (e) {
        console.warn("Bhopal ward boundary data could not be loaded.");
        const msg = document.createElement('div');
        msg.className = 'state-message';
        msg.style.position = 'absolute';
        msg.style.top = '10px';
        msg.style.left = '50%';
        msg.style.transform = 'translateX(-50%)';
        msg.style.zIndex = '999';
        msg.style.padding = '8px 12px';
        msg.style.background = 'white';
        msg.style.boxShadow = 'var(--shadow-md)';
        msg.style.borderRadius = '4px';
        msg.style.fontSize = '12px';
        msg.textContent = 'Bhopal ward boundary data could not be loaded.';
        document.getElementById('map').appendChild(msg);
        setTimeout(() => msg.remove(), 5000);
    }
}

function resetBhopalView() {
    if (wardLayerGroup.getLayers().length > 0) {
        const layer = wardLayerGroup.getLayers()[0];
        if (layer && layer.getBounds) {
            map.fitBounds(layer.getBounds());
            return;
        }
    }
    map.setView(BHOPAL_CENTER, ZOOM_LEVEL);
}

// (Demo corridors removed to use real map data)

// --- Search & Autocomplete ---
function setupAutocomplete() {
    setupInputAutocomplete('start-location', 'start-suggestions');
    setupInputAutocomplete('destination', 'dest-suggestions');
}

function setupInputAutocomplete(inputId, listId) {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);

    let timeout = null;
    input.addEventListener('input', () => {
        const val = input.value.trim();
        list.innerHTML = '';
        if (!val) {
            list.classList.add('hidden');
            return;
        }

        clearTimeout(timeout);
        timeout = setTimeout(async () => {
            try {
                // Use Nominatim for real geocoding
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val + ', Bhopal')}&format=json&limit=5`);
                const matches = await res.json();
                
                list.innerHTML = '';
                if (matches && matches.length > 0) {
                    matches.forEach(loc => {
                        const li = document.createElement('li');
                        // Show short name for UI, but store full coords
                        const displayName = loc.display_name.split(',')[0]; 
                        li.textContent = loc.display_name;
                        li.addEventListener('click', () => {
                            input.value = displayName;
                            input.dataset.lat = loc.lat;
                            input.dataset.lng = loc.lon;
                            list.classList.add('hidden');
                            handleLocationSelection(inputId, { name: displayName, lat: parseFloat(loc.lat), lng: parseFloat(loc.lon) });
                        });
                        list.appendChild(li);
                    });
                    list.classList.remove('hidden');
                } else {
                    list.classList.add('hidden');
                }
            } catch(e) {
                console.error("Geocoding failed", e);
            }
        }, 500);
    });

    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== list) {
            list.classList.add('hidden');
        }
    });
}

function handleLocationSelection(inputId, loc) {
    const latLng = [loc.lat, loc.lng];
    
    if (inputId === 'start-location') {
        if (startMarker) markersLayerGroup.removeLayer(startMarker);
        const icon = L.divIcon({ className: 'custom-marker-start', iconSize: [14, 14] });
        startMarker = L.marker(latLng, { icon }).bindPopup("Start: " + loc.name).addTo(markersLayerGroup);
    } else {
        if (destMarker) markersLayerGroup.removeLayer(destMarker);
        const icon = L.divIcon({ className: 'custom-marker-dest', iconSize: [14, 14] });
        destMarker = L.marker(latLng, { icon }).bindPopup("Destination: " + loc.name).addTo(markersLayerGroup);
    }

    if (startMarker && destMarker) {
        const bounds = L.latLngBounds(startMarker.getLatLng(), destMarker.getLatLng());
        map.fitBounds(bounds, { padding: [50, 50] });
    } else {
        map.setView(latLng, 14);
    }
}

// --- Event Listeners ---
function setupEventListeners() {
    const btnUseLocation = document.getElementById('btn-use-location');
    if (btnUseLocation) {
        btnUseLocation.addEventListener('click', useCurrentLocation);
    }

    const predictionForm = document.getElementById('prediction-form');
    if (predictionForm) {
        predictionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            predictTraffic();
        });
    }

    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Close mobile menu on click
            const appNav = document.getElementById('app-nav');
            if (appNav) appNav.classList.remove('menu-open');
        });
    });

    // Mobile Menu Toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const appNav = document.getElementById('app-nav');
    const navOverlay = document.getElementById('nav-overlay');

    if (menuBtn && appNav) {
        menuBtn.addEventListener('click', () => {
            appNav.classList.toggle('menu-open');
        });
    }

    if (navOverlay && appNav) {
        navOverlay.addEventListener('click', () => {
            appNav.classList.remove('menu-open');
        });
    }
}

function useCurrentLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }
    
    const btn = document.getElementById('btn-use-location');
    btn.style.opacity = '0.5';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            btn.style.opacity = '1';
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            const startInput = document.getElementById('start-location');
            startInput.value = "Current Location";
            startInput.dataset.lat = lat;
            startInput.dataset.lng = lng;
            
            handleLocationSelection('start-location', {name: "Current Location", lat, lng});
        },
        (error) => {
            btn.style.opacity = '1';
            alert("Unable to retrieve your location. Please ensure location permissions are granted.");
        }
    );
}

// --- Route Drawing & Dashboard Update ---
async function predictTraffic() {
    const startInput = document.getElementById('start-location');
    const destInput = document.getElementById('destination');
    
    if (!startInput.dataset.lat || !destInput.dataset.lat) {
        alert("Please select locations from the search suggestions or use your current location.");
        return;
    }

    const startLoc = { lat: parseFloat(startInput.dataset.lat), lng: parseFloat(startInput.dataset.lng) };
    const destLoc = { lat: parseFloat(destInput.dataset.lat), lng: parseFloat(destInput.dataset.lng) };

    const loadingState = document.getElementById('loading-state');
    const predictionResult = document.getElementById('prediction-result');
    const submitBtn = document.querySelector('#prediction-form button[type="submit"]');

    predictionResult.classList.add('hidden');
    loadingState.classList.remove('hidden');
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Calculating route...';
    }

    // Clear previous error if any
    const existingError = document.getElementById('api-error');
    if (existingError) existingError.remove();

    try {
        // Communicate with OUR backend, keeping API keys secure on the server
        const response = await fetch(`/api/route?startLat=${startLoc.lat}&startLng=${startLoc.lng}&endLat=${destLoc.lat}&endLng=${destLoc.lng}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to calculate route.');
        }

        const routeData = data.route;

        drawRealRoute(routeData.geometry, routeData.trafficLevel);
        updateTrafficPanelFromAPI(routeData);
        
        // --- ML PREDICTION CALLS ---
        const dateVal = document.getElementById('date').value;
        const timeVal = document.getElementById('time').value;
        const horizon = 0; // Defaulting to 0 since the UI element was replaced with Places dropdown
        
        await fetchMLPrediction(startInput.value, dateVal, timeVal, horizon);
        await updateMLChart(startInput.value, dateVal, timeVal);
        
        loadingState.classList.add('hidden');
        predictionResult.classList.remove('hidden');
    } catch (error) {
        loadingState.classList.add('hidden');
        
        // Human-readable error handling without exposing stack traces
        const errorEl = document.createElement('div');
        errorEl.id = 'api-error';
        errorEl.className = 'state-message error-message';
        errorEl.style.color = 'var(--color-red)';
        errorEl.textContent = 'Unable to calculate the route right now. Please try again. (' + error.message + ')';
        
        const formActions = document.querySelector('.form-actions');
        if (formActions) formActions.insertAdjacentElement('afterend', errorEl);
        
        console.error("Traffic API Error:", error.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Run Prediction';
        }
    }
}

function drawRealRoute(geometry, overallTrafficLevel) {
    routeLayerGroup.clearLayers();

    if (!geometry || geometry.length === 0) return;

    // Use standardized title case for classification colors
    const levelKey = overallTrafficLevel.charAt(0).toUpperCase() + overallTrafficLevel.slice(1).toLowerCase();
    const color = trafficLevelColors[levelKey] || trafficLevelColors.Low;
    
    const poly = L.polyline(geometry, { color: color, weight: 6, opacity: 0.9 }).addTo(routeLayerGroup);
    
    // Ensure route is visually prominent
    poly.bringToFront();
    
    const popupHtml = `
        <strong>Calculated Route</strong>
        <div class="popup-stat">
            <span class="popup-label">Overall Traffic:</span>
            <span class="popup-value" style="color:${color}">${levelKey}</span>
        </div>
        <div style="margin-top: 8px; font-size: 11px; color: var(--gray-500);">
            Traffic segment data is not available from the current routing source.
        </div>
    `;
    poly.bindPopup(popupHtml);

    const bounds = L.latLngBounds(geometry);
    map.fitBounds(bounds, { padding: [50, 50] });
}

function updateTrafficPanelFromAPI(routeData) {
    const levelKey = routeData.trafficLevel.charAt(0).toUpperCase() + routeData.trafficLevel.slice(1).toLowerCase();
    
    // Map to CSS class 
    const colorClasses = {
        'Low': 'color-green',
        'Moderate': 'color-yellow',
        'High': 'color-orange',
        'Severe': 'color-red'
    };
    const colorClass = colorClasses[levelKey] || 'color-green';
    
    const resLevel = document.getElementById('res-level');
    if (resLevel) {
        resLevel.textContent = levelKey;
        resLevel.className = `value ${colorClass}`;
    }
    
    const resScore = document.getElementById('res-score');
    if (resScore) {
        resScore.textContent = `${routeData.trafficScore} / 100`;
    }
    
    const resTime = document.getElementById('res-time');
    if (resTime) {
        resTime.textContent = `${routeData.durationMinutes} min`;
    }
    
    const resDelay = document.getElementById('res-delay');
    if (routeData.trafficDelayMinutes > 0) {
        resDelay.textContent = `+${routeData.trafficDelayMinutes} min`;
        resDelay.className = `value ${colorClass}`;
    } else {
        resDelay.textContent = 'No delay';
        resDelay.className = `value color-green`;
    }
    
    const summaryEl = document.getElementById('res-summary');
    summaryEl.innerHTML = `
        Distance: <strong>${routeData.distanceKm} km</strong>. 
        Normal time: <strong>${routeData.normalDurationMinutes} min</strong>.<br>
        <span style="font-size: 0.85em; color: var(--gray-500); display:block; margin-top: 8px;">
            Traffic segment data is not available from the current routing source.
        </span>
    `;
}

// --- ML PREDICTION ENGINE ---
async function fetchMLPrediction(road, dateVal, timeVal, offsetMinutes) {
    try {
        let dt = new Date(`${dateVal}T${timeVal}`);
        if (offsetMinutes > 0) {
            dt = new Date(dt.getTime() + offsetMinutes * 60000);
        }
        
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        // In a real application, these features would be dynamically fetched from sensors/weather APIs.
        const payload = {
            road: road || 'MP Nagar',
            hour: dt.getHours(),
            day_of_week: days[dt.getDay()],
            vehicle_count: 850,
            average_speed: 25.0,
            weather: 'Clear',
            temperature: 28.5,
            rainfall: 0.0
        };

        const res = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            const data = await res.json();
            if (data.success) {
                updateMLPanel(data, offsetMinutes);
            }
        }
    } catch (e) {
        console.error("ML Prediction Error:", e);
    }
}

function updateMLPanel(data, horizon) {
    const mlLevel = document.getElementById('ml-level');
    const mlScore = document.getElementById('ml-score');
    const mlHorizon = document.getElementById('ml-horizon');
    
    if (!mlLevel || !mlScore || !mlHorizon) return;
    
    const levelKey = data.traffic_level.charAt(0).toUpperCase() + data.traffic_level.slice(1).toLowerCase();
    const colorClasses = {
        'Low': 'color-green', 'Moderate': 'color-yellow', 'High': 'color-orange', 'Severe': 'color-red'
    };
    
    mlLevel.textContent = levelKey;
    mlLevel.className = `value ${colorClasses[levelKey] || 'color-green'}`;
    mlScore.textContent = `${data.traffic_score} / 100`;
    
    if (horizon === 0) {
        mlHorizon.textContent = "Current";
    } else if (horizon === 120) {
        mlHorizon.textContent = "2 hours";
    } else {
        mlHorizon.textContent = `${horizon} minutes`;
    }
}

async function updateMLChart(road, dateVal, timeVal) {
    const times = [];
    const scores = [];
    
    // Generate 5 prediction points (0, 15, 30, 45, 60 mins)
    for (let offset of [0, 15, 30, 45, 60]) {
        let dt = new Date(`${dateVal}T${timeVal}`);
        dt = new Date(dt.getTime() + offset * 60000);
        
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const payload = {
            road: road || 'MP Nagar',
            hour: dt.getHours(),
            day_of_week: days[dt.getDay()],
            vehicle_count: 850,
            average_speed: 25.0,
            weather: 'Clear',
            temperature: 28.5,
            rainfall: 0.0
        };
        
        try {
            const res = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                times.push(`${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`);
                scores.push(data.traffic_score);
            }
        } catch(e) {
            console.error(e);
        }
    }
    
    drawChart(times, scores);
}

function drawChart(labels, data) {
    const ctx = document.getElementById('forecast-chart');
    if (!ctx) return;
    
    if (forecastChartInstance) {
        forecastChartInstance.destroy();
    }
    
    forecastChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Predicted Traffic Score',
                data: data,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#2563eb',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: 0, max: 100 }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}
