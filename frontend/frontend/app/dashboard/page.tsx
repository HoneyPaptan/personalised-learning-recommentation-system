"use client"

import { useState, useEffect } from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Play, Target, BarChart4 } from "lucide-react"
import Link from "next/link"

interface DashboardData {
  mastery: number
  total_questions: number
  correct_answers: number
  sessions: number
  streak: number
  heatmap: Record<string, number>
  mastery_trend: { created_at: string, mastery_h: number }[]
  user_name: string
}

export default function Page() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/dashboard-data")
        if (res.ok) {
          const json = await res.json()
          setDashboardData(json)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
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
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome Back, {dashboardData?.user_name || "Learner"}!
              </h1>
              <p className="text-muted-foreground mt-1 text-lg">
                Ready to level up your math skills today?
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/quiz" className="flex items-center gap-2">
                <Play className="size-5" fill="currentColor" />
                <span>Start Practice Session</span>
              </Link>
            </Button>
          </div>
          
          <SectionCards data={dashboardData || undefined} />
          
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive chartData={dashboardData?.mastery_trend || []} />
          </div>

          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>Ready to Practice?</CardTitle>
                <CardDescription>
                  Start a focused practice session to improve specific skills
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center gap-3 rounded-lg border p-4">
                    <Target className="text-primary size-6" />
                    <div>
                      <h3 className="font-semibold text-foreground">Skill Focus</h3>
                      <p className="text-sm text-muted-foreground">
                        Practice specific operations based on your weak areas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border p-4">
                    <BarChart4 className="text-primary size-6" />
                    <div>
                      <h3 className="font-semibold text-foreground">Progress Tracking</h3>
                      <p className="text-sm text-muted-foreground">
                        View detailed analytics and improvement trends
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Button
                    asChild
                    className="flex-1 flex-col items-center justify-center gap-2 p-6 h-full"
                  >
                    <Link href="/quiz" className="text-center">
                      <Play className="size-6" />
                      <span className="font-semibold text-lg">Start Practice Session</span>
                      <span className="text-xs text-primary-foreground/80">
                        5 questions per session
                      </span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center text-sm border-t pt-6">
                <span className="text-muted-foreground">
                  {dashboardData?.sessions || 0} sessions completed
                </span>
                <Button variant="outline">
                  View Full History
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
