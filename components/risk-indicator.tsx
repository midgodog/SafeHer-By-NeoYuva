"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Shield, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMemo, useState, useEffect, useRef } from "react"

interface RiskIndicatorProps {
  level: number
  previousLevel?: number
}

function getRiskData(level: number) {
  if (level <= 33) {
    return {
      status: "Low",
      color: "bg-risk-low",
      textColor: "text-risk-low",
      borderColor: "border-risk-low",
      icon: Shield,
      message: "You appear to be in a safe environment. Stay aware of your surroundings and trust your instincts.",
      gradient: "from-risk-low/20 to-risk-low/5",
      ringColor: "ring-risk-low/30",
    }
  } else if (level <= 66) {
    return {
      status: "Medium",
      color: "bg-risk-medium",
      textColor: "text-risk-medium",
      borderColor: "border-risk-medium",
      icon: AlertCircle,
      message:
        "Stay alert and trust your instincts. Consider sharing your location with someone you trust and stay in well-lit areas.",
      gradient: "from-risk-medium/20 to-risk-medium/5",
      ringColor: "ring-risk-medium/30",
    }
  } else {
    return {
      status: "High",
      color: "bg-risk-high",
      textColor: "text-risk-high",
      borderColor: "border-risk-high",
      icon: AlertTriangle,
      message:
        "Your safety may be at risk. Consider using emergency resources, calling for help, or activating SOS immediately.",
      gradient: "from-risk-high/20 to-risk-high/5",
      ringColor: "ring-risk-high/30",
    }
  }
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValue = useRef(value)

  useEffect(() => {
    const startValue = prevValue.current
    const endValue = value
    const duration = 700
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = Math.round(startValue + (endValue - startValue) * easeOutQuart)

      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
    prevValue.current = value
  }, [value])

  return <span className={className}>{displayValue}</span>
}

export function RiskIndicator({ level, previousLevel }: RiskIndicatorProps) {
  const {
    status,
    color,
    textColor,
    borderColor,
    icon: Icon,
    message,
    gradient,
    ringColor,
  } = useMemo(() => getRiskData(level), [level])

  // Calculate the stroke offset for the circular progress
  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeOffset = circumference - (level / 100) * circumference

  // Determine trend
  const trend = useMemo(() => {
    if (previousLevel === undefined) return "stable"
    if (level > previousLevel + 5) return "increasing"
    if (level < previousLevel - 5) return "decreasing"
    return "stable"
  }, [level, previousLevel])

  const TrendIcon = trend === "increasing" ? TrendingUp : trend === "decreasing" ? TrendingDown : Minus

  return (
    <Card
      className={cn(
        "glass rounded-2xl shadow-xl overflow-hidden transition-all duration-500",
        level > 66 && "pulse-animation ring-2",
        ringColor,
      )}
    >
      {/* Gradient Header with animated width */}
      <div className="h-2 bg-muted/30 overflow-hidden">
        <div className={cn("h-full transition-all duration-700 ease-out", color)} style={{ width: `${level}%` }} />
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Risk Assessment</h3>
          <Badge
            variant="outline"
            className={cn(
              "font-medium border-2 transition-all duration-300",
              borderColor,
              textColor,
              level > 66 && "animate-pulse",
            )}
          >
            {status} Risk
          </Badge>
        </div>

        {/* Circular Progress Indicator */}
        <div className="flex justify-center mb-4">
          <div className="relative w-32 h-32">
            {/* Background circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/30"
              />
              {/* Progress circle with smooth transition */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                className={cn("transition-all duration-700 ease-out", textColor)}
                style={{
                  filter: level > 66 ? "drop-shadow(0 0 6px currentColor)" : "none",
                }}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Icon className={cn("w-6 h-6 mb-1 transition-colors duration-300", textColor)} />
              <div className="flex items-baseline gap-0.5">
                <AnimatedNumber value={level} className={cn("text-2xl font-bold", textColor)} />
                <span className={cn("text-lg font-bold", textColor)}>%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className={cn("p-3 rounded-xl bg-gradient-to-r transition-all duration-300", gradient)}>
          <p className="text-xs text-foreground/80 text-center leading-relaxed">{message}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center p-2 rounded-lg bg-muted/30 transition-all duration-300">
            <div className={cn("text-lg font-bold", textColor)}>
              {level <= 33 ? (
                <Shield className="w-5 h-5 mx-auto" />
              ) : level <= 66 ? (
                <AlertCircle className="w-5 h-5 mx-auto" />
              ) : (
                <AlertTriangle className="w-5 h-5 mx-auto" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Status</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center">
              <TrendIcon
                className={cn(
                  "w-5 h-5",
                  trend === "increasing"
                    ? "text-risk-high"
                    : trend === "decreasing"
                      ? "text-risk-low"
                      : "text-muted-foreground",
                )}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Trend</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-sm font-bold text-foreground">24/7</p>
            <p className="text-[10px] text-muted-foreground mt-1">Support</p>
          </div>
        </div>

        {/* High Risk Alert */}
        {level > 66 && (
          <div className="mt-4 p-3 rounded-xl bg-risk-high/10 border border-risk-high/30 animate-pulse">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-risk-high shrink-0" />
              <p className="text-xs text-risk-high font-medium">
                Consider activating SOS or calling emergency services
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
