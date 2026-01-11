"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Home,
  MessageSquare,
  FileText,
  BookOpen,
  Phone,
  Clock,
  Shield,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Eye,
  Route,
  Battery,
  Calendar,
  Users,
  Share2,
  Lightbulb,
  Key,
  Bell,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSettings } from "@/lib/settings-context"
import { getIncidents, type Incident } from "@/lib/incidents"
import { getCurrentPosition, DEFAULT_ADDRESS } from "@/lib/location"
import {
  getChatHistory,
  getResourceAccessHistory,
  getTodaysSafetyActionsCount,
  getSafeTimeMinutes,
  getTipsForCurrentTime,
  getCurrentTimeRange,
  type ChatSummary,
  type ResourceAccess,
  type SafetyTip,
} from "@/lib/activity-tracker"
import { cn } from "@/lib/utils"
import type { ActivePage } from "@/app/page"

interface SummaryDashboardProps {
  currentRiskLevel: number
  onNavigate: (page: ActivePage) => void
  onStartChat: () => void
  onShowEmergency: () => void
}

// Get greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return "Good Morning"
  if (hour >= 12 && hour < 17) return "Good Afternoon"
  if (hour >= 17 && hour < 21) return "Good Evening"
  return "Good Night"
}

// Get time range display name
function getTimeRangeDisplay(): string {
  const range = getCurrentTimeRange()
  switch (range) {
    case "morning":
      return "Morning"
    case "afternoon":
      return "Afternoon"
    case "evening":
      return "Evening"
    case "night":
      return "Night"
  }
}

// Format duration in hours and minutes
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "Yesterday"
  return `${diffDays}d ago`
}

// Get icon component for safety tip
function getTipIcon(iconName: SafetyTip["icon"]) {
  const icons = {
    route: Route,
    battery: Battery,
    calendar: Calendar,
    eye: Eye,
    phone: Phone,
    map: MapPin,
    users: Users,
    share: Share2,
    lightbulb: Lightbulb,
    home: Home,
    key: Key,
    alert: Bell,
  }
  return icons[iconName] || Shield
}

