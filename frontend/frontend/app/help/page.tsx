import { CircleHelp } from "lucide-react"

export default function HelpPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 py-32 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <CircleHelp className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight">Help Center</h2>
      <p className="text-muted-foreground max-w-md text-lg mt-2">
        Support articles and FAQs are coming soon!
      </p>
    </div>
  )
}
