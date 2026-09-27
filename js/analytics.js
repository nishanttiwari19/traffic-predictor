document.addEventListener('DOMContentLoaded', () => {
    initializeAnalytics();
    setupEventListeners();
});

let charts = {};
let currentRoadData = [];

function setupEventListeners() {
    document.getElementById('date-range').addEventListener('change', () => {
        loadAnalyticsData();
    });

    document.getElementById('btn-retry').addEventListener('click', () => {
        loadAnalyticsData();
    });

    document.getElementById('road-search').addEventListener('input', (e) => {
        filterRoadTable();
    });
    
    document.getElementById('road-filter').addEventListener('change', () => {
        filterRoadTable();
    });

    document.getElementById('btn-export').addEventListener('click', () => {
        exportReport();
    });

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

    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (appNav) appNav.classList.remove('menu-open');
        });
    });
}

async function initializeAnalytics() {
    loadAnalyticsData();
}

async function loadAnalyticsData() {
    const days = document.getElementById('date-range').value;
    
    document.getElementById('analytics-loading').classList.remove('hidden');
    document.getElementById('analytics-dashboard').classList.add('hidden');
    document.getElementById('analytics-empty').classList.add('hidden');
    document.getElementById('analytics-error').classList.add('hidden');

    try {
        const [overview, trends, roads, daily, dist, accuracy, insights] = await Promise.all([
            fetch(`/api/analytics/overview?days=${days}`).then(r => r.json()),
            fetch(`/api/analytics/trends?days=${days}`).then(r => r.json()),
            fetch(`/api/analytics/roads?days=${days}`).then(r => r.json()),
            fetch(`/api/analytics/daily?days=${days}`).then(r => r.json()),
            fetch(`/api/analytics/distribution?days=${days}`).then(r => r.json()),
            fetch(`/api/analytics/accuracy`).then(r => r.json()), // accuracy often independent of date in our demo
            fetch(`/api/analytics/insights?days=${days}`).then(r => r.json())
        ]);

        if (!overview.success || !trends.success) throw new Error("API failure");
        
        if (!overview.data) {
            document.getElementById('analytics-loading').classList.add('hidden');
            document.getElementById('analytics-empty').classList.remove('hidden');
            return;
        }

        renderOverview(overview.data);
        renderTrendChart(trends.data);
        renderHourlyChart(trends.data);
        renderDailyChart(daily.data);
        renderDistributionChart(dist.data);
        renderAccuracyChart(accuracy.data);
        
        currentRoadData = roads.data;
        populateRoadFilter(currentRoadData);
        renderRoadTable(currentRoadData);
        renderHotspots(currentRoadData);
        renderInsights(insights.data);

        document.getElementById('analytics-loading').classList.add('hidden');
        document.getElementById('analytics-dashboard').classList.remove('hidden');
    } catch (e) {
        console.error("Analytics Error:", e);
        document.getElementById('analytics-loading').classList.add('hidden');
        document.getElementById('analytics-error').classList.remove('hidden');
    }
}

function renderOverview(data) {
    document.getElementById('kpi-score').textContent = `${data.averageTrafficScore} / 100`;
    document.getElementById('kpi-peak').textContent = data.peakHour;
    document.getElementById('kpi-delay').textContent = `+${data.averageDelayMinutes} min`;
    document.getElementById('kpi-congested').textContent = data.mostCongestedRoad;
}

function createChart(ctxId, config) {
    if (charts[ctxId]) {
        charts[ctxId].destroy();
    }
    const ctx = document.getElementById(ctxId);
    if (!ctx) return;
    charts[ctxId] = new Chart(ctx, config);
}

function renderTrendChart(data) {
    const labels = data.map(d => d.time);
    const scores = data.map(d => d.score);
    
    createChart('trend-chart', {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Historical Average',
                data: scores,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { min: 0, max: 100 } }
        }
    });
}

function renderHourlyChart(data) {
    const labels = data.map(d => d.time);
    const scores = data.map(d => d.score);
    
    createChart('hourly-chart', {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Avg Score',
                data: scores,
                backgroundColor: scores.map(s => s > 75 ? '#ef4444' : (s > 50 ? '#f59e0b' : '#3b82f6')),
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { min: 0, max: 100 } },
            plugins: { legend: { display: false } }
        }
    });
}

