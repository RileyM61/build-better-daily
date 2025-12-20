import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { email, leadership_meeting_day, delivery_window } = await request.json()

        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            )
        }

        // Validate delivery preferences if provided
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        const validWindows = ['morning', 'before']
        
        if (leadership_meeting_day && !validDays.includes(leadership_meeting_day)) {
            return NextResponse.json(
                { error: 'Invalid leadership meeting day' },
                { status: 400 }
            )
        }
        
        if (delivery_window && !validWindows.includes(delivery_window)) {
            return NextResponse.json(
                { error: 'Invalid delivery window' },
                { status: 400 }
            )
        }

        // Attempt to save to Supabase
        try {
            const supabase = createServerClient()
            const { error } = await supabase
                .from('subscribers')
                .insert([{ 
                    email,
                    leadership_meeting_day: leadership_meeting_day || null,
                    delivery_window: delivery_window || null,
                    unsubscribed: false
                }])

            if (error) {
                // Check if it's a duplicate email error
                if (error.code === '23505') {
                    return NextResponse.json(
                        { error: 'This email is already subscribed' },
                        { status: 409 }
                    )
                }
                console.warn('Failed to save subscriber to Supabase:', error)
                return NextResponse.json(
                    { error: 'Failed to save subscription' },
                    { status: 500 }
                )
            }
        } catch (dbError) {
            console.warn('Supabase not configured or unreachable:', dbError)
            return NextResponse.json(
                { error: 'Database error' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Subscribe error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
