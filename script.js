const modelFiles = {
    'catboost': 'iclr2026_catboost_predictions.csv',
    'tabpfn': 'iclr2026_tabpfn_predictions.csv',
    'dtree': 'iclr2026_decision_tree_predictions.csv',
    'logreg': 'iclr2026_logistic_regression_predictions.csv'
};

const metricsFiles = {
    'catboost': 'iclr2026_validation_catboost.json',
    'tabpfn': 'iclr2026_validation_tabpfn.json',
    'dtree': 'iclr2026_validation_decision_tree.json',
    'logreg': 'iclr2026_validation_logistic_regression.json'
};

// Global data storage
let predictionsData = [];
// Current selected model (default: catboost)
let currentModel = 'catboost';
let currentMetrics = null;

let stats = {
    total: 0,
    accept: 0,
    reject: 0,
    oral: 0,
    spotlight: 0,
    poster: 0
};

// Load CSV data
async function loadPredictions() {
    const statusEl = document.getElementById('searchStatus');
    statusEl.textContent = `Loading ${currentModel} database...`;
    statusEl.style.color = 'var(--text-secondary)';

    const filename = modelFiles[currentModel];


    try {
        const [predResponse, metricsResponse] = await Promise.all([
            fetch(`Archiv/iclr/${filename}`),
            fetch(`Archiv/metrics/${metricsFiles[currentModel]}`)
        ]);

        if (!predResponse.ok) {
            throw new Error(`Failed to load predictions file: ${filename}`);
        }

        const csvText = await predResponse.text();
        predictionsData = parseCSV(csvText);

        if (metricsResponse.ok) {
            currentMetrics = await metricsResponse.json();
        } else {
            console.warn('Metrics file not found, using default/placeholder');
            currentMetrics = null;
        }

        // Calculate statistics
        calculateStats();
        updateStatsDisplay();
        updateDistributionChart();

        // Update metrics display with new data
        displayModelMetrics(currentModel);

        statusEl.textContent = `Loaded ${predictionsData.length} predictions. Ready to search!`;
        statusEl.style.color = 'var(--success-color)';
    } catch (error) {
        console.error('Error loading data:', error);
        statusEl.textContent = `Error loading data for ${currentModel}`;
        statusEl.style.color = 'var(--danger-color)';
        predictionsData = [];
        updateStatsDisplay();
        updateDistributionChart();
    }
}

// Simple CSV parser
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = values[index]?.trim() || '';
            });
            data.push(row);
        }
    }

    return data;
}

// Parse CSV line handling quoted values
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);

    return result;
}

// Calculate statistics based on current Model
function calculateStats() {
    // Reset stats
    stats.total = 0;
    stats.accept = 0;
    stats.reject = 0;
    stats.oral = 0;
    stats.spotlight = 0;
    stats.poster = 0;

    // Only 'catboost' has data in the current CSV
    // if (currentModel !== 'catboost') {
    //    return; // Stats remain 0
    // }

    stats.total = predictionsData.length;
    predictionsData.forEach(row => {
        const status = row.pred_status?.toLowerCase();
        if (status === 'reject') {
            stats.reject++;
        } else {
            stats.accept++;
            if (status === 'oral') stats.oral++;
            else if (status === 'spotlight') stats.spotlight++;
            else if (status === 'poster') stats.poster++;
        }
    });
}

// Update statistics display
function updateStatsDisplay() {
    document.getElementById('totalPredictions').textContent = stats.total.toLocaleString();

    const acceptRate = stats.total > 0 ? ((stats.accept / stats.total) * 100).toFixed(1) : '0.0';
    const rejectRate = stats.total > 0 ? ((stats.reject / stats.total) * 100).toFixed(1) : '0.0';

    document.getElementById('acceptRate').textContent = `${acceptRate}%`;
    document.getElementById('rejectRate').textContent = `${rejectRate}%`;
}

