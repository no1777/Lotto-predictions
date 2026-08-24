// src/index.js
export default {
    async fetch(request, env) {
        // 只允许 GET 请求
        if (request.method !== 'GET') {
            return new Response('Method not allowed', { status: 405 });
        }

        try {
            // 获取请求路径和参数
            const url = new URL(request.url);
            const path = url.pathname;
            const params = url.searchParams;
            
            // 构建上游 API URL
            const upstreamUrl = new URL(`https://api.vnlotto.vip/api${path}`);
            
            // 复制查询参数
            params.forEach((value, key) => {
                upstreamUrl.searchParams.append(key, value);
            });

            // 从环境变量获取 API Key
            const apiKey = env.API_KEY;
            if (!apiKey) {
                return new Response(
                    JSON.stringify({ 
                        success: false, 
                        error: 'API_KEY 未配置' 
                    }),
                    { 
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // 发起请求到上游 API
            const response = await fetch(upstreamUrl.toString(), {
                headers: {
                    'X-API-Key': apiKey,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Cloudflare-Worker'
                }
            });

            // 获取响应数据
            const data = await response.json();

            // 返回响应（添加 CORS 头）
            return new Response(JSON.stringify(data), {
                status: response.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Cache-Control': 'public, max-age=300'
                }
            });

        } catch (error) {
            console.error('代理请求失败:', error);
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: '代理请求失败: ' + error.message 
                }),
                { 
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
    }
};
