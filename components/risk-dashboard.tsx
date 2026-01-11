"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  Clock,
  MapPin,
  User,
  Eye,
  Phone,
  Users,
  Move,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { RiskFactor, Recommendation, RiskHistory } from "@/lib/parse-risk"

interface RiskDashboardProps {
  level: number
  previousLevel: number
  factors: RiskFactor[]
  recommendations: Recommendation[]
  history: RiskHistory[]
}

// Animated number component for smooth transitions
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  return <span className={className}>{Math.round(value)}</span>
}

// Get color classes based on risk level
function getRiskColors(level: number) {
  if (level <= 33) {
    return {
      text: "text-risk-low",
      bg: "bg-risk-low",
      bgLight: "bg-risk-low/10",
      border: "border-risk-low",
      gradient: "from-risk-low/20 to-risk-low/5",
      glow: "shadow-risk-low/30",
    }
  } else if (level <= 66) {
    return {
      text: "text-risk-medium",
      bg: "bg-risk-medium",
      bgLight: "bg-risk-medium/10",
      border: "border-risk-medium",
      gradient: "from-risk-medium/20 to-risk-medium/5",
      glow: "shadow-risk-medium/30",
    }
  } else {
    return {
      text: "text-risk-high",
      bg: "bg-risk-high",
      bgLight: "bg-risk-high/10",
      border: "border-risk-high",
      gradient: "from-risk-high/20 to-risk-high/5",
      glow: "shadow-risk-high/30",
    }
  }
}

// Get factor level colors
function getFactorColors(level: "LOW" | "MEDIUM" | "HIGH") {
  switch (level) {
    case "LOW":
      return { text: "text-risk-low", bg: "bg-risk-low/10", border: "border-risk-low/30" }
    case "MEDIUM":
      return { text: "text-risk-medium", bg: "bg-risk-medium/10", border: "border-risk-medium/30" }
    case "HIGH":
      return { text: "text-risk-high", bg: "bg-risk-high/10", border: "border-risk-high/30" }
  }
}

// Get icon component for factor
function getFactorIcon(icon: "clock" | "map" | "person" | "eye") {
  switch (icon) {
    case "clock":
      return Clock
    case "map":
      return MapPin
    case "person":
      return User
    case "eye":
      return Eye
  }
}

// Get icon component for recommendation
function getRecommendationIcon(icon: "shield" | "phone" | "map-pin" | "users" | "alert" | "move") {
  switch (icon) {
    case "shield":
      return Shield
    case "phone":
      return Phone
    case "map-pin":
      return MapPin
    case "users":
      return Users
    case "alert":
      return AlertTriangle
    case "move":
      return Move
  }
}

