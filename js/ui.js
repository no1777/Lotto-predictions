// 界面渲染模块
const UI = {
    // 渲染开奖号码球
    renderNumbers(numbers, specialIndex = 6) {
        const container = document.getElementById('numbersDisplay');
        if (!numbers) {
            container.innerHTML = '<span class="placeholder">暂无数据</span>';
            return;
        }

        // 生肖映射
        const zodiacMap = Predictor.zodiacMap;
        
        container.innerHTML = numbers.map((num, index) => {
            const isSpecial = index === specialIndex;
            const zodiac = zodiacMap[num] || '?';
            const ballClass = isSpecial ? 'ball special' : 'ball';
            return `
                <div class="${ballClass}">
                    <span class="number">${num}</span>
                    <span class="zodiac">${zodiac}</span>
                </div>
            `;
        }).join('');
    },

    // 渲染历史记录
    renderHistory(historyData) {
        const container = document.getElementById('historyList');
        if (!historyData || historyData.length === 0) {
            container.innerHTML = '<p>暂无历史记录</p>';
            return;
        }

        // 只显示最近20期
        const recent = historyData.slice(-20).reverse();
        container.innerHTML = recent.map(item => {
            const specialNum = item.numbers[item.numbers.length - 1];
            const zodiac = Predictor.getZodiac(specialNum);
            const time = new Date(item.draw_time).toLocaleString('zh-CN');
            return `
                <div class="history-item">
                    <span class="period">第${item.period}期</span>
                    <span class="special">特别号: ${specialNum} (${zodiac})</span>
                    <span class="time">${time}</span>
                </div>
            `;
        }).join('');
    },

    // 渲染预测列表（号码或生肖）
    renderPredictions(predictions, type) {
        const containerId = type === 'numbers' ? 'numberPredictions' : 'zodiacPredictions';
        const container = document.getElementById(containerId);
        
        if (!predictions || Object.keys(predictions).length === 0) {
            container.innerHTML = '<p class="placeholder">暂无预测数据</p>';
            return;
        }

        // 获取最近6期（按期数降序）
        const sortedKeys = Object.keys(predictions)
            .map(Number)
            .sort((a, b) => b - a)
            .slice(0, 6);

        let html = '';
        sortedKeys.forEach(period => {
            const pred = predictions[period];
            const items = type === 'numbers' ? pred.numbers : pred.zodiacs;
            const title = type === 'numbers' ? '预测号码' : '预测生肖';
            
            html += `
                <div class="prediction-card">
                    <div class="card-header">
                        <span class="period">第${period}期</span>
                    </div>
                    <div class="card-body">
                        ${items.map(item => {
                            const value = type === 'numbers' ? item.号码 : item.生肖;
                            const status = item.状态;
                            const statusClass = status === '中' ? 'win' : 
                                               status === '未中' ? 'lose' : 'pending';
                            return `
                                <span class="prediction-item ${statusClass}">
                                    ${value}
                                    <span class="status-badge">${status}</span>
                                </span>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // 更新倒计时
    updateCountdown(targetTime) {
        const element = document.getElementById('countdown');
        if (!targetTime) {
            element.textContent = '⏰ 加载中...';
            return;
        }

        const now = new Date();
        const diff = targetTime - now;
        
        if (diff <= 0) {
            element.textContent = '⏰ 开奖中...';
            return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        element.textContent = `⏰ 下次开奖: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },

    // 更新状态
    updateStatus(text, isError = false) {
        const element = document.getElementById('status');
        element.textContent = text;
        element.style.color = isError ? '#ff4444' : '#00cc66';
    }
};

// 切换历史显示
function toggleHistory() {
    const list = document.getElementById('historyList');
    const btn = document.querySelector('.history-toggle button');
    if (list.style.display === 'none') {
        list.style.display = 'block';
        btn.textContent = '📜 收起历史';
    } else {
        list.style.display = 'none';
        btn.textContent = '📜 开奖历史';
    }
}
