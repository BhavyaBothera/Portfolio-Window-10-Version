import { state } from '../core/state.js';

export function startTaskManagerUpdates() {
    stopTaskManagerUpdates();

    const updateTelemetry = async () => {
        try {
            const res = await fetch('/api/system/stats');
            const json = await res.json();

            if (json.success) {
                // Update CPU/RAM data history
                state.tmCpuData.shift();
                state.tmCpuData.push(json.cpu.percent);

                state.tmRamData.shift();
                state.tmRamData.push(json.memory.percent);

                renderTaskManager(json);
            }
        } catch (e) {
            /* Network error */
        }
    };

    updateTelemetry();
    state.tmIntervalId = setInterval(updateTelemetry, 2000);

    // Register cleanup callback on window close
    state.activeAppCleanups.set('taskmgr', stopTaskManagerUpdates);
}

export function stopTaskManagerUpdates() {
    if (state.tmIntervalId) {
        clearInterval(state.tmIntervalId);
        state.tmIntervalId = null;
    }
}

function renderTaskManager(data) {
    // Render CPU Canvas Line Graph
    const cpuCanvas = document.getElementById('tm-cpu-canvas');
    if (cpuCanvas) {
        const ctx = cpuCanvas.getContext('2d');
        const w = cpuCanvas.width;
        const h = cpuCanvas.height;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        // Draw grid lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let y = 0; y < h; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Draw CPU curve
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const step = w / (state.tmCpuData.length - 1);
        state.tmCpuData.forEach((val, i) => {
            const x = i * step;
            const y = h - (val / 100) * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }

    // Update text labels
    const cpuPercentText = document.getElementById('tm-cpu-percent');
    if (cpuPercentText) cpuPercentText.textContent = `${data.cpu.percent}%`;

    const ramPercentText = document.getElementById('tm-ram-percent');
    if (ramPercentText) ramPercentText.textContent = `${data.memory.percent}% (${data.memory.used_gb} GB / ${data.memory.total_gb} GB)`;

    const cpuModelText = document.getElementById('tm-cpu-model');
    if (cpuModelText) cpuModelText.textContent = data.cpu.model;
}
