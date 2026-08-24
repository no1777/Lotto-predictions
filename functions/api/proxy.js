// functions/api/proxy.js
export async function onRequest(context) {
    const { request, env } = context;
    
    // 只允许GET请求
    if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        // 获取请求路径和参数
        const url = new URL(request.url);
        const path = url.pathname.replace('/api/proxy', '');
        const params = url.searchParams;
        
        // 构建上游API URL
        const upstreamUrl = new URL(`https://api.vnlotto.vip/api${path}`);
        
        // 复制查询参数
        params.forEach((value, key) => {
            upstreamUrl.searchParams.append(key, value);
        });

        // 从环境变量获取API Key（不在代码中硬编码）
        const apiKey = env.API_KEY;
        if (!apiKey) {
            return new Response('API Key not configured', { status: 500 });
        }

        // 发起请求到上游API
        const response = await fetch(upstreamUrl.toString(), {
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
                'User-Agent': 'Cloudflare-Worker'
            }
        });

        // 检查响应状态
        if (!response.ok) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: `上游API返回错误: ${response.status}` 
                }),
                { 
                    status: response.status,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // 返回响应数据（处理CORS）
        const data = await response.json();
        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // 允许跨域
                'Access-Control-Allow-Methods': 'GET',
                'Cache-Control': 'public, max-age=300' // 缓存5分钟
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

// 处理OPTIONS请求（CORS预检）
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        },
    });
}
