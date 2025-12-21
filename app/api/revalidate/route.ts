import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * Revalidate Next.js cache for specific paths
 * Used after deleting posts to clear static cache
 */
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const path = url.searchParams.get('path')

    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      )
    }

    revalidatePath(path)

    return NextResponse.json({
      success: true,
      message: `Revalidated path: ${path}`,
    })
  } catch (error) {
    console.error('Error revalidating path:', error)
    return NextResponse.json(
      {
        error: 'Failed to revalidate',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

