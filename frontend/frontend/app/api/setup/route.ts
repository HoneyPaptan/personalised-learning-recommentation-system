import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // First, call Flask setup to create user and set session
    const setupRes = await fetch(`${API_BASE_URL}/setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: body.name || "Learner" }),
    })

    const data = await setupRes.json()
    
    // Create response and forward the session cookie
    const response = NextResponse.json(data)
    const setCookie = setupRes.headers.get('set-cookie')
    if (setCookie) {
      response.headers.set('Set-Cookie', setCookie)
    }

    return response
  } catch (error) {
    console.error("Failed to setup user:", error)
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 }
    )
  }
}
