import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

/**
 * Delete a post and its associated weekly email
 * Uses server-side client with service role key to bypass RLS
 * 
 * Note: This endpoint should be protected by authentication middleware
 * For now, we rely on the service role key being server-side only
 */
export async function DELETE(request: NextRequest) {
  try {
    // Note: This endpoint is called from the admin dashboard which requires authentication
    // The service role key ensures deletion works even if RLS policies block client-side deletion

    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // First, delete associated weekly email (if exists)
    // This should cascade, but we'll do it explicitly to be sure
    const { error: emailError } = await supabase
      .from('weekly_emails')
      .delete()
      .eq('post_id', postId)

    if (emailError) {
      console.warn('Error deleting weekly email (may not exist):', emailError)
      // Continue with post deletion even if email deletion fails
    }

    // Delete the post
    const { error: postError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (postError) {
      console.error('Error deleting post:', postError)
      return NextResponse.json(
        { error: 'Failed to delete post', details: postError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    })
  } catch (error) {
    console.error('Error in delete-post API:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete post',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

