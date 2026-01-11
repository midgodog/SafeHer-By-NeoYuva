// Activity tracking utilities for dashboard analytics

export interface ChatSummary {
  id: string
  timestamp: Date
  topicSummary: string
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  messageCount: number
}

export interface ResourceAccess {
  id: string
  name: string
  type: "emergency" | "helpline" | "health" | "safe_place"
  accessedAt: Date
}

export interface SafetyAction {
  id: string
  action: string
  timestamp: Date
  type: "sos" | "call" | "share_location" | "chat" | "incident_log"
}

export interface DashboardStats {
  incidentsToday: number
  averageRiskToday: number
  riskTrend: "up" | "down" | "stable"
  safetyActionsTaken: number
  safeTimeMinutes: number
  sessionStartTime: Date
}

const CHAT_HISTORY_KEY = "safeher_chat_history"
const RESOURCE_ACCESS_KEY = "safeher_resource_access"
const SAFETY_ACTIONS_KEY = "safeher_safety_actions"
const SESSION_START_KEY = "safeher_session_start"

// Chat history management
export function saveChatSummary(summary: ChatSummary): void {
  if (typeof window === "undefined") return

  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY)
    const history: ChatSummary[] = stored ? JSON.parse(stored) : []

    // Keep last 20 summaries
    history.unshift(summary)
    if (history.length > 20) history.pop()

    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history))
  } catch (e) {
    console.error("Failed to save chat summary:", e)
  }
}

export function getChatHistory(): ChatSummary[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    return parsed.map((item: ChatSummary & { timestamp: string }) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }))
  } catch {
    return []
  }
}

// Resource access tracking
export function trackResourceAccess(resource: Omit<ResourceAccess, "id" | "accessedAt">): void {
  if (typeof window === "undefined") return

  try {
    const stored = localStorage.getItem(RESOURCE_ACCESS_KEY)
    const history: ResourceAccess[] = stored ? JSON.parse(stored) : []

    const newAccess: ResourceAccess = {
      ...resource,
      id: `resource_${Date.now()}`,
      accessedAt: new Date(),
    }

    history.unshift(newAccess)
    if (history.length > 50) history.pop()

    localStorage.setItem(RESOURCE_ACCESS_KEY, JSON.stringify(history))
  } catch (e) {
    console.error("Failed to track resource access:", e)
  }
}

export function getResourceAccessHistory(): ResourceAccess[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(RESOURCE_ACCESS_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    return parsed.map((item: ResourceAccess & { accessedAt: string }) => ({
      ...item,
      accessedAt: new Date(item.accessedAt),
    }))
  } catch {
    return []
  }
}

// Safety actions tracking
export function trackSafetyAction(action: Omit<SafetyAction, "id" | "timestamp">): void {
  if (typeof window === "undefined") return

  try {
    const stored = localStorage.getItem(SAFETY_ACTIONS_KEY)
    const history: SafetyAction[] = stored ? JSON.parse(stored) : []

    const newAction: SafetyAction = {
      ...action,
      id: `action_${Date.now()}`,
      timestamp: new Date(),
    }

    history.unshift(newAction)
    if (history.length > 100) history.pop()

    localStorage.setItem(SAFETY_ACTIONS_KEY, JSON.stringify(history))
  } catch (e) {
    console.error("Failed to track safety action:", e)
  }
}

export function getSafetyActions(): SafetyAction[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(SAFETY_ACTIONS_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    return parsed.map((item: SafetyAction & { timestamp: string }) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }))
  } catch {
    return []
  }
}

export function getTodaysSafetyActionsCount(): number {
  const actions = getSafetyActions()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return actions.filter((a) => new Date(a.timestamp) >= today).length
}

// Session time tracking
export function initSession(): void {
  if (typeof window === "undefined") return

  const existing = localStorage.getItem(SESSION_START_KEY)
  if (!existing) {
    localStorage.setItem(SESSION_START_KEY, new Date().toISOString())
  }
}

export function getSessionStartTime(): Date {
  if (typeof window === "undefined") return new Date()

  const stored = localStorage.getItem(SESSION_START_KEY)
  if (stored) {
    return new Date(stored)
  }

  const now = new Date()
  localStorage.setItem(SESSION_START_KEY, now.toISOString())
  return now
}

