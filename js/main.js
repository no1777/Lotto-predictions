// 主程序
const App = {
    historyData: [],
    predictions: {},
    latestDraw: null,
    countdownTarget: null,
    isInitialized: false,

    // 初始化
    async init() {
        UI.updateStatus('🔄 加载数据中...');
        
        try {
            // 1. 获取历史数据
            this.historyData = await API.getAllHistory();
            if (!this.historyData || this.historyData.length === 0) {
                UI.updateStatus('❌ 无法获取数据，请检查API Key', true);
                return;
            }
            
            // 2. 获取最新开奖
            this.latestDraw = await API.getCurrentDraw();
            
            // 3. 生成预测
            this.generatePredictions();
            
            // 4. 验证已有预测
            this.validateExistingPredictions();
            
            // 5. 渲染界面
            this.renderAll();
            
            // 6. 启动定时刷新
            this.startAutoRefresh();
            
            UI.updateStatus('🟢 运行中');
            this.isInitialized = true;
            
        } catch (error) {
            console.error('初始化失败:', error);
            UI.updateStatus('❌ 初始化失败', true);
        }
    },

    // 生成预测
    generatePredictions() {
        if (!this.historyData || this.historyData.length === 0) return;
        
        const latestPeriod = this.historyData[this.historyData.length - 1].period;
        
        // 检查是否已有该期预测
        if (!this.predictions[latestPeriod + 1]) {
            const prediction = Predictor.generatePredictions(this.historyData);
            if (prediction) {
                this.predictions[prediction.period] = prediction;
                this.cleanupPredictions();
            }
        }
    },

    // 验证已有预测
    validateExistingPredictions() {
        if (!this.latestDraw) return;
        
        const period = this.latestDraw.period;
        if (this.predictions[period]) {
            this.predictions[period] = Predictor.validatePrediction(
                this.predictions[period],
                this.latestDraw
            );
        }
    },

    // 清理旧预测（只保留最近6期）
    cleanupPredictions() {
        const keys = Object.keys(this.predictions).map(Number).sort((a, b) => b - a);
        if (keys.length > 6) {
            keys.slice(6).forEach(key => {
                delete this.predictions[key];
            });
        }
    },

    // 渲染所有界面
    renderAll() {
        // 渲染最新开奖
        if (this.latestDraw) {
            document.getElementById('period').textContent = this.latestDraw.period;
            UI.renderNumbers(this.latestDraw.numbers);
        }

        // 渲染历史
        UI.renderHistory(this.historyData);

        // 渲染预测
        UI.renderPredictions(this.predictions, 'numbers');
        UI.renderPredictions(this.predictions, 'zodiacs');

        // 计算倒计时
        this.updateCountdown();
    },

    // 更新倒计时
    updateCountdown() {
        const now = new Date();
        const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000); // UTC+7
        const drawTime = new Date(vnTime);
        drawTime.setHours(20, 30, 0, 0);
        
        if (vnTime >= drawTime) {
            drawTime.setDate(drawTime.getDate() + 1);
        }
        
        this.countdownTarget = drawTime;
        UI.updateCountdown(drawTime);
    },

    // 自动刷新（每30秒）
    startAutoRefresh() {
        setInterval(async () => {
            try {
                // 更新倒计时
                this.updateCountdown();
                
                // 检查是否有新开奖
                const current = await API.getCurrentDraw();
                if (current && (!this.latestDraw || current.period > this.latestDraw.period)) {
                    // 有新开奖
                    this.latestDraw = current;
                    
                    // 更新历史数据
                    const newHistory = await API.getHistory(50);
                    if (newHistory && newHistory.length > 0) {
                        this.historyData = newHistory;
                    }
                    
                    // 验证预测并生成新预测
                    this.validateExistingPredictions();
                    this.generatePredictions();
                    
                    // 重新渲染
                    this.renderAll();
                    
                    UI.updateStatus('🟢 已更新');
                }
            } catch (error) {
                console.error('刷新失败:', error);
            }
        }, 30000); // 30秒
    }
};

// 页面加载完成后启动
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
