"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Terminal, CheckCircle, XCircle, RefreshCw, Play, Server, Database, Zap } from "lucide-react"

interface DebugResult {
  test: string
  status: "pending" | "success" | "error"
  message: string
  latency?: number
}

const initialTests: DebugResult[] = [
  { test: "API Connection", status: "pending", message: "Ready to test..." },
  { test: "Question Fetch", status: "pending", message: "Ready to test..." },
  { test: "Submit Answer", status: "pending", message: "Ready to test..." },
  { test: "Session Management", status: "pending", message: "Ready to test..." },
]

export default function DebugPage() {
  const [results, setResults] = useState<DebugResult[]>(initialTests)
  const [running, setRunning] = useState(false)

  const runTests = async () => {
    setRunning(true)
    const newResults = [...initialTests]
    setResults(newResults)

    // Test 1: API Connection
    const start1 = Date.now()
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test User" }),
      })
      const latency = Date.now() - start1
      if (res.ok) {
        newResults[0] = { test: "API Connection", status: "success", message: "Connected successfully", latency }
      } else {
        newResults[0] = { test: "API Connection", status: "error", message: `Failed: ${res.status}`, latency }
      }
    } catch (error) {
      newResults[0] = { test: "API Connection", status: "error", message: `Error: ${error}`, latency: Date.now() - start1 }
    }
    setResults([...newResults])

    // Test 2: Question Fetch
    const start2 = Date.now()
    try {
      const res = await fetch("/api/question")
      const latency = Date.now() - start2
      if (res.ok) {
        const data = await res.json()
        newResults[1] = { test: "Question Fetch", status: "success", message: `Got: ${data.question_text || "Question"}`, latency }
      } else {
        newResults[1] = { test: "Question Fetch", status: "error", message: `Failed: ${res.status}`, latency }
      }
    } catch (error) {
      newResults[1] = { test: "Question Fetch", status: "error", message: `Error: ${error}`, latency: Date.now() - start2 }
    }
    setResults([...newResults])

    // Test 3: Submit Answer
    const start3 = Date.now()
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: 1,
          response_time: 10,
          skill: "Addition",
          question_text: "2 + 2 = ?",
        }),
      })
      const latency = Date.now() - start3
      if (res.ok) {
        newResults[2] = { test: "Submit Answer", status: "success", message: "Answer submitted", latency }
      } else {
        newResults[2] = { test: "Submit Answer", status: "error", message: `Failed: ${res.status}`, latency }
      }
    } catch (error) {
      newResults[2] = { test: "Submit Answer", status: "error", message: `Error: ${error}`, latency: Date.now() - start3 }
    }
    setResults([...newResults])

    // Test 4: Session Management
    const start4 = Date.now()
    try {
      const res = await fetch("/api/start-session", { method: "POST" })
      const latency = Date.now() - start4
      if (res.ok) {
        newResults[3] = { test: "Session Management", status: "success", message: "Session started", latency }
      } else {
        newResults[3] = { test: "Session Management", status: "error", message: `Failed: ${res.status}`, latency }
      }
    } catch (error) {
      newResults[3] = { test: "Session Management", status: "error", message: `Error: ${error}`, latency: Date.now() - start4 }
    }
    setResults([...newResults])

    setRunning(false)
  }

  const successCount = results.filter(r => r.status === "success").length
  const errorCount = results.filter(r => r.status === "error").length

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Terminal className="size-8 text-primary" />
          Debug Console
        </h1>
        <p className="text-lg text-muted-foreground">
          Test API connections and system functionality
        </p>
      </div>

      <Card className="border-none bg-card shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Tests</CardTitle>
              <CardDescription>
                Run diagnostics on all system components
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {successCount > 0 && (
                <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <CheckCircle className="size-3 mr-1" />
                  {successCount} Passed
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive">
                  <XCircle className="size-3 mr-1" />
                  {errorCount} Failed
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={runTests}
            disabled={running}
            size="lg"
            className="w-full"
          >
            {running ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="size-4" />
                Run All Tests
              </>
            )}
          </Button>

          <div className="space-y-2">
            {results.map((result) => (
              <div
                key={result.test}
                className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {result.status === "success" && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                      <CheckCircle className="size-4 text-green-500" />
                    </div>
                  )}
                  {result.status === "error" && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                      <XCircle className="size-4 text-red-500" />
                    </div>
                  )}
                  {result.status === "pending" && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <Zap className="size-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">{result.test}</p>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {result.latency && (
                    <Badge variant="outline" className="text-xs">
                      {result.latency}ms
                    </Badge>
                  )}
                  {result.status === "success" && (
                    <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                      OK
                    </Badge>
                  )}
                  {result.status === "error" && (
                    <Badge variant="destructive">FAIL</Badge>
                  )}
                  {result.status === "pending" && (
                    <Badge variant="secondary">WAIT</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <span>Backend URL: {process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </CardFooter>
      </Card>
    </div>
  )
}