export function SummaryDashboard({
  currentRiskLevel,
  onNavigate,
  onStartChat,
  onShowEmergency,
}: SummaryDashboardProps) {
  const { settings } = useSettings()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [location, setLocation] = useState<string>(DEFAULT_ADDRESS)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  // Dashboard data
  const [todaysIncidents, setTodaysIncidents] = useState<Incident[]>([])
  const [recentChats, setRecentChats] = useState<ChatSummary[]>([])
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([])
  const [recentResources, setRecentResources] = useState<ResourceAccess[]>([])
  const [safetyActions, setSafetyActions] = useState(0)
  const [safeTime, setSafeTime] = useState(0)
  const [averageRisk, setAverageRisk] = useState(currentRiskLevel)

  // Safety tips
  const [tips, setTips] = useState<SafetyTip[]>([])
  const [currentTipIndex, setCurrentTipIndex] = useState(0)

  // Animation states
  const [isVisible, setIsVisible] = useState(false)

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Auto-rotate tips every 10 seconds
  useEffect(() => {
    if (tips.length <= 1) return
    const timer = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length)
    }, 10000)
    return () => clearInterval(timer)
  }, [tips.length])

  // Load dashboard data
  useEffect(() => {
    // Load incidents
    const allIncidents = getIncidents()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayIncidents = allIncidents.filter((i) => new Date(i.incidentDate) >= today)
    setTodaysIncidents(todayIncidents)
    setRecentIncidents(allIncidents.slice(0, 3))

    // Load chat history
    const chatHistory = getChatHistory()
    setRecentChats(chatHistory.slice(0, 5))

    // Load resource access
    const resourceHistory = getResourceAccessHistory()
    setRecentResources(resourceHistory.slice(0, 3))

    // Load safety actions count
    setSafetyActions(getTodaysSafetyActionsCount())

    // Load safe time
    setSafeTime(getSafeTimeMinutes())

    // Load tips
    setTips(getTipsForCurrentTime())

    // Trigger animations
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  // Update safe time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setSafeTime(getSafeTimeMinutes())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Get location
  const fetchLocation = useCallback(async () => {
    if (settings.privacy.locationServices) {
      setIsLoadingLocation(true)
      try {
        const coords = await getCurrentPosition()
        // For now, just show coordinates - could use reverse geocoding API
        setLocation(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`)
      } catch {
        setLocation(DEFAULT_ADDRESS)
      } finally {
        setIsLoadingLocation(false)
      }
    }
  }, [settings.privacy.locationServices])

  useEffect(() => {
    fetchLocation()
  }, [fetchLocation])

  // Calculate risk status
  const getRiskStatus = () => {
    if (currentRiskLevel <= 33)
      return { label: "You're Safe", color: "bg-green-500", textColor: "text-green-700", bgColor: "bg-green-50" }
    if (currentRiskLevel <= 66)
      return { label: "Be Cautious", color: "bg-yellow-500", textColor: "text-yellow-700", bgColor: "bg-yellow-50" }
    return { label: "High Alert", color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50" }
  }

  const riskStatus = getRiskStatus()
  const userName = settings.profile.name || "SafeHer"

  // Calculate risk trend
  const getRiskTrend = () => {
    if (averageRisk < currentRiskLevel - 5) return "up"
    if (averageRisk > currentRiskLevel + 5) return "down"
    return "stable"
  }

  const riskTrend = getRiskTrend()

  const nextTip = () => setCurrentTipIndex((prev) => (prev + 1) % tips.length)
  const prevTip = () => setCurrentTipIndex((prev) => (prev - 1 + tips.length) % tips.length)

  const currentTip = tips[currentTipIndex]
  const TipIcon = currentTip ? getTipIcon(currentTip.icon) : Shield

  return (
    <div
      className={cn(
        "w-full space-y-4 transition-all duration-500",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      )}
    >
      {/* Welcome Section */}
      <Card className="glass border-border/50 overflow-hidden">
        <div className="relative">
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-pink-500/10 pointer-events-none" />

          <CardContent className="p-4 sm:p-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {getGreeting()}, {userName}!
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {location && (
                    <>
                      <span className="text-border">•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {isLoadingLocation ? "Getting location..." : location}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <Badge
                className={cn(
                  "px-3 py-1.5 text-sm font-medium flex items-center gap-2 self-start sm:self-center",
                  riskStatus.bgColor,
                  riskStatus.textColor,
                  "border-0",
                )}
              >
                <span className={cn("w-2 h-2 rounded-full animate-pulse", riskStatus.color)} />
                {riskStatus.label}
              </Badge>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Today's Safety Summary - 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Incidents Today */}
        <Card
          className={cn(
            "glass border-border/50 transition-all duration-300 hover:shadow-lg",
            "animate-in fade-in slide-in-from-bottom-2 duration-300",
          )}
          style={{ animationDelay: "100ms" }}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Incidents Today</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{todaysIncidents.length}</p>
              </div>
              <div
                className={cn(
                  "p-2 rounded-lg",
                  todaysIncidents.length === 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600",
                )}
              >
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Risk Today */}
        <Card
          className={cn(
            "glass border-border/50 transition-all duration-300 hover:shadow-lg",
            "animate-in fade-in slide-in-from-bottom-2 duration-300",
          )}
          style={{ animationDelay: "200ms" }}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Average Risk</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{currentRiskLevel}%</p>
                  {riskTrend === "up" && <TrendingUp className="w-4 h-4 text-red-500" />}
                  {riskTrend === "down" && <TrendingDown className="w-4 h-4 text-green-500" />}
                  {riskTrend === "stable" && <Minus className="w-4 h-4 text-yellow-500" />}
                </div>
              </div>
              <div
                className={cn(
                  "p-2 rounded-lg",
                  currentRiskLevel <= 33
                    ? "bg-green-100 text-green-600"
                    : currentRiskLevel <= 66
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-red-100 text-red-600",
                )}
              >
                <Shield className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety Actions */}
        <Card
          className={cn(
            "glass border-border/50 transition-all duration-300 hover:shadow-lg",
            "animate-in fade-in slide-in-from-bottom-2 duration-300",
          )}
          style={{ animationDelay: "300ms" }}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Safety Actions</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{safetyActions}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safe Time */}
        <Card
          className={cn(
            "glass border-border/50 transition-all duration-300 hover:shadow-lg",
            "animate-in fade-in slide-in-from-bottom-2 duration-300",
          )}
          style={{ animationDelay: "400ms" }}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Safe Time</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{formatDuration(safeTime)}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Conversations */}
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Recent Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentChats.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <Button variant="link" size="sm" className="text-primary" onClick={onStartChat}>
                  Start your first chat
                </Button>
              </div>
            ) : (
              recentChats.slice(0, 3).map((chat) => (
                <div
                  key={chat.id}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={onStartChat}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{chat.topicSummary}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(chat.timestamp)}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs shrink-0",
                        chat.riskLevel === "LOW" && "border-green-500 text-green-600",
                        chat.riskLevel === "MEDIUM" && "border-yellow-500 text-yellow-600",
                        chat.riskLevel === "HIGH" && "border-red-500 text-red-600",
                      )}
                    >
                      {chat.riskLevel}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              Recent Incidents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentIncidents.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No incidents logged</p>
                <Button variant="link" size="sm" className="text-primary" onClick={() => onNavigate("incidents")}>
                  Log an incident
                </Button>
              </div>
            ) : (
              recentIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => onNavigate("incidents")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{incident.location.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(new Date(incident.incidentDate))}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs shrink-0",
                        incident.severity === "low" && "border-green-500 text-green-600",
                        incident.severity === "medium" && "border-yellow-500 text-yellow-600",
                        incident.severity === "high" && "border-red-500 text-red-600",
                      )}
                    >
                      {incident.severity}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Resources */}
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              Recent Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentResources.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No resources accessed</p>
                <Button variant="link" size="sm" className="text-primary" onClick={() => onNavigate("resources")}>
                  Browse resources
                </Button>
              </div>
            ) : (
              recentResources.map((resource) => (
                <div
                  key={resource.id}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => onNavigate("resources")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{resource.name}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(resource.accessedAt)}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {resource.type.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Safety Tips */}
      {tips.length > 0 && (
        <Card className="glass border-border/50 overflow-hidden">
          <div className="relative bg-gradient-to-r from-primary/10 to-pink-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Safety Tips for {getTimeRangeDisplay()}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8"
                  onClick={prevTip}
                  disabled={tips.length <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex-1 flex items-center gap-3 min-h-[48px]">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <TipIcon className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-foreground">{currentTip?.text}</p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8"
                  onClick={nextTip}
                  disabled={tips.length <= 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Tip indicators */}
              {tips.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {tips.map((_, idx) => (
                    <button
                      key={idx}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all",
                        idx === currentTipIndex ? "bg-primary w-4" : "bg-primary/30 hover:bg-primary/50",
                      )}
                      onClick={() => setCurrentTipIndex(idx)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Button
          onClick={onStartChat}
          className={cn(
            "h-auto py-4 px-4 flex flex-col items-center gap-2",
            "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
            "text-primary-foreground shadow-lg shadow-primary/20",
          )}
        >
          <MessageSquare className="w-6 h-6" />
          <span className="text-sm font-medium">Start Safety Chat</span>
        </Button>

        <Button
          onClick={() => onNavigate("incidents")}
          className={cn(
            "h-auto py-4 px-4 flex flex-col items-center gap-2",
            "bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
            "text-white shadow-lg shadow-orange-500/20",
          )}
        >
          <FileText className="w-6 h-6" />
          <span className="text-sm font-medium">Log Incident</span>
        </Button>

        <Button
          onClick={onShowEmergency}
          className={cn(
            "h-auto py-4 px-4 flex flex-col items-center gap-2",
            "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
            "text-white shadow-lg shadow-red-500/20",
          )}
        >
          <Phone className="w-6 h-6" />
          <span className="text-sm font-medium">Call Emergency</span>
        </Button>

        <Button
          onClick={() => onNavigate("resources")}
          className={cn(
            "h-auto py-4 px-4 flex flex-col items-center gap-2",
            "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
            "text-white shadow-lg shadow-blue-500/20",
          )}
        >
          <BookOpen className="w-6 h-6" />
          <span className="text-sm font-medium">Find Resources</span>
        </Button>
      </div>
    </div>
  )
}
