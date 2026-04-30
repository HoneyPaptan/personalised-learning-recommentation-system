import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get('cookie')
    const headers: HeadersInit = {}
    if (cookie) {
      headers['Cookie'] = cookie
    }

    const res = await fetch(`${API_BASE_URL}/api/dashboard-data`, {
      headers,
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }

    const response = NextResponse.json(data)
    const setCookie = res.headers.get('set-cookie')
    if (setCookie) {
      response.headers.set('Set-Cookie', setCookie)
    }

    return response
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error)
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 }
    )
  }
}
