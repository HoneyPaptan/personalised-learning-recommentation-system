"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Minus, Award, BarChart3, Calendar, Target, Flame } from "lucide-react"

interface SkillData {
  name: string
  mastery: number
  trend: "up" | "down" | "stable"
  questions: number
  correct: number
  accuracy: number
}

interface ProfileData {
  mastery: number
  total_questions: number
  correct_answers: number
  sessions: number
  streak: number
  skills: SkillData[]
  mastery_trend: Array<{ created_at: string; mastery_h: number }>
}

function HeatmapCard({ name, mastery, trend, questions, correct, accuracy }: SkillData) {
  const getBarColor = (value: number) => {
    if (value < 0.3) return "bg-red-500"
    if (value < 0.5) return "bg-orange-500"
    if (value < 0.7) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="size-4 text-green-500" />
    if (trend === "down") return <TrendingDown className="size-4 text-red-500" />
    return <Minus className="size-4 text-muted-foreground" />
  }

  return (
    <Card className="border-none bg-card hover:bg-card/90 transition-colors shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {questions} questions • {correct} correct • {accuracy}%
            </p>
          </div>
          {getTrendIcon(trend)}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mastery</span>
            <span className="font-semibold text-foreground">{Math.round(mastery * 100)}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${getBarColor(mastery)} transition-all duration-500`}
              style={{ width: `${mastery * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/profile-data")
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Your Progress</h1>
        <p className="text-lg text-muted-foreground">
          Track your learning journey and skill mastery
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-none bg-card shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Target className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overall Mastery</p>
                <p className="text-2xl font-bold text-foreground">
                  {data ? Math.round(data.mastery * 100) : 0}%
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Progress value={data ? data.mastery * 100 : 0} className="h-1.5" />
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                <BarChart3 className="size-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="text-2xl font-bold text-foreground">
                  {data?.total_questions || 0}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              {data?.correct_answers || 0} correct ({data ? Math.round((data.correct_answers / data.total_questions) * 100) : 0}%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Calendar className="size-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold text-foreground">{data?.sessions || 0}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Avg {data && data.sessions > 0 ? Math.round(data.total_questions / data.sessions) : 0} questions/session
            </p>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                <Flame className="size-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold text-foreground">{data?.streak || 0} days</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Keep it going!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Skill Heatmap */}
      <Card className="border-none bg-card shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Award className="size-5 text-primary" />
            <div>
              <CardTitle className="text-xl">Skill Breakdown</CardTitle>
              <CardDescription>
                Your performance across different math skills
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {data?.skills?.map((skill) => (
              <HeatmapCard key={skill.name} {...skill} />
            )) || (
              <p className="text-muted-foreground">No data yet. Start a quiz to see your progress!</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </span>
          <Badge variant="secondary">30-day view</Badge>
        </CardFooter>
      </Card>
    </div>
  )
}