// Search functionality
function setupSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim().toUpperCase();
    const statusEl = document.getElementById('searchStatus');
    const resultsContainer = document.getElementById('resultsContainer');

    /*
    if (currentModel !== 'catboost') {
        statusEl.textContent = `No predictions available for ${currentModel} yet.`;
        statusEl.style.color = 'var(--warning)';
        resultsContainer.style.display = 'none';
        return;
    }
    */

    if (!query) {
        statusEl.textContent = 'Please enter a submission ID';
        statusEl.style.color = 'var(--warning)';
        return;
    }

    if (predictionsData.length === 0) {
        statusEl.textContent = 'Data not loaded yet. Please wait...';
        statusEl.style.color = 'var(--warning)';
        return;
    }

    statusEl.textContent = 'Searching...';
    statusEl.style.color = 'var(--text-secondary)';

    // Search for matching ID
    const result = predictionsData.find(row =>
        row.id?.toUpperCase() === query
    );

    if (result) {
        displayResult(result);
        resultsContainer.style.display = 'block';
        statusEl.textContent = 'Found!';
        statusEl.style.color = 'var(--success)';
    } else {
        resultsContainer.style.display = 'none';
        statusEl.textContent = `No prediction found for ID: ${query}`;
        statusEl.style.color = 'var(--danger)';
    }
}

// Display search result
function displayResult(row) {
    const resultContent = document.getElementById('resultContent');
    const status = row.pred_status?.toLowerCase() || 'unknown';

    const probaOral = parseFloat(row.proba_oral || 0) * 100;
    const probaSpotlight = parseFloat(row.proba_spotlight || 0) * 100;
    const probaPoster = parseFloat(row.proba_poster || 0) * 100;
    const probaReject = parseFloat(row.proba_reject || 0) * 100;

    const statusLabels = {
        'oral': 'Oral',
        'spotlight': 'Spotlight',
        'poster': 'Poster',
        'reject': 'Rejected'
    };

    const statusLabel = statusLabels[status] || status;

    resultContent.innerHTML = `
        <div class="prediction-result">
            <div class="prediction-item ${status}">
                <div class="prediction-label">Predicted Status</div>
                <div class="prediction-proba">${statusLabel}</div>
            </div>
        </div>
        
        <div class="probability-bars">
            <h4 style="margin-bottom: 1rem;">Prediction Probabilities</h4>
            ${createProbabilityBar('Oral', probaOral, 'oral')}
            ${createProbabilityBar('Spotlight', probaSpotlight, 'spotlight')}
            ${createProbabilityBar('Poster', probaPoster, 'poster')}
            ${createProbabilityBar('Reject', probaReject, 'reject')}
        </div>
        
        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
            <p><strong>Paper ID:</strong> ${row.id}</p>
            <p style="margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">
                Note: This prediction is based on tabular features from review scores and metadata.
            </p>
        </div>
    `;
}

function createProbabilityBar(label, value, className) {
    return `
        <div class="prob-bar">
            <div class="prob-bar-label">${label}</div>
            <div class="prob-bar-container">
                <div class="prob-bar-fill ${className}" style="width: ${value}%">
                    ${value >= 5 ? value.toFixed(1) + '%' : ''}
                </div>
            </div>
            <div style="min-width: 50px; text-align: right; font-weight: 600;">
                ${value.toFixed(1)}%
            </div>
        </div>
    `;
}

// Update distribution chart
function updateDistributionChart() {
    const canvas = document.getElementById('distributionCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = 300;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (stats.total === 0) {
        // Draw "No Data" message
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.textAlign = 'center';
        ctx.fillText(`No data available for ${currentModel}`, width / 2, height / 2);
        return;
    }

    // Get current theme for text color
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#f9fafb' : '#1f2937';

    // Updated colors - Vibrant Premium Palette
    const categories = [
        { label: 'Oral', count: stats.oral, color: '#5856D6' },      // Indigo (Premium)
        { label: 'Spotlight', count: stats.spotlight, color: '#007AFF' }, // Blue (High)
        { label: 'Poster', count: stats.poster, color: '#32D74B' },    // Green (Success)
        { label: 'Reject', count: stats.reject, color: '#FF2D55' }     // Pink Red (Fail)
    ];

    const barWidth = width / categories.length * 0.8;
    const barSpacing = width / categories.length * 0.2;
    const maxCount = Math.max(...categories.map(c => c.count));
    const chartHeight = height - 80;

    categories.forEach((cat, index) => {
        const x = index * (barWidth + barSpacing) + barSpacing / 2;
        const barHeight = (cat.count / maxCount) * chartHeight;
        const y = height - 40 - barHeight;

        // Draw bar
        ctx.fillStyle = cat.color;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Draw label
        ctx.fillStyle = textColor;
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.textAlign = 'center';
        ctx.fillText(cat.label, x + barWidth / 2, height - 20);

        // Draw count
        ctx.fillText(cat.count.toLocaleString(), x + barWidth / 2, y - 5);
    });
}

