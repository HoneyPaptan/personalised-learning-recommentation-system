import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get('cookie')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (cookie) {
      headers['Cookie'] = cookie
    }

    const res = await fetch(`${API_BASE_URL}/question`, {
      headers,
      credentials: 'include',
    })

    const data = await res.json()
    const response = NextResponse.json(data)
    
    // Forward cookies from Flask to browser
    const setCookie = res.headers.get('set-cookie')
    if (setCookie) {
      response.headers.set('Set-Cookie', setCookie)
    }

    return response
  } catch (error) {
    console.error("Failed to fetch question:", error)
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 }
    )
  }
}
