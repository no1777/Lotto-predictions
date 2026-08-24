// 预测模块
const Predictor = {
    // 生肖映射（2026年）
    zodiacMap: {
        1: '蛇', 2: '龙', 3: '猫', 4: '虎', 5: '牛', 6: '鼠',
        7: '猪', 8: '狗', 9: '鸡', 10: '猴', 11: '羊', 12: '马',
        13: '蛇', 14: '龙', 15: '猫', 16: '虎', 17: '牛', 18: '鼠',
        19: '猪', 20: '狗', 21: '鸡', 22: '猴', 23: '羊', 24: '马',
        25: '蛇', 26: '龙', 27: '猫', 28: '虎', 29: '牛', 30: '鼠',
        31: '猪', 32: '狗', 33: '鸡', 34: '猴', 35: '羊', 36: '马',
        37: '蛇', 38: '龙', 39: '猫', 40: '虎', 41: '牛', 42: '鼠',
        43: '猪', 44: '狗', 45: '鸡', 46: '猴', 47: '羊', 48: '马',
        49: '蛇'
    },

    // 获取生肖
    getZodiac(number) {
        return this.zodiacMap[number] || '未知';
    },

    // 预测号码（综合评分）
    predictNumbers(historyData, topN = 12) {
        if (!historyData || historyData.length === 0) return [];

        // 提取特别号
        const specialNumbers = historyData.map(item => item.numbers[item.numbers.length - 1]);
        const total = specialNumbers.length;

        // 1. 总频率
        const freqAll = {};
        specialNumbers.forEach(num => {
            freqAll[num] = (freqAll[num] || 0) + 1;
        });

        // 2. 近期频率（最近20期）
        const recent = specialNumbers.slice(-20);
        const freqRecent = {};
        recent.forEach(num => {
            freqRecent[num] = (freqRecent[num] || 0) + 1;
        });

        // 3. 遗漏值
        const latestPeriod = historyData[historyData.length - 1].period;
        const lastSeen = {};
        historyData.forEach(item => {
            const num = item.numbers[item.numbers.length - 1];
            lastSeen[num] = item.period;
        });
        
        let maxMiss = 0;
        const missValues = {};
        for (let i = 1; i <= 49; i++) {
            const last = lastSeen[i] || 0;
            const miss = latestPeriod - last;
            missValues[i] = miss;
            if (miss > maxMiss) maxMiss = miss;
        }

        // 4. 综合评分
        const scores = {};
        for (let i = 1; i <= 49; i++) {
            const fAll = (freqAll[i] || 0) / total;
            const fRec = (freqRecent[i] || 0) / (recent.length || 1);
            const miss = maxMiss > 0 ? 1 - (missValues[i] / maxMiss) : 0;
            
            scores[i] = 0.3 * fAll + 0.4 * fRec + 0.3 * miss;
        }

        // 排序取topN
        return Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(item => parseInt(item[0]));
    },

    // 预测生肖
    predictZodiacs(historyData, topN = 4) {
        if (!historyData || historyData.length === 0) return [];

        const zodiacs = historyData.map(item => {
            const num = item.numbers[item.numbers.length - 1];
            return this.getZodiac(num);
        });
        const total = zodiacs.length;

        // 总频率
        const freqAll = {};
        zodiacs.forEach(z => {
            freqAll[z] = (freqAll[z] || 0) + 1;
        });

        // 近期频率（最近20期）
        const recent = zodiacs.slice(-20);
        const freqRecent = {};
        recent.forEach(z => {
            freqRecent[z] = (freqRecent[z] || 0) + 1;
        });

        const allZodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
        const scores = {};
        
        allZodiacs.forEach(z => {
            const fAll = (freqAll[z] || 0) / total;
            const fRec = (freqRecent[z] || 0) / (recent.length || 1);
            scores[z] = 0.5 * fAll + 0.5 * fRec;
        });

        return Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(item => item[0]);
    },

    // 生成预测
    generatePredictions(historyData) {
        if (!historyData || historyData.length === 0) return null;

        const nextPeriod = historyData[historyData.length - 1].period + 1;
        const numbers = this.predictNumbers(historyData);
        const zodiacs = this.predictZodiacs(historyData);

        return {
            period: nextPeriod,
            numbers: numbers.map(n => ({号码: n, 状态: '待开奖'})),
            zodiacs: zodiacs.map(z => ({生肖: z, 状态: '待开奖'}))
        };
    },

    // 验证预测
    validatePrediction(prediction, actualData) {
        if (!prediction || !actualData) return prediction;

        const actualNumber = actualData.numbers[actualData.numbers.length - 1];
        const actualZodiac = this.getZodiac(actualNumber);

        // 验证号码
        prediction.numbers.forEach(item => {
            if (item.号码 === actualNumber) {
                item.状态 = '中';
            } else if (item.状态 === '待开奖') {
                item.状态 = '未中';
            }
        });

        // 验证生肖
        prediction.zodiacs.forEach(item => {
            if (item.生肖 === actualZodiac) {
                item.状态 = '中';
            } else if (item.状态 === '待开奖') {
                item.状态 = '未中';
            }
        });

        return prediction;
    }
};
