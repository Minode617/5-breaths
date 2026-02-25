// ===== Breathing Patterns =====
const PATTERNS = {
    '5breaths': {
        name: '5回呼吸',
        description: 'クイックリセット',
        inhale: 4,
        holdIn: 0,
        exhale: 6,
        holdOut: 0,
        totalBreaths: 5
    },
    '478': {
        name: '4-7-8 呼吸法',
        description: 'リラックス・睡眠',
        inhale: 4,
        holdIn: 7,
        exhale: 8,
        holdOut: 0,
        totalBreaths: 4
    },
    'box': {
        name: 'ボックス呼吸',
        description: '集中力向上',
        inhale: 4,
        holdIn: 4,
        exhale: 4,
        holdOut: 4,
        totalBreaths: 4
    },
    'calm': {
        name: 'カーム呼吸',
        description: '落ち着きを取り戻す',
        inhale: 5,
        holdIn: 2,
        exhale: 7,
        holdOut: 0,
        totalBreaths: 6
    }
};

// ===== State =====
let currentPattern = '5breaths';
let isActive = false;
let currentPhase = 'idle'; // idle, inhale, holdIn, exhale, holdOut
let breathCount = 0;
let phaseTimeLeft = 0;
let sessions = [];
let selectedMood = null;
let animationFrame = null;
let phaseStartTime = 0;
let phaseDuration = 0;
let weeklyChart = null;
let moodChart = null;

// Audio context for guide sounds
let audioCtx = null;

// Settings
let settings = {
    sound: true,
    vibration: true,
    custom: {
        inhale: 4,
        holdIn: 0,
        exhale: 6,
        holdOut: 0,
        totalBreaths: 5
    }
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initializeEventListeners();
    updateStats();
    renderHistory();
    initializeCharts();
    updatePatternInfo();
    updateProgressRing(0);
});

function loadData() {
    const saved = localStorage.getItem('breathingSessions');
    if (saved) sessions = JSON.parse(saved);

    const savedSettings = localStorage.getItem('breathingSettings');
    if (savedSettings) {
        settings = { ...settings, ...JSON.parse(savedSettings) };
    }

    // Load custom pattern
    if (settings.custom) {
        PATTERNS['custom'] = {
            name: 'カスタム',
            description: 'あなた専用',
            ...settings.custom
        };
    }

    // Restore settings UI
    document.getElementById('soundToggle').checked = settings.sound;
    document.getElementById('vibrationToggle').checked = settings.vibration;
    if (settings.custom) {
        document.getElementById('customInhale').value = settings.custom.inhale;
        document.getElementById('customHoldIn').value = settings.custom.holdIn;
        document.getElementById('customExhale').value = settings.custom.exhale;
        document.getElementById('customHoldOut').value = settings.custom.holdOut;
        document.getElementById('customBreaths').value = settings.custom.totalBreaths;
    }
}

function saveSessions() {
    localStorage.setItem('breathingSessions', JSON.stringify(sessions));
}

function saveSettings() {
    localStorage.setItem('breathingSettings', JSON.stringify(settings));
}

// ===== Event Listeners =====
function initializeEventListeners() {
    // Pattern selection
    document.querySelectorAll('.pattern-card').forEach(card => {
        card.addEventListener('click', () => {
            if (isActive) return;
            document.querySelectorAll('.pattern-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentPattern = card.dataset.pattern;
            updatePatternInfo();
        });
    });

    // Start button
    document.getElementById('startBtn').addEventListener('click', startSession);

    // Stop button
    document.getElementById('stopBtn').addEventListener('click', stopSession);

    // Mood buttons
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedMood = parseInt(btn.dataset.mood);
            document.getElementById('saveSessionBtn').disabled = false;
        });
    });

    // Save session
    document.getElementById('saveSessionBtn').addEventListener('click', saveSession);

    // Skip save
    document.getElementById('skipSaveBtn').addEventListener('click', resetToIdle);

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Clear data
    document.getElementById('clearDataBtn').addEventListener('click', () => {
        if (confirm('本当に全データを削除しますか？この操作は取り消せません。')) {
            sessions = [];
            saveSessions();
            updateStats();
            renderHistory();
            updateCharts();
        }
    });

    // Settings
    document.getElementById('soundToggle').addEventListener('change', (e) => {
        settings.sound = e.target.checked;
        saveSettings();
    });

    document.getElementById('vibrationToggle').addEventListener('change', (e) => {
        settings.vibration = e.target.checked;
        saveSettings();
    });

    document.getElementById('saveCustomBtn').addEventListener('click', saveCustomPattern);
}

