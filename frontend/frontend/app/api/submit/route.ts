import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function POST(request: NextRequest) {
  try {
    const cookie = request.headers.get('cookie')
    const body = await request.json()
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (cookie) {
      headers['Cookie'] = cookie
    }

    const res = await fetch(`${API_BASE_URL}/submit`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
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
    console.error("Failed to submit answer:", error)
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 }
    )
  }
}
