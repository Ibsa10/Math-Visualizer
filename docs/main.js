
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const section = item.dataset.section;
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        item.classList.add('active');
        document.getElementById(section).classList.add('active');
        document.getElementById('pageTitle').textContent = item.querySelector('.nav-label').textContent;
        // Auto-run section
        if (section === 'trigonometry') updateTrig();
        if (section === 'statistics') analyzeStats();
        if (section === 'function-plotter') plotFunction();
        if (section === 'geometry') drawGeometry();
        if (section === 'calculus') renderCalculus();
    });
});

// Sidebar toggle
document.getElementById('sidebarToggle').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-collapsed');
});

// Theme toggle
let darkMode = true;
document.getElementById('themeToggle').addEventListener('click', () => {
    darkMode = !darkMode;
    document.body.setAttribute('data-theme', darkMode ? '' : 'light');
    document.getElementById('themeToggle').textContent = darkMode ? '🌙' : '☀️';
    // Redraw active section
    const active = document.querySelector('.section.active');
    if (active) {
        const id = active.id;
        if (id === 'function-plotter') plotFunction();
        if (id === 'statistics') analyzeStats();
        if (id === 'geometry') drawGeometry();
        if (id === 'calculus') renderCalculus();
        if (id === 'trigonometry') updateTrig();
    }
});

// ===== HELPERS =====
function getStyle(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

function getCSSVar(name) {
    return getComputedStyle(document.querySelector('body')).getPropertyValue(name).trim() ||
           (darkMode ? {
               '--accent': '#6c63ff', '--accent2': '#ff6584', '--accent3': '#43e97b',
               '--accent4': '#f7c948', '--bg-secondary': '#1a1d27', '--text-muted': '#5a6080',
               '--text-secondary': '#9096b4'
           }[name] : {
               '--accent': '#6c63ff', '--accent2': '#ff6584', '--accent3': '#26c96f',
               '--accent4': '#e6a800', '--bg-secondary': '#e4e8fa', '--text-muted': '#8890b4',
               '--text-secondary': '#4a5080'
           }[name]);
}

function resizeCanvas(canvas) {
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = Math.min(canvas.getAttribute('width'), rect.width - 40);
    canvas.style.width = w + 'px';
}

// ===== FUNCTION PLOTTER =====
let chartType = 'bar';

function setPreset(fn) {
    document.getElementById('funcInput').value = fn;
    plotFunction();
}

function plotFunction() {
    const canvas = document.getElementById('functionCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const funcStr = document.getElementById('funcInput').value.trim();
    const funcStr2 = document.getElementById('funcInput2').value.trim();
    const xMin = parseFloat(document.getElementById('xMin').value);
    const xMax = parseFloat(document.getElementById('xMax').value);
    const yMin = parseFloat(document.getElementById('yMin').value);
    const yMax = parseFloat(document.getElementById('yMax').value);

    // Background
    ctx.fillStyle = darkMode ? '#0f1117' : '#f8f9ff';
    ctx.fillRect(0, 0, W, H);

    const toCanvasX = x => ((x - xMin) / (xMax - xMin)) * W;
    const toCanvasY = y => H - ((y - yMin) / (yMax - yMin)) * H;
    const fromCanvasX = cx => (cx / W) * (xMax - xMin) + xMin;

    // Draw grid
    drawGrid(ctx, W, H, xMin, xMax, yMin, yMax, toCanvasX, toCanvasY);

    // Draw axes
    drawAxes(ctx, W, H, xMin, xMax, yMin, yMax, toCanvasX, toCanvasY);

    // Draw function 1
    try {
        const fn = math.compile(funcStr);
        drawCurve(ctx, fn, W, xMin, xMax, yMin, yMax, toCanvasX, toCanvasY, '#6c63ff', 2.5);
    } catch(e) {
        showError(ctx, 'Error: ' + e.message);
    }

    // Draw function 2
    if (funcStr2) {
        try {
            const fn2 = math.compile(funcStr2);
            drawCurve(ctx, fn2, W, xMin, xMax, yMin, yMax, toCanvasX, toCanvasY, '#ff6584', 2.5);
        } catch(e) {}
    }

    // Hover tooltip
    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = W / rect.width;
        const cx = (e.clientX - rect.left) * scaleX;
        const x = fromCanvasX(cx);
        try {
            const fn = math.compile(funcStr);
            const y = fn.evaluate({ x });
            const displayCx = e.clientX, displayCy = e.clientY;
            removeTooltip();
            const tip = document.createElement('div');
            tip.className = 'tooltip';
            tip.textContent = `x = ${x.toFixed(3)},  f(x) = ${isFinite(y) ? y.toFixed(4) : 'undefined'}`;
            tip.style.left = (displayCx + 12) + 'px';
            tip.style.top = (displayCy - 30) + 'px';
            tip.id = 'funcTooltip';
            document.body.appendChild(tip);
        } catch(e) {}
    };
    canvas.onmouseleave = removeTooltip;
}

function removeTooltip() {
    const t = document.getElementById('funcTooltip');
    if (t) t.remove();
}

function drawGrid(ctx, W, H, xMin, xMax, yMin, yMax, toX, toY) {
    ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
    ctx.lineWidth = 1;
    const xStep = nice((xMax - xMin) / 10);
    const yStep = nice((yMax - yMin) / 8);
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
        ctx.beginPath(); ctx.moveTo(toX(x), 0); ctx.lineTo(toX(x), H); ctx.stroke();
    }
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
        ctx.beginPath(); ctx.moveTo(0, toY(y)); ctx.lineTo(W, toY(y)); ctx.stroke();
    }
}

