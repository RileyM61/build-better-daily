import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// export const runtime = 'edge'

export async function POST(req: Request) {
    try {
        const { title, content } = await req.json()

        if (!title || !content) {
            return NextResponse.json({ error: 'Missing title or content' }, { status: 400 })
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            // Fallback for demo/local if no key (remove in production)
            return NextResponse.json({
                linkedin: `🚀 **${title}**\n\nIn the construction business, we often get caught up in the daily grind...\n\n(This is a mock response. Configure ANTHROPIC_API_KEY to generate real insights.)\n\n#Construction #Leadership #BuildBetter`,
                twitter: `💡 ${title}\n\nStop bidding everything. Start building better.\n\nRead more 👇\n(Link)\n\n#Construction #BizTips`
            })
        }

        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        })

        const prompt = `
    You are an expert social media manager for a high-end construction business consultancy. 
    Your goal is to repurpose the following blog post into engaging social media content.
    
    BLOG TITLE: "${title}"
    BLOG CONTENT: "${content.substring(0, 3000)}..." (truncated for context)

    Please generate two distinct posts in JSON format:
    1. "linkedin": A professional, engaging LinkedIn post. Use line breaks for readability. 3-4 hashtags. Professional but bold tone.
    2. "twitter": A punchy, viral-style X/Twitter post (under 280 chars). Use 1-2 hashtags.

    Return ONLY valid JSON: { "linkedin": "string", "twitter": "string" }
    `

        const message = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
        })

        // Parse the JSON response from Claude
        // Note: In a production app, we'd want more robust parsing logic
        let responseText = message.content[0].type === 'text' ? message.content[0].text : ''

        // Simple cleanup to ensure we get just the JSON object if Claude adds chatter
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            responseText = jsonMatch[0]
        }

        const socialContent = JSON.parse(responseText)

        return NextResponse.json(socialContent)

    } catch (error) {
        console.error('Social generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate content' },
            { status: 500 }
        )
    }
}
