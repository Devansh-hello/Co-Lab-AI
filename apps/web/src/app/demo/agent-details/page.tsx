"use client"

import { useState } from "react"
import {
  AgentsDetailsStep,
  AgentTaskList,
  AgentTextResult,
  AgentTableResult,
  AgentImageGrid,
  type AgentTask,
} from "../../../components/AgentsDetailsStep"

const LINKEDIN_TASKS: AgentTask[] = [
  { id: 1, text: "Analyze customer database and segment users based on engagement history" },
  { id: 2, text: "Generate personalized email content using AI templates" },
  { id: 3, text: "Schedule optimal send times based on user timezone and activity patterns" },
  { id: 4, text: "Implement A/B testing for subject lines to determine the most effective messaging" },
  { id: 5, text: "Analyze engagement metrics to refine future campaign strategies" },
  { id: 6, text: "Monitor campaign performance and adjust strategy in real-time", muted: true },
  { id: 7, text: "Generate comprehensive analytics report with actionable insights", muted: true },
]

const OUTCOME_TABLE = [
  {
    header: "Name",
    rows: [
      "Aarav Mehta",
      "Priya Sharma",
      "Dev Kapoor",
      "Dev Kapoor",
      "Dev Kapoor",
      "Dev Kapoor",
      "Dev Kapoor",
      "Dev Kapoor",
      "Dev Kapoor",
      "Dev Kapoor",
    ],
  },
  {
    header: "Company",
    rows: [
      "Zomato",
      "Zomato",
      "Zomato",
      "Zomato",
      "Zomato",
      "Zomato",
      "Zomato",
      "Zomato",
      "Razorpay",
      "Swiggy",
    ],
  },
  {
    header: "Status",
    rows: ["New", "Contacted", "Left"],
    width: 196,
  },
]

const SAMPLE_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1559028012-481c04fa702d?w=600&auto=format&fit=crop&q=60",
    url: "awwwards.com",
  },
  {
    src: "https://images.unsplash.com/photo-1561070791-2526d30994b8?w=600&auto=format&fit=crop&q=60",
    url: "mobbin.com",
  },
  {
    src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop&q=60",
    url: "dribble.in",
  },
]

const COMMON = {
  title: "Linkedin comment connector",
  description:
    "Automatically creates and sends personalized email campaigns based on customer segments and behavior patterns.",
  credits: 15,
}

const VARIANTS = [
  { id: "v1", label: "V1 — task list (current)" },
  { id: "v2", label: "V2 — task list with tabs" },
  { id: "text", label: "Text result" },
  { id: "table", label: "Table result" },
  { id: "images", label: "Image result" },
] as const

type VariantId = (typeof VARIANTS)[number]["id"]

export default function AgentDetailsDemoPage() {
  const [active, setActive] = useState<VariantId>("v1")
  const [step, setStep] = useState(2)

  return (
    <div className="min-h-screen bg-background bg-grainy text-foreground px-6 py-10 md:px-10">
      <div className="max-w-[1072px] mx-auto flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-[32px] text-white/90">Agent details step</h1>
          <p className="text-[14px] text-white/55 max-w-[640px]">
            Component for the agent selection step in the user flow. Switch variants below to preview each
            result type.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setActive(v.id)}
              className={
                "px-4 py-2 rounded-lg border text-[13px] font-medium transition-colors duration-[180ms] cursor-pointer " +
                (active === v.id
                  ? "bg-white/[0.06] border-white/20 text-white"
                  : "bg-transparent border-white/[0.08] text-white/55 hover:text-white hover:border-white/15")
              }
            >
              {v.label}
            </button>
          ))}
        </div>

        <AgentsDetailsStep
          {...COMMON}
          showTabs={active !== "v1"}
          currentStep={step}
          totalSteps={2}
          onPrev={() => setStep((s) => Math.max(1, s - 1))}
          onNext={() => setStep((s) => Math.min(2, s + 1))}
          onDeploy={() => console.log("deploy")}
          onFindAnother={() => console.log("find another")}
        >
          {active === "v1" && <AgentTaskList tasks={LINKEDIN_TASKS} />}
          {active === "v2" && <AgentTaskList tasks={LINKEDIN_TASKS} boxed />}
          {active === "text" && (
            <AgentTextResult>
              {"\uD83D\uDE80 Excited to share our Q1 results with the team!\n\n" +
                "Our revenue grew 34% compared to last quarter, and customer satisfaction scores hit an all-time high of 94%.\n\n" +
                "Key highlights:\n" +
                "• Launched 3 major product features\n" +
                "• Expanded to 5 new markets\n" +
                "• Grew team by 40% with incredible talent\n\n" +
                "Couldn't be more proud of what we've built together. Here's to an even stronger Q2! \uD83D\uDCAA\n\n" +
                "#Growth #Teamwork #Innovation"}
            </AgentTextResult>
          )}
          {active === "table" && <AgentTableResult columns={OUTCOME_TABLE} />}
          {active === "images" && <AgentImageGrid images={SAMPLE_IMAGES} />}
        </AgentsDetailsStep>
      </div>
    </div>
  )
}
