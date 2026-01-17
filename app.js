// State Management
let currentRecord = {
    snsType: '',
    expectation: null,
    satisfaction: null,
    timestamp: null
};

let records = [];
let comparisonChart = null;
let gapTrendChart = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadRecords();
    initializeEventListeners();
    updateStats();
    renderHistory();
    renderInsights();
    initializeCharts();
});

// Event Listeners
function initializeEventListeners() {
    // Rating buttons
    setupRatingButtons('expectationRating', (value) => {
        currentRecord.expectation = value;
        document.getElementById('startBtn').disabled = false;
    });

    setupRatingButtons('satisfactionRating', (value) => {
        currentRecord.satisfaction = value;
        document.getElementById('submitBtn').disabled = false;
    });

    // SNS Type selection
    document.getElementById('snsType').addEventListener('change', (e) => {
        currentRecord.snsType = e.target.value;
    });

    // Start button
    document.getElementById('startBtn').addEventListener('click', () => {
        showStep(2);
    });

    // Submit button
    document.getElementById('submitBtn').addEventListener('click', () => {
        saveRecord();
        showStep(3);
        updateStats();
        renderHistory();
        renderInsights();
        updateCharts();
    });

    // Cancel button
    document.getElementById('cancelBtn').addEventListener('click', () => {
        resetRecord();
        showStep(1);
    });

    // New record button
    document.getElementById('newRecordBtn').addEventListener('click', () => {
        resetRecord();
        showStep(1);
    });

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Clear data button
    document.getElementById('clearDataBtn').addEventListener('click', () => {
        if (confirm('本当に全データを削除しますか？この操作は取り消せません。')) {
            records = [];
            saveRecords();
            updateStats();
            renderHistory();
            renderInsights();
            updateCharts();
        }
    });
}

// Rating Buttons Setup
function setupRatingButtons(containerId, onSelect) {
    const container = document.getElementById(containerId);
    const buttons = container.querySelectorAll('.rating-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            onSelect(parseInt(btn.dataset.value));
        });
    });
}

// Step Management
function showStep(stepNumber) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.add('hidden');
    });
    document.getElementById(`step${stepNumber}`).classList.remove('hidden');
}

// Record Management
function saveRecord() {
    currentRecord.timestamp = new Date().toISOString();
    records.push({ ...currentRecord });
    saveRecords();

    // Show result message
    const gap = currentRecord.expectation - currentRecord.satisfaction;
    let message = '';

    if (gap > 0) {
        message = `期待度${currentRecord.expectation}に対して、満足度は${currentRecord.satisfaction}でした。\n期待よりも ${gap}ポイント低い結果となりました。😔`;
    } else if (gap < 0) {
        message = `期待度${currentRecord.expectation}に対して、満足度は${currentRecord.satisfaction}でした。\n期待よりも ${Math.abs(gap)}ポイント高い結果となりました！😊`;
    } else {
        message = `期待通りの結果でした。（期待度 = 満足度 = ${currentRecord.expectation}）`;
    }

    document.getElementById('resultMessage').textContent = message;
}

function resetRecord() {
    currentRecord = {
        snsType: document.getElementById('snsType').value,
        expectation: null,
        satisfaction: null,
        timestamp: null
    };

    // Reset all rating buttons
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    document.getElementById('startBtn').disabled = true;
    document.getElementById('submitBtn').disabled = true;
}

// LocalStorage
function saveRecords() {
    localStorage.setItem('snsRecords', JSON.stringify(records));
}

function loadRecords() {
    const saved = localStorage.getItem('snsRecords');
    if (saved) {
        records = JSON.parse(saved);
    }
}

// Statistics
function updateStats() {
    const totalRecords = records.length;
    document.getElementById('totalRecords').textContent = totalRecords;

    if (totalRecords === 0) {
        document.getElementById('avgExpectation').textContent = '-';
        document.getElementById('avgSatisfaction').textContent = '-';
        document.getElementById('avgGap').textContent = '-';
        return;
    }

    const avgExpectation = (records.reduce((sum, r) => sum + r.expectation, 0) / totalRecords).toFixed(2);
    const avgSatisfaction = (records.reduce((sum, r) => sum + r.satisfaction, 0) / totalRecords).toFixed(2);
    const avgGap = (avgExpectation - avgSatisfaction).toFixed(2);

    document.getElementById('avgExpectation').textContent = avgExpectation;
    document.getElementById('avgSatisfaction').textContent = avgSatisfaction;
    document.getElementById('avgGap').textContent = avgGap > 0 ? `+${avgGap}` : avgGap;
}

// History Rendering
function renderHistory() {
    const historyList = document.getElementById('historyList');

    if (records.length === 0) {
        historyList.innerHTML = '<p class="empty-message">まだ記録がありません</p>';
        return;
    }

    const sortedRecords = [...records].reverse();
    historyList.innerHTML = sortedRecords.map((record, index) => {
        const gap = record.expectation - record.satisfaction;
        const gapClass = gap > 0 ? 'positive' : gap < 0 ? 'negative' : 'neutral';
        const gapText = gap > 0 ? `期待外れ: +${gap}` : gap < 0 ? `期待以上: ${gap}` : '期待通り: 0';

        const date = new Date(record.timestamp);
        const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

        return `
            <div class="history-item">
                <div class="date">${dateStr}</div>
                <div class="sns-type">${record.snsType}</div>
                <div class="values">
                    <span>期待度: ${record.expectation}</span>
                    <span>満足度: ${record.satisfaction}</span>
                </div>
                <div class="gap ${gapClass}">${gapText}</div>
            </div>
        `;
    }).join('');
}

