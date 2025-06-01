// 配置你的 DeepSeek API 密钥和端点
const DEEPSEEK_API_KEY = 'your_deepseek_api_key'
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions' // 假设的API端点

async function callDeepSeekAPI(prompt) {
    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat', // 根据DeepSeek提供的模型名称调整
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return data.choices[0]?.message?.content || '没有收到回复内容'
    } catch (error) {
        console.error('调用DeepSeek API时出错:', error.message)
        throw error
    }
}

// 使用示例
async function main() {
    try {
        const prompt = 'JavaScript实现最简单的打印Hello World（只输出一行解释 + 一行代码）'
        console.log('用户提问:', prompt)

        const response = await callDeepSeekAPI(prompt)
        console.log('DeepSeek 回复:')
        console.md(response)
    } catch (error) {
        console.error('发生错误:', error)
    }
}

main()