function renderDailyChart(data) {
    createChart('daily-chart', {
        type: 'bar',
        data: {
            labels: data.map(d => d.day),
            datasets: [{
                label: 'Traffic Score',
                data: data.map(d => d.score),
                backgroundColor: '#10b981',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { min: 0, max: 100 } }
        }
    });
}

function renderDistributionChart(data) {
    createChart('distribution-chart', {
        type: 'doughnut',
        data: {
            labels: ['Low', 'Moderate', 'High', 'Severe'],
            datasets: [{
                data: [data.Low, data.Moderate, data.High, data.Severe],
                backgroundColor: ['#10b981', '#f59e0b', '#f97316', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: { legend: { position: 'right' } }
        }
    });
}

function renderAccuracyChart(data) {
    if (!data.chart || data.chart.length === 0) {
        document.getElementById('accuracy-msg').classList.remove('hidden');
        document.getElementById('accuracy-chart').classList.add('hidden');
        return;
    }
    
    document.getElementById('accuracy-msg').classList.add('hidden');
    document.getElementById('accuracy-chart').classList.remove('hidden');
    
    document.getElementById('acc-mae').textContent = data.mae;
    document.getElementById('acc-rmse').textContent = data.rmse;
    
    createChart('accuracy-chart', {
        type: 'line',
        data: {
            labels: data.chart.map(d => d.time),
            datasets: [
                {
                    label: 'Predicted',
                    data: data.chart.map(d => d.predicted),
                    borderColor: '#3b82f6',
                    borderDash: [5, 5],
                    tension: 0.1
                },
                {
                    label: 'Actual',
                    data: data.chart.map(d => d.actual),
                    borderColor: '#10b981',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { min: 0, max: 100 } }
        }
    });
}

function renderRoadTable(data) {
    const tbody = document.getElementById('road-table-body');
    tbody.innerHTML = '';
    
    data.forEach(r => {
        const tr = document.createElement('tr');
        const statusClass = `status-${r.status.toLowerCase()}`;
        
        tr.innerHTML = `
            <td><strong>${r.road}</strong></td>
            <td>${r.score}</td>
            <td>${r.speed} km/h</td>
            <td>+${r.delay} min</td>
            <td><span class="status-badge ${statusClass}">${r.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function populateRoadFilter(data) {
    const filter = document.getElementById('road-filter');
    // keep only 'All Roads' option initially
    filter.innerHTML = '<option value="all">All Roads</option>';
    
    const uniqueRoads = [...new Set(data.map(d => d.road))].sort();
    uniqueRoads.forEach(road => {
        const option = document.createElement('option');
        option.value = road;
        option.textContent = road;
        filter.appendChild(option);
    });
}

function filterRoadTable() {
    const query = document.getElementById('road-search').value.toLowerCase();
    const selectedRoad = document.getElementById('road-filter').value;
    
    const filtered = currentRoadData.filter(r => {
        const matchesQuery = r.road.toLowerCase().includes(query);
        const matchesDropdown = selectedRoad === 'all' || r.road === selectedRoad;
        return matchesQuery && matchesDropdown;
    });
    renderRoadTable(filtered);
}

function renderHotspots(data) {
    const sorted = [...data].sort((a, b) => b.score - a.score).slice(0, 5);
    const container = document.getElementById('hotspots-list');
    container.innerHTML = '';
    
    sorted.forEach((r, idx) => {
        const el = document.createElement('div');
        el.className = 'hotspot-item';
        el.innerHTML = `
            <div class="hotspot-info">
                <span class="hotspot-name">${idx + 1}. ${r.road}</span>
                <span class="hotspot-score">Traffic Score: ${r.score}</span>
            </div>
            <a href="index.html?road=${encodeURIComponent(r.road)}" class="hotspot-link">View on Map</a>
        `;
        container.appendChild(el);
    });
}

function renderInsights(data) {
    const list = document.getElementById('insights-list');
    list.innerHTML = '';
    data.forEach(ins => {
        const li = document.createElement('li');
        li.textContent = ins;
        list.appendChild(li);
    });
}

function exportReport() {
    if (!currentRoadData || currentRoadData.length === 0) return;
    
    const headers = ["Road", "Traffic Score", "Average Speed", "Delay", "Traffic Level"];
    const rows = currentRoadData.map(r => [
        `"${r.road}"`, r.score, r.speed, r.delay, r.status
    ]);
    
    const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `traffic_analytics_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