// ===== Pattern Info Display =====
function updatePatternInfo() {
    const pattern = PATTERNS[currentPattern];
    document.getElementById('phaseInhale').textContent = `吸う ${pattern.inhale}s`;
    document.getElementById('phaseExhale').textContent = `吐く ${pattern.exhale}s`;
    document.getElementById('breathTotal').textContent = pattern.totalBreaths;
    document.getElementById('breathTarget').textContent = pattern.totalBreaths;

    // Hold in
    const holdInEl = document.getElementById('phaseHoldIn');
    if (pattern.holdIn > 0) {
        holdInEl.textContent = `止める ${pattern.holdIn}s →`;
        holdInEl.style.display = '';
    } else {
        holdInEl.style.display = 'none';
    }

    // Hold out
    const holdOutEl = document.getElementById('phaseHoldOut');
    const holdOutSep = document.getElementById('holdOutSep');
    if (pattern.holdOut > 0) {
        holdOutEl.textContent = `止める ${pattern.holdOut}s`;
        holdOutEl.style.display = '';
        holdOutSep.style.display = '';
    } else {
        holdOutEl.style.display = 'none';
        holdOutSep.style.display = 'none';
    }
}

// ===== Breathing Session =====
function startSession() {
    isActive = true;
    breathCount = 0;
    currentPhase = 'idle';
    selectedMood = null;

    document.getElementById('startBtn').classList.add('hidden');
    document.getElementById('stopBtn').classList.remove('hidden');
    document.getElementById('completionArea').classList.add('hidden');
    document.getElementById('breathCount').textContent = '0';
    document.querySelectorAll('.pattern-card').forEach(c => c.style.pointerEvents = 'none');

    // Start with a brief countdown
    setPhaseText('準備...');
    document.getElementById('timerText').textContent = '';

    setTimeout(() => {
        if (!isActive) return;
        startNextPhase('inhale');
    }, 1500);
}

function stopSession() {
    isActive = false;
    cancelAnimationFrame(animationFrame);
    resetBreathingCircle();
    document.getElementById('startBtn').classList.remove('hidden');
    document.getElementById('stopBtn').classList.add('hidden');
    document.querySelectorAll('.pattern-card').forEach(c => c.style.pointerEvents = '');
    setPhaseText('準備OK');
    document.getElementById('timerText').textContent = '';
    updateProgressRing(0);
}

function startNextPhase(phase) {
    if (!isActive) return;

    const pattern = PATTERNS[currentPattern];
    currentPhase = phase;

    let duration = 0;
    let text = '';

    switch (phase) {
        case 'inhale':
            duration = pattern.inhale;
            text = '吸って';
            expandCircle(duration);
            break;
        case 'holdIn':
            duration = pattern.holdIn;
            text = '止めて';
            holdCircle('expanded');
            break;
        case 'exhale':
            duration = pattern.exhale;
            text = '吐いて';
            contractCircle(duration);
            break;
        case 'holdOut':
            duration = pattern.holdOut;
            text = '止めて';
            holdCircle('contracted');
            break;
    }

    if (duration === 0) {
        advancePhase();
        return;
    }

    setPhaseText(text);
    phaseTimeLeft = duration;
    phaseDuration = duration;
    phaseStartTime = performance.now();

    playPhaseSound(phase);
    triggerVibration();

    tickPhase();
}