function drawAxes(ctx, W, H, xMin, xMax, yMin, yMax, toX, toY) {
    ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    // X axis
    if (yMin <= 0 && yMax >= 0) {
        ctx.beginPath(); ctx.moveTo(0, toY(0)); ctx.lineTo(W, toY(0)); ctx.stroke();
    }
    // Y axis
    if (xMin <= 0 && xMax >= 0) {
        ctx.beginPath(); ctx.moveTo(toX(0), 0); ctx.lineTo(toX(0), H); ctx.stroke();
    }
    // Labels
    ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    ctx.font = '11px JetBrains Mono, monospace';
    const xStep = nice((xMax - xMin) / 10);
    const yStep = nice((yMax - yMin) / 8);
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
        if (Math.abs(x) < xStep * 0.01) continue;
        const cx = toX(x), cy = yMin <= 0 && yMax >= 0 ? toY(0) + 14 : H - 6;
        ctx.fillText(x % 1 === 0 ? x : x.toFixed(1), cx - 10, cy);
    }
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
        if (Math.abs(y) < yStep * 0.01) continue;
        const cx = xMin <= 0 && xMax >= 0 ? toX(0) + 4 : 4;
        ctx.fillText(y % 1 === 0 ? y : y.toFixed(1), cx, toY(y) + 4);
    }
}

function drawCurve(ctx, fn, W, xMin, xMax, yMin, yMax, toX, toY, color, lineWidth) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    let penDown = false;
    const steps = W * 2;
    for (let i = 0; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin);
        try {
            const y = fn.evaluate({ x });
            if (!isFinite(y) || Math.abs(y) > (yMax - yMin) * 10) { penDown = false; continue; }
            const cx = toX(x), cy = toY(y);
            if (!penDown) { ctx.moveTo(cx, cy); penDown = true; }
            else ctx.lineTo(cx, cy);
        } catch(e) { penDown = false; }
    }
    ctx.stroke();
}

function showError(ctx, msg) {
    ctx.fillStyle = '#ff6584';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(msg, 20, 40);
}

function nice(range) {
    const p = Math.pow(10, Math.floor(Math.log10(range)));
    const frac = range / p;
    if (frac < 1.5) return p;
    if (frac < 3) return 2 * p;
    if (frac < 7) return 5 * p;
    return 10 * p;
}

// ===== GEOMETRY =====
function updateGeometryInputs() {
    const shape = document.getElementById('shapeSelect').value;
    const g1 = document.getElementById('geometryInputs');
    const g2 = document.getElementById('geometryInputs2');
    const g3 = document.getElementById('geometryInputs3');
    const l1 = g1.querySelector('label');
    const l2 = document.getElementById('geoLabel2');
    const l3 = document.getElementById('geoLabel3');

    g2.style.display = 'none'; g3.style.display = 'none';
    if (shape === 'circle') { l1.textContent = 'Radius'; }
    else if (shape === 'rectangle') {
        l1.textContent = 'Width'; g2.style.display = 'flex'; l2.textContent = 'Height';
    } else if (shape === 'triangle') {
        l1.textContent = 'Base'; g2.style.display = 'flex'; l2.textContent = 'Height';
    } else if (shape === 'polygon') {
        l1.textContent = 'Radius'; g3.style.display = 'flex'; l3.textContent = 'Sides';
    } else if (shape === 'ellipse') {
        l1.textContent = 'Semi-a (width)'; g2.style.display = 'flex'; l2.textContent = 'Semi-b (height)';
    }
}

