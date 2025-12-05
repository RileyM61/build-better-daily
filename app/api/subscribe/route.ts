import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()

        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            )
        }

        // Attempt to save to Supabase
        try {
            const supabase = createServerClient()
            const { error } = await supabase
                .from('subscribers')
                .insert([{ email }])

            if (error) {
                // If table doesn't exist or other db error, we'll log it but fallback
                // so the user still gets a success message (since this is "coming soon")
                console.warn('Failed to save subscriber to Supabase:', error)
            }
        } catch (dbError) {
            console.warn('Supabase not configured or unreachable:', dbError)
        }

        // Always return success for the "coming soon" experience
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