function tickPhase() {
    if (!isActive) return;

    const elapsed = (performance.now() - phaseStartTime) / 1000;
    const remaining = Math.max(0, phaseDuration - elapsed);
    phaseTimeLeft = remaining;

    document.getElementById('timerText').textContent = Math.ceil(remaining);

    // Update progress ring for this phase
    const progress = elapsed / phaseDuration;
    updatePhaseProgress(progress);

    if (remaining <= 0) {
        advancePhase();
        return;
    }

    animationFrame = requestAnimationFrame(tickPhase);
}

function advancePhase() {
    const pattern = PATTERNS[currentPattern];

    switch (currentPhase) {
        case 'inhale':
            startNextPhase('holdIn');
            break;
        case 'holdIn':
            startNextPhase('exhale');
            break;
        case 'exhale':
            breathCount++;
            document.getElementById('breathCount').textContent = breathCount;

            if (breathCount >= pattern.totalBreaths) {
                completeSession();
                return;
            }
            startNextPhase('holdOut');
            break;
        case 'holdOut':
            startNextPhase('inhale');
            break;
    }
}

function completeSession() {
    isActive = false;
    cancelAnimationFrame(animationFrame);
    resetBreathingCircle();

    const pattern = PATTERNS[currentPattern];
    const cycleDuration = pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut;
    const totalSeconds = cycleDuration * pattern.totalBreaths;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeStr = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;

    document.getElementById('completionTitle').textContent = 'おつかれさまでした';
    document.getElementById('completionText').textContent =
        `${pattern.name}を完了しました（${timeStr}）`;

    document.getElementById('stopBtn').classList.add('hidden');
    document.getElementById('completionArea').classList.remove('hidden');
    document.querySelectorAll('.pattern-card').forEach(c => c.style.pointerEvents = '');
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('saveSessionBtn').disabled = true;
    updateProgressRing(1);

    playCompletionSound();
}

function saveSession() {
    const pattern = PATTERNS[currentPattern];
    const cycleDuration = pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut;

    const session = {
        timestamp: new Date().toISOString(),
        pattern: currentPattern,
        patternName: pattern.name,
        breaths: breathCount,
        duration: cycleDuration * breathCount,
        mood: selectedMood
    };

    sessions.push(session);
    saveSessions();
    updateStats();
    renderHistory();
    updateCharts();
    resetToIdle();
}

function resetToIdle() {
    document.getElementById('completionArea').classList.add('hidden');
    document.getElementById('startBtn').classList.remove('hidden');
    document.getElementById('stopBtn').classList.add('hidden');
    setPhaseText('準備OK');
    document.getElementById('timerText').textContent = '';
    document.getElementById('breathCount').textContent = '0';
    breathCount = 0;
    selectedMood = null;
    updateProgressRing(0);
}

// ===== Circle Animations =====
function expandCircle(duration) {
    const circle = document.getElementById('breathingCircle');
    circle.style.transition = `transform ${duration}s ease-in-out`;
    circle.style.transform = 'scale(1.4)';
    circle.classList.remove('contracted', 'holding');
    circle.classList.add('expanding');
}

function contractCircle(duration) {
    const circle = document.getElementById('breathingCircle');
    circle.style.transition = `transform ${duration}s ease-in-out`;
    circle.style.transform = 'scale(0.75)';
    circle.classList.remove('expanding', 'holding');
    circle.classList.add('contracted');
}

function holdCircle(state) {
    const circle = document.getElementById('breathingCircle');
    circle.classList.remove('expanding', 'contracted');
    circle.classList.add('holding');
}

function resetBreathingCircle() {
    const circle = document.getElementById('breathingCircle');
    circle.style.transition = 'transform 0.5s ease-out';
    circle.style.transform = 'scale(1)';
    circle.classList.remove('expanding', 'contracted', 'holding');
}

function setPhaseText(text) {
    document.getElementById('phaseText').textContent = text;
}

// ===== Progress Ring =====
function updateProgressRing(progress) {
    const fill = document.getElementById('progressRingFill');
    const circumference = 2 * Math.PI * 130;
    fill.style.strokeDasharray = circumference;
    fill.style.strokeDashoffset = circumference * (1 - progress);
}