// Insights
function renderInsights() {
    const container = document.getElementById('insightsContainer');

    if (records.length < 3) {
        container.innerHTML = '<p class="empty-message">記録が3件以上になると、インサイトが表示されます</p>';
        return;
    }

    const insights = generateInsights();
    container.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <h4>${insight.title}</h4>
            <p>${insight.message}</p>
        </div>
    `).join('');
}

function generateInsights() {
    const insights = [];

    // 1. Overall gap analysis
    const avgGap = records.reduce((sum, r) => sum + (r.expectation - r.satisfaction), 0) / records.length;
    if (avgGap > 0.5) {
        insights.push({
            title: '📉 期待と現実のギャップ',
            message: `平均して、SNSは期待を ${avgGap.toFixed(2)} ポイント下回っています。SNS使用前に持つ期待は、実際の体験と一致していない可能性が高いです。`
        });
    } else if (avgGap < -0.5) {
        insights.push({
            title: '📈 予想以上の満足',
            message: `SNSは平均して期待を ${Math.abs(avgGap).toFixed(2)} ポイント上回っています。SNSから適切な価値を得られているようです。`
        });
    } else {
        insights.push({
            title: '🎯 期待と現実のバランス',
            message: '期待と満足度がほぼ一致しています。SNSに対して現実的な期待を持っているようです。'
        });
    }

    // 2. Disappointment rate
    const disappointments = records.filter(r => r.expectation > r.satisfaction).length;
    const disappointmentRate = (disappointments / records.length) * 100;
    if (disappointmentRate > 70) {
        insights.push({
            title: '⚠️ 高い期待外れ率',
            message: `${disappointmentRate.toFixed(0)}% のケースで、SNSは期待を下回っています。SNS使用を見直すことを検討してみてください。`
        });
    }

    // 3. SNS-specific analysis
    const snsCounts = {};
    const snsGaps = {};

    records.forEach(r => {
        if (!snsCounts[r.snsType]) {
            snsCounts[r.snsType] = 0;
            snsGaps[r.snsType] = [];
        }
        snsCounts[r.snsType]++;
        snsGaps[r.snsType].push(r.expectation - r.satisfaction);
    });

    const worstSNS = Object.keys(snsGaps).reduce((worst, sns) => {
        const avgGap = snsGaps[sns].reduce((a, b) => a + b, 0) / snsGaps[sns].length;
        if (!worst || avgGap > snsGaps[worst].reduce((a, b) => a + b, 0) / snsGaps[worst].length) {
            return sns;
        }
        return worst;
    }, null);

    if (worstSNS && snsGaps[worstSNS].length >= 2) {
        const worstGap = (snsGaps[worstSNS].reduce((a, b) => a + b, 0) / snsGaps[worstSNS].length).toFixed(2);
        if (worstGap > 0.5) {
            insights.push({
                title: `🎯 ${worstSNS}の分析`,
                message: `${worstSNS}は平均 ${worstGap} ポイント期待を下回っています。このSNSの使用を特に見直すことをお勧めします。`
            });
        }
    }

    // 4. Recent trend
    if (records.length >= 5) {
        const recent5 = records.slice(-5);
        const recentGap = recent5.reduce((sum, r) => sum + (r.expectation - r.satisfaction), 0) / 5;
        const older5 = records.slice(-10, -5);
        if (older5.length >= 3) {
            const olderGap = older5.reduce((sum, r) => sum + (r.expectation - r.satisfaction), 0) / older5.length;
            if (recentGap - olderGap > 0.5) {
                insights.push({
                    title: '📊 最近の傾向',
                    message: '最近、期待と現実のギャップが広がっています。SNSの使い方を見直す良いタイミングかもしれません。'
                });
            } else if (olderGap - recentGap > 0.5) {
                insights.push({
                    title: '📊 改善の兆し',
                    message: '最近、期待と現実のギャップが縮まっています。SNSとの付き合い方が改善されているようです！'
                });
            }
        }
    }

    return insights;
}

// Charts
function initializeCharts() {
    const ctx1 = document.getElementById('comparisonChart');
    const ctx2 = document.getElementById('gapTrendChart');

    comparisonChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: '期待度',
                    data: [],
                    backgroundColor: 'rgba(102, 126, 234, 0.6)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2
                },
                {
                    label: '満足度',
                    data: [],
                    backgroundColor: 'rgba(118, 75, 162, 0.6)',
                    borderColor: 'rgba(118, 75, 162, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5
                }
            }
        }
    });

    gapTrendChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'ギャップ（期待 - 現実）',
                data: [],
                borderColor: 'rgba(231, 76, 60, 1)',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: 0,
                            yMax: 0,
                            borderColor: 'rgba(0, 0, 0, 0.3)',
                            borderWidth: 2,
                            borderDash: [5, 5]
                        }
                    }
                }
            }
        }
    });

    updateCharts();
}

function updateCharts() {
    if (!comparisonChart || !gapTrendChart) return;

    if (records.length === 0) {
        comparisonChart.data.labels = [];
        comparisonChart.data.datasets[0].data = [];
        comparisonChart.data.datasets[1].data = [];
        gapTrendChart.data.labels = [];
        gapTrendChart.data.datasets[0].data = [];
    } else {
        const last10 = records.slice(-10);

        // Comparison chart
        comparisonChart.data.labels = last10.map((r, i) => `#${records.length - 10 + i + 1}`);
        comparisonChart.data.datasets[0].data = last10.map(r => r.expectation);
        comparisonChart.data.datasets[1].data = last10.map(r => r.satisfaction);

        // Gap trend chart
        gapTrendChart.data.labels = last10.map((r, i) => `#${records.length - 10 + i + 1}`);
        gapTrendChart.data.datasets[0].data = last10.map(r => r.expectation - r.satisfaction);
    }

    comparisonChart.update();
    gapTrendChart.update();
}

// Tab Switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
}