// Large Circular Risk Meter Component
function RiskMeter({ level, previousLevel }: { level: number; previousLevel: number }) {
  const colors = getRiskColors(level)
  const circumference = 2 * Math.PI * 54 // radius = 54
  const strokeOffset = circumference - (level / 100) * circumference

  const trend = useMemo(() => {
    if (level > previousLevel + 3) return "increasing"
    if (level < previousLevel - 3) return "decreasing"
    return "stable"
  }, [level, previousLevel])

  const TrendIcon = trend === "increasing" ? TrendingUp : trend === "decreasing" ? TrendingDown : Minus
  const StatusIcon = level <= 33 ? Shield : level <= 66 ? AlertCircle : AlertTriangle

  return (
    <Card
      className={cn(
        "glass rounded-2xl p-6 flex flex-col items-center transition-all duration-500",
        level > 66 && "ring-2 ring-risk-high/50 shadow-lg shadow-risk-high/20",
      )}
    >
      <h3 className="text-sm font-semibold text-foreground/80 mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        Current Risk Level
      </h3>

      {/* Circular Progress */}
      <div className="relative w-36 h-36 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
          {/* Animated progress circle */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            className={cn("transition-all duration-1000 ease-out", colors.text)}
            style={{
              filter: level > 66 ? "drop-shadow(0 0 8px currentColor)" : "none",
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <StatusIcon className={cn("w-6 h-6 mb-1", colors.text)} />
          <div className="flex items-baseline">
            <AnimatedNumber value={level} className={cn("text-3xl font-bold", colors.text)} />
            <span className={cn("text-xl font-bold", colors.text)}>%</span>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <Badge
        variant="outline"
        className={cn("font-medium border-2 mb-3", colors.border, colors.text, level > 66 && "animate-pulse")}
      >
        {level <= 33 ? "Low Risk" : level <= 66 ? "Medium Risk" : "High Risk"}
      </Badge>

      {/* Trend Indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <TrendIcon
          className={cn(
            "w-4 h-4",
            trend === "increasing"
              ? "text-risk-high"
              : trend === "decreasing"
                ? "text-risk-low"
                : "text-muted-foreground",
          )}
        />
        <span>
          {trend === "increasing" ? "Risk increasing" : trend === "decreasing" ? "Risk decreasing" : "Risk stable"}
        </span>
      </div>
    </Card>
  )
}

// Risk Factor Card Component
function FactorCard({ factor }: { factor: RiskFactor }) {
  const Icon = getFactorIcon(factor.icon)
  const colors = getFactorColors(factor.level)

  return (
    <div
      className={cn(
        "glass rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02]",
        colors.border,
        colors.bg,
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colors.bg)}>
          <Icon className={cn("w-5 h-5", colors.text)} />
        </div>
        <Badge variant="outline" className={cn("text-xs", colors.border, colors.text)}>
          {factor.level}
        </Badge>
      </div>
      <h4 className="text-sm font-medium text-foreground mb-1">{factor.name}</h4>

      {/* Mini progress bar */}
      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", colors.bg)}
          style={{ width: `${factor.percentage}%` }}
        />
      </div>
      <p className={cn("text-xs mt-1 font-medium", colors.text)}>{Math.round(factor.percentage)}%</p>
    </div>
  )
}

// Risk Factors Grid Component
function RiskFactors({ factors }: { factors: RiskFactor[] }) {
  return (
    <Card className="glass rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-foreground/80 mb-4 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-primary" />
        Risk Factors Breakdown
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {factors.map((factor, index) => (
          <FactorCard key={index} factor={factor} />
        ))}
      </div>
    </Card>
  )
}

// Safety Score History Sparkline Component
function SafetyTrend({ history }: { history: RiskHistory[] }) {
  const displayHistory = history.length > 0 ? history : [{ id: 1, percentage: 0, timestamp: new Date() }]

  // Calculate SVG path for sparkline
  const maxValue = 100
  const width = 200
  const height = 60
  const padding = 10

  const points = displayHistory.map((item, index) => {
    const x = padding + (index / Math.max(displayHistory.length - 1, 1)) * (width - padding * 2)
    const y = height - padding - (item.percentage / maxValue) * (height - padding * 2)
    return { x, y, percentage: item.percentage }
  })

  // Create smooth curve path
  const pathD =
    points.length > 1
      ? points.reduce((path, point, index) => {
          if (index === 0) return `M ${point.x} ${point.y}`
          const prev = points[index - 1]
          const cpX = (prev.x + point.x) / 2
          return `${path} Q ${cpX} ${prev.y}, ${cpX} ${(prev.y + point.y) / 2} T ${point.x} ${point.y}`
        }, "")
      : `M ${points[0].x} ${points[0].y}`

  // Get gradient color based on current level
  const currentLevel = displayHistory[displayHistory.length - 1]?.percentage || 0
  const colors = getRiskColors(currentLevel)

  return (
    <Card className="glass rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-foreground/80 mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        Your Safety Trend
      </h3>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16">
          {/* Grid lines */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="currentColor"
            strokeWidth="1"
            className="text-muted/20"
          />
          <line
            x1={padding}
            y1={height / 2}
            x2={width - padding}
            y2={height / 2}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4"
            className="text-muted/10"
          />

          {/* Gradient fill under curve */}
          <defs>
            <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" className={colors.text} stopOpacity="0.3" />
              <stop offset="100%" className={colors.text} stopOpacity="0" />
            </linearGradient>
          </defs>

          {points.length > 1 && (
            <path
              d={`${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
              fill="url(#sparklineGradient)"
            />
          )}

          {/* Line path */}
          <path
            d={pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("transition-all duration-500", colors.text)}
          />

          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle cx={point.x} cy={point.y} r="4" fill="currentColor" className={colors.text} />
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={cn("text-background", colors.text)}
                opacity="0.5"
              />
            </g>
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-2">
          {displayHistory.slice(-5).map((_, index) => (
            <span key={index}>#{index + 1}</span>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
        <span className="text-xs text-muted-foreground">Last {displayHistory.length} assessments</span>
        <span className={cn("text-sm font-semibold", colors.text)}>Current: {currentLevel}%</span>
      </div>
    </Card>
  )
}

// Actionable Recommendations Component
function ActionableRecommendations({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <Card className="glass rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-foreground/80 mb-4 flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        Safety Actions
      </h3>

      <div className="space-y-3">
        {recommendations.slice(0, 3).map((rec, index) => {
          const Icon = getRecommendationIcon(rec.icon)
          const priorityColors =
            index === 0
              ? "bg-primary text-primary-foreground"
              : index === 1
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground"

          return (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl transition-all duration-300",
                "bg-muted/30 hover:bg-muted/50 border border-border/30",
                index === 0 && "ring-1 ring-primary/30",
              )}
            >
              {/* Priority number */}
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  priorityColors,
                )}
              >
                {rec.priority}
              </div>

              {/* Icon */}
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  index === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Action text */}
              <p className="text-sm text-foreground leading-snug flex-1">{rec.action}</p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// Main Risk Dashboard Component
export function RiskDashboard({ level, previousLevel, factors, recommendations, history }: RiskDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Risk Breakdown</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-border via-border to-transparent" />
      </div>

      {/* Responsive Layout: Mobile (1 col) / Tablet (2 col) / Desktop (3 col) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Risk Meter - Always first */}
        <div className="md:col-span-1">
          <RiskMeter level={level} previousLevel={previousLevel} />
        </div>

        {/* Risk Factors */}
        <div className="md:col-span-1">
          <RiskFactors factors={factors} />
        </div>

        {/* Recommendations & Trend - On desktop, stacked in third column */}
        <div className="md:col-span-2 xl:col-span-1 space-y-4">
          <ActionableRecommendations recommendations={recommendations} />
          <SafetyTrend history={history} />
        </div>
      </div>
    </div>
  )
}