function updatePhaseProgress(progress) {
    const pattern = PATTERNS[currentPattern];
    const cycleDuration = pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut;
    let phaseOffset = 0;

    switch (currentPhase) {
        case 'inhale': phaseOffset = 0; break;
        case 'holdIn': phaseOffset = pattern.inhale; break;
        case 'exhale': phaseOffset = pattern.inhale + pattern.holdIn; break;
        case 'holdOut': phaseOffset = pattern.inhale + pattern.holdIn + pattern.exhale; break;
    }

    let phaseDur = 0;
    switch (currentPhase) {
        case 'inhale': phaseDur = pattern.inhale; break;
        case 'holdIn': phaseDur = pattern.holdIn; break;
        case 'exhale': phaseDur = pattern.exhale; break;
        case 'holdOut': phaseDur = pattern.holdOut; break;
    }

    const cycleProgress = (phaseOffset + phaseDur * progress) / cycleDuration;
    const totalProgress = (breathCount + cycleProgress) / pattern.totalBreaths;
    updateProgressRing(Math.min(totalProgress, 1));
}

// ===== Audio =====
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playPhaseSound(phase) {
    if (!settings.sound) return;

    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        switch (phase) {
            case 'inhale':
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(660, ctx.currentTime + 0.15);
                break;
            case 'exhale':
                osc.frequency.setValueAtTime(660, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(330, ctx.currentTime + 0.15);
                break;
            case 'holdIn':
            case 'holdOut':
                osc.frequency.setValueAtTime(550, ctx.currentTime);
                break;
        }

        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
        // Audio not available
    }
}

function playCompletionSound() {
    if (!settings.sound) return;

    try {
        const ctx = getAudioContext();
        const notes = [523, 659, 784]; // C5, E5, G5

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
            osc.start(ctx.currentTime + i * 0.15);
            osc.stop(ctx.currentTime + i * 0.15 + 0.4);
        });
    } catch (e) {
        // Audio not available
    }
}