function setupModelSelector() {
    const selector = document.getElementById('modelSelector');
    if (!selector) return;

    selector.addEventListener('change', (e) => {
        currentModel = e.target.value;
        // Recalculate and update everything
        // Load new data for the selected model
        loadPredictions();
        // calculateStats(); -> Called inside loadPredictions
        // updateStatsDisplay(); -> Called inside loadPredictions
        // updateDistributionChart(); -> Called inside loadPredictions

        // Also update the tabs if they exist (sync)
        const tabs = document.querySelectorAll('.model-tab');
        tabs.forEach(tab => {
            if (tab.dataset.model === currentModel) {
                tab.click();
            }
        });

        // Clear previous search results if switching models
        const resultsContainer = document.getElementById('resultsContainer');
        const statusEl = document.getElementById('searchStatus');
        if (resultsContainer) resultsContainer.style.display = 'none';
        if (statusEl) statusEl.textContent = 'Ready to search...';
    });
}

// Model tabs functionality
function setupModelTabs() {
    const tabs = document.querySelectorAll('.model-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');

            // Sync with selector if possible
            const selector = document.getElementById('modelSelector');
            if (selector && selector.value !== tab.dataset.model) {
                selector.value = tab.dataset.model;
                // Dispatch change event to trigger update
                selector.dispatchEvent(new Event('change'));
            }

            // Update metrics display
            const modelName = tab.dataset.model;
            displayModelMetrics(modelName);
        });
    });

    // Display default model (CatBoost)
    if (tabs.length > 0) {
        displayModelMetrics('catboost');
    }
}

function displayModelMetrics(modelName) {
    const metricsContainer = document.getElementById('modelMetrics');

    const modelInfo = {
        'catboost': {
            name: 'CatBoost',
            description: 'Gradient boosting with categorical feature handling',
        },
        'tabpfn': {
            name: 'TabPFN',
            description: 'Prior-data Fitted Networks for tabular data',
        },
        'logreg': {
            name: 'Logistic Regression',
            description: 'Linear baseline model',
        },
        'dtree': {
            name: 'Decision Tree',
            description: 'Non-parametric decision tree model',
        }
    };

    const info = modelInfo[modelName] || modelInfo['catboost'];

    // Default metrics if not loaded
    let metricsToShow = {
        'Status': 'Pending Integration',
        'Note': 'Predictions coming soon'
    };

    // Use loaded metrics if available
    if (currentMetrics && modelFiles[modelName]) {
        // Format the metrics from the JSON
        metricsToShow = {};
        for (const [key, value] of Object.entries(currentMetrics)) {
            // Filter out 'model' key if redundant or format it
            if (key !== 'model' && key !== 'split') {
                // Format key (e.g., macro_f1 -> Macro F1)
                const formattedKey = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                // Format value (round numbers)
                const formattedValue = typeof value === 'number' ? value.toFixed(4) : value;
                metricsToShow[formattedKey] = formattedValue;
            }
        }
    }

    let html = `
        <h4>${info.name}</h4>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${info.description}</p>
        <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
    `;

    for (const [metric, value] of Object.entries(metricsToShow)) {
        html += `
            <div style="background: var(--bg-card); padding: 1rem; border-radius: 12px; border: var(--glass-border);">
                <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.25rem;">${metric}</div>
                <div style="font-weight: 600;">${value}</div>
            </div>
        `;
    }

    html += `</div>`;

    metricsContainer.innerHTML = html;
}

// Smooth scroll for navigation links
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Theme management
function initTheme() {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    let theme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(theme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');

    if (theme === 'dark') {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark';
    }

    // Update chart when theme changes
    updateDistributionChart();
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    // Setup theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    loadPredictions();
    setupSearch();
    setupModelSelector();
    setupModelTabs();
    setupSmoothScroll();

    // Update chart on window resize
    window.addEventListener('resize', () => {
        updateDistributionChart();
    });
});