export function getSafeTimeMinutes(): number {
  const sessionStart = getSessionStartTime()
  const now = new Date()
  return Math.floor((now.getTime() - sessionStart.getTime()) / (1000 * 60))
}

// Generate topic summary from messages
export function generateTopicSummary(messages: Array<{ content: string; sender: string }>): string {
  if (messages.length === 0) return "No conversation"

  // Find first user message
  const firstUserMessage = messages.find((m) => m.sender === "user")
  if (!firstUserMessage) return "General safety discussion"

  const content = firstUserMessage.content.toLowerCase()

  // Detect topic based on keywords
  if (content.includes("follow") || content.includes("stalk")) return "Being followed concerns"
  if (content.includes("harass") || content.includes("bother")) return "Harassment situation"
  if (content.includes("scared") || content.includes("afraid") || content.includes("fear")) return "Feeling unsafe"
  if (content.includes("night") || content.includes("dark") || content.includes("late")) return "Late night safety"
  if (content.includes("alone") || content.includes("lonely")) return "Alone and concerned"
  if (content.includes("walk") || content.includes("commute") || content.includes("travel")) return "Travel safety"
  if (content.includes("help") || content.includes("emergency")) return "Emergency assistance"
  if (content.includes("home") || content.includes("house")) return "Home safety"
  if (content.includes("work") || content.includes("office")) return "Workplace concerns"
  if (content.includes("transport") || content.includes("cab") || content.includes("auto")) return "Transport safety"

  // Truncate first message as summary
  const truncated = firstUserMessage.content.substring(0, 50)
  return truncated.length < firstUserMessage.content.length ? `${truncated}...` : truncated
}

// Safety tips based on time of day
export interface SafetyTip {
  id: string
  text: string
  icon:
    | "route"
    | "battery"
    | "calendar"
    | "eye"
    | "phone"
    | "map"
    | "users"
    | "share"
    | "lightbulb"
    | "home"
    | "key"
    | "alert"
  timeRange: "morning" | "afternoon" | "evening" | "night"
}

export const SAFETY_TIPS: SafetyTip[] = [
  // Morning (6AM - 12PM)
  {
    id: "m1",
    text: "Plan your route before leaving - share it with someone you trust",
    icon: "route",
    timeRange: "morning",
  },
  { id: "m2", text: "Make sure your phone is fully charged before heading out", icon: "battery", timeRange: "morning" },
  { id: "m3", text: "Let someone know your schedule for the day", icon: "calendar", timeRange: "morning" },

  // Afternoon (12PM - 6PM)
  {
    id: "a1",
    text: "Stay aware of your surroundings, especially in crowded places",
    icon: "eye",
    timeRange: "afternoon",
  },
  { id: "a2", text: "Save emergency numbers on speed dial for quick access", icon: "phone", timeRange: "afternoon" },
  { id: "a3", text: "Avoid taking unknown shortcuts - stick to familiar routes", icon: "map", timeRange: "afternoon" },

  // Evening (6PM - 10PM)
  { id: "e1", text: "Travel in groups when possible after dark", icon: "users", timeRange: "evening" },
  { id: "e2", text: "Share your live location with a trusted contact", icon: "share", timeRange: "evening" },
  { id: "e3", text: "Use well-lit and populated routes for travel", icon: "lightbulb", timeRange: "evening" },

  // Night (10PM - 6AM)
  { id: "n1", text: "Avoid traveling alone late at night if possible", icon: "users", timeRange: "night" },
  { id: "n2", text: "Have your keys ready before reaching your door", icon: "key", timeRange: "night" },
  { id: "n3", text: "Stay extra alert near your home entrance at night", icon: "alert", timeRange: "night" },
]

export function getCurrentTimeRange(): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return "morning"
  if (hour >= 12 && hour < 18) return "afternoon"
  if (hour >= 18 && hour < 22) return "evening"
  return "night"
}

export function getTipsForCurrentTime(): SafetyTip[] {
  const timeRange = getCurrentTimeRange()
  return SAFETY_TIPS.filter((tip) => tip.timeRange === timeRange)
}
