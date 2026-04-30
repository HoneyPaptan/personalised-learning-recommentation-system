"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, ArrowRight, RefreshCw, CheckCircle2, XCircle, BrainCircuit, Timer, Target, Sparkles, AlertCircle } from "lucide-react"

interface Question {
  question_text?: string
  question?: string
  skill: string
  answer: number
}

export default function QuizPage() {
  const [question, setQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [mastery, setMastery] = useState(0)
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [score, setScore] = useState<"correct" | "incorrect" | null>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (sessionActive && !sessionEnded && questionStartTime && !score && !loading) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - questionStartTime) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [sessionActive, sessionEnded, questionStartTime, score, loading])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const fetchQuestion = useCallback(async () => {
    setLoading(true)
    setFeedback(null)
    setAnswer("")
    setScore(null)
    try {
      const res = await fetch("/api/question")
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`)
      }
      const data = await res.json()
      const questionData = {
        ...data,
        question_text: data.question_text || data.question || "No question",
        skill: data.skill || "General",
        answer: data.answer || 0,
      }
      setQuestion(questionData)
      setQuestionStartTime(Date.now())
    } catch (error) {
      console.error("Failed to fetch question:", error)
      setQuestion({
        question_text: "2 + 2 = ?",
        skill: "Addition",
        answer: 4,
      })
      setQuestionStartTime(Date.now())
    } finally {
      setLoading(false)
    }
  }, [])

  const startSession = useCallback(async () => {
    try {
      let res = await fetch("/api/start-session", { method: "POST" })
      
      if (!res.ok) {
        await fetch("/api/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Learner" }),
        })
        await fetch("/api/start-session", { method: "POST" })
      }

      setSessionActive(true)
      setQuestionCount(0)
      setSessionEnded(false)
      fetchQuestion()
    } catch (error) {
      console.error("Failed to start session:", error)
    }
  }, [fetchQuestion])

  const submitAnswer = useCallback(async () => {
    if (!question || questionStartTime === null) return

    const responseTime = (Date.now() - questionStartTime) / 1000
    const isCorrect = parseInt(answer) === question.answer
    setScore(isCorrect ? "correct" : "incorrect")

    const newCount = questionCount + 1
    setQuestionCount(newCount)

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: isCorrect ? 1 : 0,
          response_time: responseTime,
          skill: question.skill,
          question_text: question.question_text,
        }),
      })
      const data = await res.json()
      setMastery(data.mastery)
      setFeedback(data.feedback)
    } catch (error) {
      console.error("Failed to submit answer:", error)
    }
  }, [question, answer, questionStartTime, questionCount])

  // Auto-advance after showing result, end session after 5 questions
  useEffect(() => {
    if (score) {
      const timer = setTimeout(() => {
        setScore(null)
        setFeedback(null)
        setAnswer("")

        // End session after 5 questions
        if (questionCount >= 5) {
          setSessionEnded(true)
          setSessionActive(false)
        } else {
          fetchQuestion()
        }
      }, 2500)

      return () => clearTimeout(timer)
    }
  }, [score, fetchQuestion, questionCount])

  // Auto-start session
  useEffect(() => {
    if (!sessionActive && !sessionEnded) {
      startSession()
    }

    const timeout = setTimeout(() => {
      setLoading(false)
      if (!question) {
        setQuestion({
          question_text: "2 + 2 = ?",
          skill: "Addition",
          answer: 4,
        })
        setQuestionStartTime(Date.now())
      }
    }, 3000)

    return () => clearTimeout(timeout)
  }, [sessionActive, sessionEnded, startSession, question])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && answer && !score) {
      submitAnswer()
    }
  }

  if (sessionEnded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in zoom-in duration-500 w-full max-w-2xl mx-auto space-y-12">
        <div className="text-center space-y-6">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 shadow-lg border border-primary/20">
            <Sparkles className="size-12 text-primary" />
          </div>
          <div className="space-y-3">
            <h2 className="text-5xl sm:text-6xl font-bold tracking-tighter">Session Complete</h2>
            <p className="text-xl text-muted-foreground font-medium">
              You've successfully completed 5 practice questions.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg mx-auto">
          <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 border-muted/50 bg-muted/10 shadow-sm">
            <Target className="size-8 text-primary mb-4" />
            <span className="text-5xl font-bold tracking-tighter mb-2">5</span>
            <span className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Questions</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 border-muted/50 bg-muted/10 shadow-sm">
            <BrainCircuit className="size-8 text-primary mb-4" />
            <span className="text-5xl font-bold tracking-tighter mb-2">{Math.round(mastery * 100)}%</span>
            <span className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Mastery</span>
          </div>
        </div>

        <div className="w-full max-w-xs mx-auto pt-6">
          <Button onClick={() => { setSessionEnded(false); setQuestionCount(0); startSession() }} size="lg" className="w-full h-16 text-lg rounded-2xl shadow-xl transition-transform active:scale-95">
            <Play className="size-6 mr-3" fill="currentColor" />
            Start Next Session
          </Button>
        </div>
      </div>
    )
  }

  if (!sessionActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in zoom-in duration-500 w-full max-w-2xl mx-auto space-y-12">
        <div className="text-center space-y-6">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 shadow-lg border border-primary/20">
            <BrainCircuit className="size-12 text-primary" />
          </div>
          <div className="space-y-3">
            <h2 className="text-5xl sm:text-6xl font-bold tracking-tighter">Practice Arena</h2>
            <p className="text-xl text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
              Sharpen your math skills with real-time AI feedback and dynamic difficulty.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg mx-auto">
          <div className="flex-1 flex flex-col items-center text-center justify-center gap-3 p-8 rounded-[2rem] border-2 border-muted/50 bg-muted/10 shadow-sm">
            <Target className="size-8 text-primary" />
            <span className="font-semibold text-lg">5 Questions</span>
            <span className="text-sm text-muted-foreground">per session</span>
          </div>
          <div className="flex-1 flex flex-col items-center text-center justify-center gap-3 p-8 rounded-[2rem] border-2 border-muted/50 bg-muted/10 shadow-sm">
            <Timer className="size-8 text-primary" />
            <span className="font-semibold text-lg">Tracked Time</span>
            <span className="text-sm text-muted-foreground">response analysis</span>
          </div>
        </div>

        <div className="w-full max-w-xs mx-auto pt-6">
          <Button onClick={startSession} size="lg" className="w-full h-16 text-lg rounded-2xl shadow-xl transition-transform active:scale-95">
            <Play className="size-6 mr-3" fill="currentColor" />
            Initialize Session
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto py-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Active Session</h2>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <Target className="size-4 text-primary/70" /> 
              {question?.skill || "Evaluating..."}
            </span>
            <span className="text-muted-foreground/30">•</span>
            <span className="flex items-center gap-1.5">
              <BrainCircuit className="size-4 text-primary/70" /> 
              {Math.round(mastery * 100)}% Mastery
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 border-primary/20 text-primary bg-primary/5">
            <Timer className="size-3.5" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </Badge>
          <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium">
            Q {questionCount + 1} of 5
          </Badge>
        </div>
      </div>

      <div className="relative py-12 sm:py-20 flex flex-col items-center justify-center min-h-[60vh]">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <RefreshCw className="animate-spin size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">Generating next question...</p>
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom-8 fade-in duration-700 w-full">
            
            {/* Floating AI Feedback Bubble */}
            {score && (
              <div className="fixed top-24 right-6 lg:right-12 z-50 animate-in slide-in-from-right-8 fade-in zoom-in-95 duration-500">
                <div className={`max-w-xs sm:max-w-sm p-5 rounded-2xl rounded-tr-sm shadow-2xl border backdrop-blur-xl ${
                  score === "correct" 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                    : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-background/60 rounded-full shrink-0 shadow-sm border border-foreground/5">
                      {score === "correct" ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
                    </div>
                    <div className="space-y-1.5 pt-0.5">
                      <h4 className="font-semibold text-sm tracking-tight">
                        {score === "correct" ? "Excellent work!" : "Not quite right."}
                      </h4>
                      {feedback && (
                        <p className="text-xs opacity-90 leading-relaxed font-medium">{feedback}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center mb-12">
              <p className="text-5xl sm:text-7xl font-bold tracking-tighter text-foreground drop-shadow-sm">
                {question?.question_text || "Loading..."}
              </p>
            </div>

            <div className="relative max-w-sm mx-auto group mb-8">
              <Input
                type="number"
                placeholder="Enter your answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-2xl h-20 px-8 pr-20 bg-muted/10 border-2 transition-colors focus-visible:border-primary rounded-2xl text-center shadow-sm"
                autoFocus
                disabled={!!score}
              />
              <Button
                size="icon"
                onClick={submitAnswer}
                disabled={!answer || !!score}
                className="absolute right-3 top-3 bottom-3 h-14 w-14 rounded-xl shadow-md transition-transform active:scale-95"
              >
                <ArrowRight className="size-6" />
              </Button>
            </div>

            <div className="flex justify-between items-center max-w-sm mx-auto px-2">
              <Button variant="ghost" size="sm" onClick={fetchQuestion} disabled={loading || !!score} className="text-muted-foreground hover:text-foreground transition-colors h-8 text-xs">
                <RefreshCw className={`size-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Skip Question
              </Button>
              <div className="text-[10px] text-muted-foreground font-medium flex items-center">
                Press <kbd className="mx-1.5 px-1.5 py-0.5 rounded border bg-muted text-[9px] uppercase font-bold tracking-wider">Enter</kbd> to submit
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}