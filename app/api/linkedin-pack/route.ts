/**
 * LinkedIn Pack API
 * 
 * GET: Fetch LinkedIn Pack by post ID
 * PATCH: Update LinkedIn Pack fields and status
 * 
 * Note: This endpoint is called from the admin dashboard which requires authentication
 * The service role key ensures operations work even if RLS policies block client-side access
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getLinkedInPackByPostId, 
  updateLinkedInPack 
} from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const pack = await getLinkedInPackByPostId(postId)

    if (!pack) {
      return NextResponse.json(
        { error: 'LinkedIn Pack not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(pack)
  } catch (error) {
    console.error('Error in LinkedIn Pack GET API:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch LinkedIn Pack',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'LinkedIn Pack ID is required' },
        { status: 400 }
      )
    }

    // Validate status if provided
    if (updates.status && !['draft', 'edited', 'posted'].includes(updates.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: draft, edited, or posted' },
        { status: 400 }
      )
    }

    // If status is being changed to 'edited' and it's currently 'draft', that's fine
    // If status is being changed to 'posted', posted_at will be set automatically

    const updatedPack = await updateLinkedInPack(id, updates)

    if (!updatedPack) {
      return NextResponse.json(
        { error: 'LinkedIn Pack not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      pack: updatedPack,
    })
  } catch (error) {
    console.error('Error in LinkedIn Pack PATCH API:', error)
    return NextResponse.json(
      {
        error: 'Failed to update LinkedIn Pack',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