function drawGeometry() {
    const canvas = document.getElementById('geometryCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = darkMode ? '#0f1117' : '#f8f9ff';
    ctx.fillRect(0, 0, W, H);

    const shape = document.getElementById('shapeSelect').value;
    const p1 = parseFloat(document.getElementById('geoParam1').value) || 100;
    const p2 = parseFloat(document.getElementById('geoParam2').value) || 80;
    const p3 = parseInt(document.getElementById('geoParam3').value) || 6;
    const cx = W / 2, cy = H / 2;
    let area = 0, perimeter = 0, extra = '';

    ctx.strokeStyle = '#6c63ff';
    ctx.fillStyle = 'rgba(108,99,255,0.15)';
    ctx.lineWidth = 2.5;

    if (shape === 'circle') {
        const r = Math.min(p1, cx - 20, cy - 20);
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        area = Math.PI * p1 * p1;
        perimeter = 2 * Math.PI * p1;
        extra = `Diameter: ${(2 * p1).toFixed(2)}`;
        // Labels
        ctx.strokeStyle = '#43e97b'; ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#43e97b'; ctx.font = '12px JetBrains Mono,monospace';
        ctx.fillText('r = ' + p1, cx + r/2 - 15, cy - 6);
    } else if (shape === 'rectangle') {
        const hw = Math.min(p1, cx - 20), hh = Math.min(p2, cy - 20);
        ctx.beginPath(); ctx.rect(cx - hw, cy - hh, hw * 2, hh * 2);
        ctx.fill(); ctx.stroke();
        area = (2 * p1) * (2 * p2);
        perimeter = 4 * p1 + 4 * p2;
        extra = `Width: ${2*p1}, Height: ${2*p2}`;
        ctx.fillStyle = '#f7c948'; ctx.font = '11px JetBrains Mono,monospace';
        ctx.fillText(2*p1, cx - 10, cy + hh + 16);
        ctx.fillText(2*p2, cx + hw + 6, cy);
    } else if (shape === 'triangle') {
        const base = Math.min(p1 * 2, W - 40), height = Math.min(p2 * 2, H - 40);
        const x1 = cx - base/2, y1 = cy + height/2;
        const x2 = cx + base/2, y2 = cy + height/2;
        const x3 = cx, y3 = cy - height/2;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath();
        ctx.fill(); ctx.stroke();
        const side = Math.sqrt((base/2)**2 + height**2);
        area = 0.5 * base * height;
        perimeter = base + 2 * side;
        extra = `Base: ${base.toFixed(0)}, Height: ${height.toFixed(0)}`;
    } else if (shape === 'polygon') {
        const r = Math.min(p1, cx - 20, cy - 20);
        ctx.beginPath();
        for (let i = 0; i < p3; i++) {
            const angle = (i / p3) * 2 * Math.PI - Math.PI / 2;
            const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        const sideLen = 2 * p1 * Math.sin(Math.PI / p3);
        area = 0.5 * p3 * p1 * p1 * Math.sin(2 * Math.PI / p3);
        perimeter = p3 * sideLen;
        extra = `Sides: ${p3}, Side Length: ${sideLen.toFixed(2)}`;
    } else if (shape === 'ellipse') {
        const ra = Math.min(p1, cx - 20), rb = Math.min(p2, cy - 20);
        ctx.beginPath(); ctx.ellipse(cx, cy, ra, rb, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        area = Math.PI * p1 * p2;
        const h = ((p1 - p2) / (p1 + p2)) ** 2;
        perimeter = Math.PI * (p1 + p2) * (1 + 3 * h / (10 + Math.sqrt(4 - 3 * h)));
        extra = `Semi-a: ${p1}, Semi-b: ${p2}`;
    }

    document.getElementById('geoResults').innerHTML = `
        <div class="stat-row"><span class="stat-label">Area</span><span class="stat-value highlight">${area.toFixed(4)}</span></div>
        <div class="stat-row"><span class="stat-label">Perimeter</span><span class="stat-value highlight">${perimeter.toFixed(4)}</span></div>
        <div class="stat-row"><span class="stat-label">${extra.split(':')[0]}</span><span class="stat-value">${extra.split(':').slice(1).join(':')}</span></div>
    `;
}

// ===== STATISTICS =====
function setChartType(type) {
    chartType = type;
    document.querySelectorAll('#barBtn,#lineBtn,#histBtn').forEach(b => b.classList.remove('active-btn'));
    document.getElementById(type.replace('histogram','hist') + 'Btn') && 
        document.getElementById(type.replace('histogram','hist') + 'Btn').classList.add('active-btn');
    analyzeStats();
}

function analyzeStats() {
    const raw = document.getElementById('statsData').value;
    const data = raw.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    if (data.length === 0) return;

    const sorted = [...data].sort((a, b) => a - b);
    const n = data.length;
    const mean = data.reduce((a, b) => a + b, 0) / n;
    const variance = data.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const std = Math.sqrt(variance);
    const median = n % 2 === 0 ? (sorted[n/2-1] + sorted[n/2]) / 2 : sorted[Math.floor(n/2)];
    const min = sorted[0], max = sorted[n-1];
    const range = max - min;
    const q1 = sorted[Math.floor(n/4)], q3 = sorted[Math.floor(3*n/4)];

    // Mode
    const freq = {};
    data.forEach(x => freq[x] = (freq[x] || 0) + 1);
    const maxFreq = Math.max(...Object.values(freq));
    const mode = Object.keys(freq).filter(k => freq[k] === maxFreq).join(', ');

    document.getElementById('statsResults').innerHTML = `
        <div class="stat-row"><span class="stat-label">Count (n)</span><span class="stat-value">${n}</span></div>
        <div class="stat-row"><span class="stat-label">Mean</span><span class="stat-value highlight">${mean.toFixed(4)}</span></div>
        <div class="stat-row"><span class="stat-label">Median</span><span class="stat-value">${median.toFixed(4)}</span></div>
        <div class="stat-row"><span class="stat-label">Mode</span><span class="stat-value">${mode}</span></div>
        <div class="stat-row"><span class="stat-label">Std Dev</span><span class="stat-value highlight">${std.toFixed(4)}</span></div>
        <div class="stat-row"><span class="stat-label">Variance</span><span class="stat-value">${variance.toFixed(4)}</span></div>
        <div class="stat-row"><span class="stat-label">Min</span><span class="stat-value">${min}</span></div>
        <div class="stat-row"><span class="stat-label">Max</span><span class="stat-value">${max}</span></div>
        <div class="stat-row"><span class="stat-label">Range</span><span class="stat-value">${range}</span></div>
        <div class="stat-row"><span class="stat-label">Q1 / Q3</span><span class="stat-value">${q1} / ${q3}</span></div>
    `;

    const canvas = document.getElementById('statsCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = darkMode ? '#0f1117' : '#f8f9ff';
    ctx.fillRect(0, 0, W, H);

    const pad = { top: 30, right: 20, bottom: 50, left: 50 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    if (chartType === 'bar' || chartType === 'line') {
        const maxVal = max * 1.1;
        const barW = plotW / data.length;

        // Y axis ticks
        ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
        ctx.font = '10px JetBrains Mono,monospace';
        ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
        for (let i = 0; i <= 5; i++) {
            const val = (maxVal / 5) * i;
            const y = pad.top + plotH - (val / maxVal) * plotH;
            ctx.fillText(val.toFixed(0), 2, y + 4);
            ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
        }

        if (chartType === 'bar') {
            data.forEach((val, i) => {
                const x = pad.left + i * barW;
                const barH = (val / maxVal) * plotH;
                const grd = ctx.createLinearGradient(0, pad.top + plotH - barH, 0, pad.top + plotH);
                grd.addColorStop(0, '#6c63ff');
                grd.addColorStop(1, 'rgba(108,99,255,0.3)');
                ctx.fillStyle = grd;
                ctx.fillRect(x + 2, pad.top + plotH - barH, barW - 4, barH);
                // Label
                ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
                ctx.font = '9px JetBrains Mono,monospace';
                ctx.fillText(val, x + barW/2 - 5, pad.top + plotH + 14);
            });
        } else {
            ctx.strokeStyle = '#6c63ff'; ctx.lineWidth = 2.5; ctx.beginPath();
            data.forEach((val, i) => {
                const x = pad.left + (i + 0.5) * barW;
                const y = pad.top + plotH - (val / maxVal) * plotH;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.stroke();
            data.forEach((val, i) => {
                const x = pad.left + (i + 0.5) * barW;
                const y = pad.top + plotH - (val / maxVal) * plotH;
                ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#ff6584'; ctx.fill();
            });
            // Mean line
            ctx.strokeStyle = '#43e97b'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 3]);
            const meanY = pad.top + plotH - (mean / maxVal) * plotH;
            ctx.beginPath(); ctx.moveTo(pad.left, meanY); ctx.lineTo(W - pad.right, meanY); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#43e97b'; ctx.font = '10px JetBrains Mono,monospace';
            ctx.fillText('mean', W - pad.right - 38, meanY - 4);
        }
    } else if (chartType === 'histogram') {
        const bins = Math.max(5, Math.ceil(Math.sqrt(n)));
        const binWidth = range / bins;
        const binCounts = Array(bins).fill(0);
        data.forEach(x => {
            let b = Math.floor((x - min) / binWidth);
            if (b === bins) b = bins - 1;
            binCounts[b]++;
        });
        const maxCount = Math.max(...binCounts);
        const bw = plotW / bins;
        binCounts.forEach((count, i) => {
            const x = pad.left + i * bw;
            const bh = (count / maxCount) * plotH;
            const grd = ctx.createLinearGradient(0, pad.top + plotH - bh, 0, pad.top + plotH);
            grd.addColorStop(0, '#43e97b');
            grd.addColorStop(1, 'rgba(67,233,123,0.3)');
            ctx.fillStyle = grd;
            ctx.fillRect(x + 1, pad.top + plotH - bh, bw - 2, bh);
            ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
            ctx.font = '8px JetBrains Mono,monospace';
            ctx.fillText((min + i * binWidth).toFixed(1), x, pad.top + plotH + 14);
        });
    }

    // Axes
    ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(W - pad.right, pad.top + plotH); ctx.stroke();
}

// ===== MATRIX =====
function parseMatrix(str) {
    return str.trim().split('\n').map(row =>
        row.split(',').map(n => parseFloat(n.trim()))
    );
}

function matrixOp(op) {
    const resultDiv = document.getElementById('matrixResult');
    try {
        const A = parseMatrix(document.getElementById('matrixA').value);
        const B = parseMatrix(document.getElementById('matrixB').value);
        let result, label = '';

        if (op === 'add') { result = math.add(A, B); label = 'A + B'; }
        else if (op === 'subtract') { result = math.subtract(A, B); label = 'A − B'; }
        else if (op === 'multiply') { result = math.multiply(A, B); label = 'A × B'; }
        else if (op === 'transpose') { result = math.transpose(A); label = 'Aᵀ'; }
        else if (op === 'determinant') {
            const det = math.det(A);
            resultDiv.innerHTML = `<span class="stat-label">det(A) = </span><span class="scalar-result">${typeof det === 'number' ? det.toFixed(4) : det}</span>`;
            return;
        } else if (op === 'inverse') { result = math.inv(A); label = 'A⁻¹'; }

        const arr = result.toArray ? result.toArray() : result;
        let html = `<div style="margin-bottom:8px; color:var(--accent); font-weight:600;">${label}</div>`;
        html += '<div class="matrix-display">';
        arr.forEach(row => {
            html += '<div class="matrix-row">';
            (Array.isArray(row) ? row : [row]).forEach(cell => {
                const v = typeof cell === 'object' ? math.format(cell, 4) : (typeof cell === 'number' ? cell.toFixed(4) : cell);
                html += `<span class="matrix-cell">${v}</span>`;
            });
            html += '</div>';
        });
        html += '</div>';
        resultDiv.innerHTML = html;
    } catch(e) {
        resultDiv.innerHTML = `<div class="error-msg">Error: ${e.message}</div>`;
    }
}

// ===== CALCULUS =====
document.getElementById('calcMode').addEventListener('change', () => {
    const mode = document.getElementById('calcMode').value;
    document.getElementById('riemannNDiv').style.display = mode === 'riemann' ? '' : 'none';
});

function numericalDerivative(fn, x, h = 1e-5) {
    return (fn.evaluate({ x: x + h }) - fn.evaluate({ x: x - h })) / (2 * h);
}

function renderCalculus() {
    const canvas = document.getElementById('calculusCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = darkMode ? '#0f1117' : '#f8f9ff';
    ctx.fillRect(0, 0, W, H);

    const funcStr = document.getElementById('calcFunc').value;
    const mode = document.getElementById('calcMode').value;
    const a = parseFloat(document.getElementById('lowerBound').value);
    const b = parseFloat(document.getElementById('upperBound').value);
    const n = parseInt(document.getElementById('riemannN').value) || 10;

    let fn;
    try { fn = math.compile(funcStr); } catch(e) {
        ctx.fillStyle = '#ff6584'; ctx.font = '14px Inter'; ctx.fillText('Invalid function', 20, 40);
        return;
    }

    const xMin = a - (b - a) * 0.5, xMax = b + (b - a) * 0.5;
    let yMin = -2, yMax = 2;
    for (let x = xMin; x <= xMax; x += (xMax - xMin) / 200) {
        try {
            const y = fn.evaluate({ x });
            if (isFinite(y)) { yMin = Math.min(yMin, y - 0.5); yMax = Math.max(yMax, y + 0.5); }
        } catch(e) {}
    }

    const toX = x => ((x - xMin) / (xMax - xMin)) * W;
    const toY = y => H - ((y - yMin) / (yMax - yMin)) * H;

    drawGrid(ctx, W, H, xMin, xMax, yMin, yMax, toX, toY);
    drawAxes(ctx, W, H, xMin, xMax, yMin, yMax, toX, toY);

    if (mode === 'derivative') {
        // Draw original function
        drawCurve(ctx, fn, W, xMin, xMax, yMin, yMax, toX, toY, darkMode ? 'rgba(108,99,255,0.5)' : 'rgba(108,99,255,0.4)', 1.5);
        // Draw derivative
        const derivFn = { evaluate: ({ x }) => numericalDerivative(fn, x) };
        drawCurve(ctx, derivFn, W, xMin, xMax, yMin, yMax, toX, toY, '#ff6584', 2.5);

        document.getElementById('calculusResults').innerHTML = `
            <div class="stat-row"><span class="stat-label">f(x)</span><span class="stat-value">${funcStr}</span></div>
            <div class="stat-row"><span class="stat-label">f'(x)</span><span class="stat-value" style="color:#ff6584">numerical derivative</span></div>
            <div class="stat-row"><span class="stat-label">f'(${a})</span><span class="stat-value highlight">${numericalDerivative(fn, a).toFixed(6)}</span></div>
            <div class="stat-row"><span class="stat-label">f'(${b})</span><span class="stat-value highlight">${numericalDerivative(fn, b).toFixed(6)}</span></div>
        `;
    } else if (mode === 'integral' || mode === 'riemann') {
        drawCurve(ctx, fn, W, xMin, xMax, yMin, yMax, toX, toY, '#6c63ff', 2.5);

        if (mode === 'riemann') {
            const dx = (b - a) / n;
            ctx.fillStyle = 'rgba(67,233,123,0.35)';
            ctx.strokeStyle = 'rgba(67,233,123,0.7)';
            ctx.lineWidth = 1;
            for (let i = 0; i < n; i++) {
                const xi = a + i * dx;
                const yi = fn.evaluate({ x: xi + dx / 2 }); // midpoint
                if (!isFinite(yi)) continue;
                const rx = toX(xi), rw = toX(xi + dx) - rx;
                const ry = yi >= 0 ? toY(yi) : toY(0);
                const rh = Math.abs(toY(0) - toY(yi));
                ctx.fillRect(rx, ry, rw, rh);
                ctx.strokeRect(rx, ry, rw, rh);
            }
        } else {
            // Shade area
            ctx.beginPath();
            ctx.moveTo(toX(a), toY(0));
            const steps2 = 500;
            for (let i = 0; i <= steps2; i++) {
                const x = a + (i / steps2) * (b - a);
                try { const y = fn.evaluate({ x }); if (isFinite(y)) ctx.lineTo(toX(x), toY(y)); }
                catch(e) {}
            }
            ctx.lineTo(toX(b), toY(0));
            ctx.closePath();
            ctx.fillStyle = 'rgba(108,99,255,0.25)';
            ctx.fill();
        }

        // Numerical integration (Simpson's rule)
        const integral = simpsonIntegral(fn, a, b, 1000);
        const riemannApprox = mode === 'riemann' ? riemannSum(fn, a, b, n) : null;
        document.getElementById('calculusResults').innerHTML = `
            <div class="stat-row"><span class="stat-label">∫ f(x) dx</span><span class="stat-value">[${a}, ${b}]</span></div>
            <div class="stat-row"><span class="stat-label">Result (Simpson)</span><span class="stat-value highlight">${integral.toFixed(6)}</span></div>
            ${mode === 'riemann' ? `<div class="stat-row"><span class="stat-label">Riemann (n=${n})</span><span class="stat-value">${riemannApprox.toFixed(6)}</span></div>
            <div class="stat-row"><span class="stat-label">Error</span><span class="stat-value" style="color:#ff6584">${Math.abs(integral - riemannApprox).toFixed(6)}</span></div>` : ''}
            <div class="stat-row"><span class="stat-label">f(${a})</span><span class="stat-value">${fn.evaluate({x:a}).toFixed(4)}</span></div>
            <div class="stat-row"><span class="stat-label">f(${b})</span><span class="stat-value">${fn.evaluate({x:b}).toFixed(4)}</span></div>
        `;
    }
}

function simpsonIntegral(fn, a, b, n) {
    if (n % 2 !== 0) n++;
    const h = (b - a) / n;
    let sum = fn.evaluate({ x: a }) + fn.evaluate({ x: b });
    for (let i = 1; i < n; i++) {
        const x = a + i * h;
        try { sum += (i % 2 === 0 ? 2 : 4) * fn.evaluate({ x }); } catch(e) {}
    }
    return (h / 3) * sum;
}

function riemannSum(fn, a, b, n) {
    const dx = (b - a) / n;
    let sum = 0;
    for (let i = 0; i < n; i++) {
        try { sum += fn.evaluate({ x: a + (i + 0.5) * dx }) * dx; } catch(e) {}
    }
    return sum;
}

// ===== FRACTALS =====
document.getElementById('fractalType').addEventListener('change', () => {
    const isJulia = document.getElementById('fractalType').value === 'julia';
    document.getElementById('juliaParams').style.display = isJulia ? '' : 'none';
    document.getElementById('juliaParamsImag').style.display = isJulia ? '' : 'none';
});

function renderFractal() {
    const canvas = document.getElementById('fractalCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const type = document.getElementById('fractalType').value;
    const maxIter = parseInt(document.getElementById('fractalIter').value);

    if (type === 'sierpinski') {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = darkMode ? '#0f1117' : '#f8f9ff';
        ctx.fillRect(0, 0, W, H);
        drawSierpinski(ctx, W / 2, 20, W - 20, H - 20, 20, H - 20, 7);
        return;
    }

    const imageData = ctx.createImageData(W, H);
    const juliaReal = parseFloat(document.getElementById('juliaReal').value);
    const juliaImag = parseFloat(document.getElementById('juliaImag').value);

    const palette = createPalette(maxIter);

    for (let px = 0; px < W; px++) {
        for (let py = 0; py < H; py++) {
            let zr, zi, cr, ci;
            if (type === 'mandelbrot') {
                cr = (px / W) * 3.5 - 2.5;
                ci = (py / H) * 2.0 - 1.0;
                zr = 0; zi = 0;
            } else {
                zr = (px / W) * 3.5 - 1.75;
                zi = (py / H) * 3.5 - 1.75;
                cr = juliaReal; ci = juliaImag;
            }
            let iter = 0;
            while (iter < maxIter && zr * zr + zi * zi < 4) {
                const tmp = zr * zr - zi * zi + cr;
                zi = 2 * zr * zi + ci;
                zr = tmp;
                iter++;
            }
            const idx = (py * W + px) * 4;
            if (iter === maxIter) {
                imageData.data[idx] = 0; imageData.data[idx+1] = 0; imageData.data[idx+2] = 0;
            } else {
                const t = iter / maxIter;
                const [r, g, b] = palette(t);
                imageData.data[idx] = r; imageData.data[idx+1] = g; imageData.data[idx+2] = b;
            }
            imageData.data[idx+3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

function createPalette(maxIter) {
    return (t) => {
        const r = Math.floor(9 * (1 - t) * t * t * t * 255);
        const g = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
        const b = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255);
        return [r, g, b];
    };
}

function drawSierpinski(ctx, x1, y1, x2, y2, x3, y3, depth) {
    if (depth === 0) {
        ctx.beginPath();
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.fillStyle = `hsl(${260 + Math.random() * 40}, 80%, 60%)`;
        ctx.fill();
        return;
    }
    const mx12 = (x1 + x2) / 2, my12 = (y1 + y2) / 2;
    const mx23 = (x2 + x3) / 2, my23 = (y2 + y3) / 2;
    const mx13 = (x1 + x3) / 2, my13 = (y1 + y3) / 2;
    drawSierpinski(ctx, x1, y1, mx12, my12, mx13, my13, depth - 1);
    drawSierpinski(ctx, mx12, my12, x2, y2, mx23, my23, depth - 1);
    drawSierpinski(ctx, mx13, my13, mx23, my23, x3, y3, depth - 1);
}

// ===== TRIGONOMETRY =====
let trigAnimId = null;

function updateTrig() {
    const deg = parseFloat(document.getElementById('angleSlider').value);
    document.getElementById('angleDegDisplay').textContent = deg + '°';
    const rad = deg * Math.PI / 180;
    drawUnitCircle(deg, rad);
    drawTrigWave(deg);

    const sinVal = Math.sin(rad), cosVal = Math.cos(rad), tanVal = Math.tan(rad);
    document.getElementById('trigResults').innerHTML = `
        <div class="trig-row"><span class="trig-func">sin(${deg}°)</span><span class="trig-val">${sinVal.toFixed(6)}</span></div>
        <div class="trig-row"><span class="trig-func">cos(${deg}°)</span><span class="trig-val">${cosVal.toFixed(6)}</span></div>
        <div class="trig-row"><span class="trig-func">tan(${deg}°)</span><span class="trig-val">${Math.abs(tanVal) > 1e10 ? '∞' : tanVal.toFixed(6)}</span></div>
        <div class="trig-row"><span class="trig-func">csc(${deg}°)</span><span class="trig-val">${Math.abs(sinVal) < 1e-10 ? '∞' : (1/sinVal).toFixed(6)}</span></div>
        <div class="trig-row"><span class="trig-func">sec(${deg}°)</span><span class="trig-val">${Math.abs(cosVal) < 1e-10 ? '∞' : (1/cosVal).toFixed(6)}</span></div>
        <div class="trig-row"><span class="trig-func">cot(${deg}°)</span><span class="trig-val">${Math.abs(tanVal) < 1e-10 ? '∞' : (1/tanVal).toFixed(6)}</span></div>
        <div class="trig-row"><span class="trig-func">Radians</span><span class="trig-val">${rad.toFixed(6)}</span></div>
    `;
}

function drawUnitCircle(deg, rad) {
    const canvas = document.getElementById('trigCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = darkMode ? '#0f1117' : '#f8f9ff';
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 30;

    // Grid
    ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(cx + i * r / 2, 0); ctx.lineTo(cx + i * r / 2, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, cy + i * r / 2); ctx.lineTo(W, cy + i * r / 2); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();

    // Unit circle
    ctx.strokeStyle = darkMode ? 'rgba(108,99,255,0.4)' : 'rgba(108,99,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

    const px = cx + r * Math.cos(-rad), py = cy + r * Math.sin(-rad);

    // Radius line
    ctx.strokeStyle = '#6c63ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();

    // sin projection (vertical) - green
    ctx.strokeStyle = '#43e97b'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, cy); ctx.stroke();
    ctx.setLineDash([]);

    // cos projection (horizontal) - yellow
    ctx.strokeStyle = '#f7c948'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, cy); ctx.stroke();
    ctx.setLineDash([]);

    // Point
    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6584'; ctx.fill();

    // Angle arc
    ctx.strokeStyle = '#f7c948'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, 28, 0, -rad, rad < 0); ctx.stroke();

    // Labels
    ctx.fillStyle = '#6c63ff'; ctx.font = 'bold 12px Inter';
    ctx.fillText('(cos θ, sin θ)', px + 8, py - 8);
    ctx.fillStyle = '#43e97b'; ctx.font = '11px JetBrains Mono';
    ctx.fillText('sin = ' + Math.sin(rad).toFixed(3), 8, H - 22);
    ctx.fillStyle = '#f7c948';
    ctx.fillText('cos = ' + Math.cos(rad).toFixed(3), 8, H - 8);
    ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
    ctx.font = '11px JetBrains Mono';
    ctx.fillText(deg + '°', cx + 32, cy - 4);
}

function drawTrigWave(currentDeg) {
    const canvas = document.getElementById('trigWaveCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = darkMode ? '#0f1117' : '#f8f9ff';
    ctx.fillRect(0, 0, W, H);

    const cy = H / 2;
    ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();

    // Sin wave
    ctx.strokeStyle = '#43e97b'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= W; i++) {
        const x = (i / W) * 360;
        const y = cy - Math.sin(x * Math.PI / 180) * (H/2 - 8);
        i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
    }
    ctx.stroke();

    // Cos wave
    ctx.strokeStyle = '#f7c948'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i <= W; i++) {
        const x = (i / W) * 360;
        const y = cy - Math.cos(x * Math.PI / 180) * (H/2 - 8);
        i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
    }
    ctx.stroke();

    // Current position marker
    const markerX = (currentDeg / 360) * W;
    ctx.strokeStyle = '#ff6584'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(markerX, 0); ctx.lineTo(markerX, H); ctx.stroke();
    ctx.setLineDash([]);
}

function animateTrig() {
    const btn = document.getElementById('animBtn');
    if (trigAnimId) {
        cancelAnimationFrame(trigAnimId);
        trigAnimId = null;
        btn.textContent = '▶ Animate';
        return;
    }
    btn.textContent = '⏸ Pause';
    let deg = parseFloat(document.getElementById('angleSlider').value);
    function step() {
        deg = (deg + 1) % 361;
        document.getElementById('angleSlider').value = deg;
        updateTrig();
        trigAnimId = requestAnimationFrame(step);
    }
    trigAnimId = requestAnimationFrame(step);
}

// ===== NUMBER THEORY =====
function numTheory(op) {
    const n = parseInt(document.getElementById('numInput').value);
    const n2 = parseInt(document.getElementById('numInput2').value);
    const sieveLimit = parseInt(document.getElementById('sieveLimit').value);
    const canvas = document.getElementById('numberCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    let resultHtml = '';

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = darkMode ? '#0f1117' : '#f8f9ff';
    ctx.fillRect(0, 0, W, H);

    if (op === 'factorize') {
        const factors = primeFactors(n);
        resultHtml = `<div class="stat-row"><span class="stat-label">Number</span><span class="stat-value">${n}</span></div>
            <div class="stat-row"><span class="stat-label">Prime Factors</span><span class="stat-value highlight">${factors.join(' × ')}</span></div>
            <div class="stat-row"><span class="stat-label">Divisors</span><span class="stat-value">${getDivisors(n).join(', ')}</span></div>
            <div class="stat-row"><span class="stat-label">Divisor Count</span><span class="stat-value">${getDivisors(n).length}</span></div>`;
        visualizeFactors(ctx, W, H, n, factors);
    } else if (op === 'isPrime') {
        const prime = isPrime(n);
        resultHtml = `<div class="stat-row"><span class="stat-label">${n}</span><span class="stat-value highlight" style="color:${prime?'var(--accent3)':'var(--accent2)'}">${prime ? '✓ PRIME' : '✗ NOT PRIME'}</span></div>`;
        if (!prime) {
            resultHtml += `<div class="stat-row"><span class="stat-label">Factors</span><span class="stat-value">${primeFactors(n).join(' × ')}</span></div>`;
        }
        drawPrimeCheck(ctx, W, H, n, prime);
    } else if (op === 'gcd') {
        const g = gcdCalc(n, n2);
        const l = n * n2 / g;
        resultHtml = `<div class="stat-row"><span class="stat-label">GCD(${n}, ${n2})</span><span class="stat-value highlight">${g}</span></div>
            <div class="stat-row"><span class="stat-label">LCM(${n}, ${n2})</span><span class="stat-value highlight">${l}</span></div>`;
        drawEuclidean(ctx, W, H, n, n2, g);
    } else if (op === 'lcm') {
        const g = gcdCalc(n, n2);
        const l = n * n2 / g;
        resultHtml = `<div class="stat-row"><span class="stat-label">LCM(${n}, ${n2})</span><span class="stat-value highlight">${l}</span></div>
            <div class="stat-row"><span class="stat-label">GCD(${n}, ${n2})</span><span class="stat-value">${g}</span></div>`;
        drawEuclidean(ctx, W, H, n, n2, g);
    } else if (op === 'fibonacci') {
        const fibs = [];
        let a = 0, b2 = 1;
        while (a <= n) { fibs.push(a); [a, b2] = [b2, a + b2]; }
        resultHtml = `<div class="stat-row"><span class="stat-label">Fibonacci up to ${n}</span></div>
            <div style="color:var(--accent3);font-size:0.82rem;line-height:1.8">${fibs.join(', ')}</div>
            <div class="stat-row" style="margin-top:8px"><span class="stat-label">Count</span><span class="stat-value">${fibs.length}</span></div>`;
        drawFibSpiral(ctx, W, H, fibs.slice(0, 10));
    } else if (op === 'sieve') {
        const primes = sieveOfEratosthenes(sieveLimit);
        resultHtml = `<div class="stat-row"><span class="stat-label">Primes up to ${sieveLimit}</span><span class="stat-value highlight">${primes.length} primes</span></div>
            <div style="color:var(--accent3);font-size:0.78rem;line-height:1.8;margin-top:6px">${primes.join(', ')}</div>`;
        drawSieve(ctx, W, H, sieveLimit, primes);
    }

    document.getElementById('numResults').innerHTML = resultHtml;
}

function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
    return true;
}

function primeFactors(n) {
    const factors = [];
    for (let i = 2; i * i <= n; i++) {
        while (n % i === 0) { factors.push(i); n /= i; }
    }
    if (n > 1) factors.push(n);
    return factors;
}

function getDivisors(n) {
    const divs = [];
    for (let i = 1; i <= n; i++) if (n % i === 0) divs.push(i);
    return divs;
}

function gcdCalc(a, b) {
    while (b) { [a, b] = [b, a % b]; }
    return a;
}

function sieveOfEratosthenes(limit) {
    const sieve = Array(limit + 1).fill(true);
    sieve[0] = sieve[1] = false;
    for (let i = 2; i * i <= limit; i++) {
        if (sieve[i]) for (let j = i * i; j <= limit; j += i) sieve[j] = false;
    }
    return sieve.reduce((acc, isPrime, i) => isPrime ? [...acc, i] : acc, []);
}

function visualizeFactors(ctx, W, H, n, factors) {
    const unique = [...new Set(factors)];
    const cx = W / 2, cy = H / 2;
    ctx.font = 'bold 24px JetBrains Mono';
    ctx.fillStyle = '#6c63ff';
    ctx.textAlign = 'center';
    ctx.fillText(n, cx, 40);
    ctx.font = '14px JetBrains Mono';
    const colors = ['#6c63ff', '#ff6584', '#43e97b', '#f7c948', '#00d4ff'];
    factors.forEach((f, i) => {
        const angle = (i / factors.length) * Math.PI * 2 - Math.PI / 2;
        const r = Math.min(W, H) / 3;
        const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle);
        ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fillStyle = colors[i % colors.length] + '33';
        ctx.fill();
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillText(f, x, y + 5);
        ctx.strokeStyle = colors[i % colors.length] + '66'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx, 50); ctx.lineTo(x, y - 22); ctx.stroke();
    });
    ctx.textAlign = 'left';
}

function drawPrimeCheck(ctx, W, H, n, prime) {
    ctx.font = 'bold 60px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillStyle = prime ? '#43e97b' : '#ff6584';
    ctx.fillText(n, W / 2, H / 2);
    ctx.font = '18px Inter';
    ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    ctx.fillText(prime ? 'PRIME NUMBER' : 'COMPOSITE NUMBER', W / 2, H / 2 + 36);
    ctx.textAlign = 'left';
}

function drawEuclidean(ctx, W, H, a, b, g) {
    const maxVal = Math.max(a, b);
    const barH = 28, gap = 16, startY = 40, startX = 40;
    const colors = ['#6c63ff', '#ff6584', '#43e97b'];
    [[a, 'a = ' + a], [b, 'b = ' + b], [g, 'gcd = ' + g]].forEach(([val, label], i) => {
        const w = (val / maxVal) * (W - startX - 20);
        ctx.fillStyle = colors[i] + '33';
        ctx.fillRect(startX, startY + i * (barH + gap), w, barH);
        ctx.strokeStyle = colors[i]; ctx.lineWidth = 2;
        ctx.strokeRect(startX, startY + i * (barH + gap), w, barH);
        ctx.fillStyle = colors[i]; ctx.font = '11px JetBrains Mono';
        ctx.fillText(label, startX + 4, startY + i * (barH + gap) + 19);
    });
}

function drawFibSpiral(ctx, W, H, fibs) {
    const colors = ['#6c63ff','#ff6584','#43e97b','#f7c948','#00d4ff','#ff9f43','#a29bfe','#fd79a8','#00b894','#fdcb6e'];
    let x = W/2 - 20, y = H/2 - 20, size = fibs[fibs.length-1] || 1;
    const scale = Math.min(W, H) / 2 / (size || 1);
    let cx = W/2, cy = H/2;
    fibs.forEach((f, i) => {
        const s = Math.max(f * scale, 5);
        ctx.strokeStyle = colors[i % colors.length]; ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - s/2, cy - s/2, s, s);
        ctx.fillStyle = colors[i % colors.length] + '20';
        ctx.fillRect(cx - s/2, cy - s/2, s, s);
        ctx.fillStyle = colors[i % colors.length];
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(f, cx, cy + 4);
    });
}

function drawSieve(ctx, W, H, limit, primes) {
    const cols = Math.floor(W / 36), rows = Math.ceil(limit / cols);
    const cellW = W / cols, cellH = Math.min(36, H / rows);
    for (let i = 2; i <= limit; i++) {
        const row = Math.floor((i - 2) / cols), col = (i - 2) % cols;
        const x = col * cellW + 2, y = row * cellH + 2;
        const p = isPrime(i);
        ctx.fillStyle = p ? 'rgba(108,99,255,0.3)' : (darkMode ? '#1a1d27' : '#e4e8fa');
        ctx.fillRect(x, y, cellW - 4, cellH - 4);
        ctx.strokeStyle = p ? '#6c63ff' : (darkMode ? '#2d3155' : '#c8ccec');
        ctx.lineWidth = p ? 1.5 : 0.5;
        ctx.strokeRect(x, y, cellW - 4, cellH - 4);
        ctx.fillStyle = p ? '#43e97b' : (darkMode ? '#5a6080' : '#8890b4');
        ctx.font = `${Math.min(10, cellW * 0.35)}px JetBrains Mono`;
        ctx.fillText(i, x + (cellW - 4) / 2 - 5, y + (cellH - 4) / 2 + 4);
    }
}

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
    plotFunction();
    setTimeout(() => {
        updateGeometryInputs();
        analyzeStats();
        updateTrig();
    }, 300);
});