function triggerVibration() {
    if (!settings.vibration) return;
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// ===== Custom Pattern =====
function saveCustomPattern() {
    const inhale = parseInt(document.getElementById('customInhale').value) || 4;
    const holdIn = parseInt(document.getElementById('customHoldIn').value) || 0;
    const exhale = parseInt(document.getElementById('customExhale').value) || 6;
    const holdOut = parseInt(document.getElementById('customHoldOut').value) || 0;
    const totalBreaths = parseInt(document.getElementById('customBreaths').value) || 5;

    settings.custom = { inhale, holdIn, exhale, holdOut, totalBreaths };
    PATTERNS['custom'] = {
        name: 'カスタム',
        description: 'あなた専用',
        ...settings.custom
    };
    saveSettings();

    // Add custom card if not present
    const existing = document.querySelector('[data-pattern="custom"]');
    if (!existing) {
        const container = document.getElementById('patternCards');
        const btn = document.createElement('button');
        btn.className = 'pattern-card';
        btn.dataset.pattern = 'custom';
        btn.innerHTML = '<span class="pattern-name">カスタム</span><span class="pattern-desc">あなた専用</span>';
        btn.addEventListener('click', () => {
            if (isActive) return;
            document.querySelectorAll('.pattern-card').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            currentPattern = 'custom';
            updatePatternInfo();
        });
        container.appendChild(btn);
    }

    // Auto-select custom pattern
    document.querySelectorAll('.pattern-card').forEach(c => c.classList.remove('active'));
    const customCard = document.querySelector('[data-pattern="custom"]');
    if (customCard) customCard.classList.add('active');
    currentPattern = 'custom';
    updatePatternInfo();

    // Feedback
    const btn = document.getElementById('saveCustomBtn');
    const originalText = btn.textContent;
    btn.textContent = '保存しました！';
    setTimeout(() => { btn.textContent = originalText; }, 1500);
}

// ===== Statistics =====
function updateStats() {
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(s => new Date(s.timestamp).toDateString() === today);

    document.getElementById('todaySessions').textContent = todaySessions.length;
    document.getElementById('totalSessions').textContent = sessions.length;
    document.getElementById('totalBreaths').textContent = sessions.reduce((sum, s) => sum + s.breaths, 0);
    document.getElementById('streakDays').textContent = calculateStreak();
}

function calculateStreak() {
    if (sessions.length === 0) return 0;

    const dates = [...new Set(sessions.map(s =>
        new Date(s.timestamp).toDateString()
    ))].sort((a, b) => new Date(b) - new Date(a));

    // Check if today or yesterday has a session
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
        const current = new Date(dates[i]);
        const prev = new Date(dates[i + 1]);
        const diffDays = Math.round((current - prev) / 86400000);
        if (diffDays === 1) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

// ===== History =====
function renderHistory() {
    const historyList = document.getElementById('historyList');

    if (sessions.length === 0) {
        historyList.innerHTML = '<p class="empty-message">まだ記録がありません</p>';
        return;
    }

    const sorted = [...sessions].reverse();
    historyList.innerHTML = sorted.map(session => {
        const date = new Date(session.timestamp);
        const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        const minutes = Math.floor(session.duration / 60);
        const seconds = session.duration % 60;
        const durationStr = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
        const moodEmojis = ['', '😣', '😐', '🙂', '😊', '😌'];
        const moodStr = session.mood ? moodEmojis[session.mood] : '';

        return `
            <div class="history-item">
                <div class="date">${dateStr}</div>
                <div class="pattern-name-hist">${session.patternName}</div>
                <div class="values">
                    <span>${session.breaths}回</span>
                    <span>${durationStr}</span>
                    ${moodStr ? `<span class="mood-display">${moodStr}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ===== Charts =====
function initializeCharts() {
    const ctx1 = document.getElementById('weeklyChart');
    const ctx2 = document.getElementById('moodChart');

    weeklyChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: getLast7Days(),
            datasets: [{
                label: 'セッション数',
                data: [],
                backgroundColor: 'rgba(94, 157, 163, 0.7)',
                borderColor: 'rgba(94, 157, 163, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: '#8a9bae'
                    },
                    grid: { color: 'rgba(138, 155, 174, 0.15)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#8a9bae' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#c8d6e5', font: { size: 12 } }
                }
            }
        }
    });

    moodChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '気分スコア',
                data: [],
                borderColor: 'rgba(162, 210, 172, 1)',
                backgroundColor: 'rgba(162, 210, 172, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(162, 210, 172, 1)',
                pointBorderColor: '#1a2332',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    min: 1,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        color: '#8a9bae',
                        callback: (val) => ['', '😣', '😐', '🙂', '😊', '😌'][val] || val
                    },
                    grid: { color: 'rgba(138, 155, 174, 0.15)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#8a9bae' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#c8d6e5', font: { size: 12 } }
                }
            }
        }
    });

    updateCharts();
}

function getLast7Days() {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        result.push(`${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`);
    }
    return result;
}

function updateCharts() {
    if (!weeklyChart || !moodChart) return;

    // Weekly chart
    const weekData = new Array(7).fill(0);
    for (let i = 6; i >= 0; i--) {
        const day = new Date(Date.now() - i * 86400000).toDateString();
        weekData[6 - i] = sessions.filter(s => new Date(s.timestamp).toDateString() === day).length;
    }
    weeklyChart.data.labels = getLast7Days();
    weeklyChart.data.datasets[0].data = weekData;
    weeklyChart.update();

    // Mood chart
    const moodSessions = sessions.filter(s => s.mood).slice(-15);
    if (moodSessions.length > 0) {
        moodChart.data.labels = moodSessions.map((s, i) => {
            const d = new Date(s.timestamp);
            return `${d.getMonth() + 1}/${d.getDate()}`;
        });
        moodChart.data.datasets[0].data = moodSessions.map(s => s.mood);
    } else {
        moodChart.data.labels = [];
        moodChart.data.datasets[0].data = [];
    }
    moodChart.update();
}

// ===== Tab Switching =====
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
}
