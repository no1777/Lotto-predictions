// js/api.js
const API = {
    // 不再需要API Key，由Workers处理
    async request(endpoint, params = {}) {
        // 构建代理URL
        const url = new URL(`/api/proxy${endpoint}`, window.location.origin);
        
        // 添加查询参数
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.success !== false ? data : data.data;
            
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    },

    // 获取当前开奖
    async getCurrentDraw() {
        try {
            const data = await this.request('/v1/draw/current');
            return data.data || data;
        } catch (error) {
            console.error('获取当前开奖失败:', error);
            return null;
        }
    },

    // 获取历史开奖
    async getHistory(limit = 50, offset = 0) {
        try {
            const data = await this.request('/v1/draw/history', { limit, offset });
            return data.data || data;
        } catch (error) {
            console.error('获取历史数据失败:', error);
            return [];
        }
    },

    // 获取所有历史（自动分页）
    async getAllHistory() {
        let allData = [];
        let offset = 0;
        const limit = 50;

        while (true) {
            const data = await this.getHistory(limit, offset);
            if (!data || data.length === 0) break;
            allData = allData.concat(data);
            offset += limit;
            // 防止频率限制
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        return allData;
    },

    // 获取号码频率统计
    async getFrequency() {
        try {
            const data = await this.request('/v1/stats/frequency');
            return data.data || data;
        } catch (error) {
            console.error('获取频率数据失败:', error);
            return [];
        }
    },

    // 获取开奖时间配置
    async getDrawTime() {
        try {
            const data = await this.request('/v1/config/draw-time');
            return data.data || data;
        } catch (error) {
            console.error('获取开奖时间失败:', error);
            return { draw_time: '20:30' };
        }
    }
};
