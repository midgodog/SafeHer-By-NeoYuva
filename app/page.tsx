"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { ChatInterface } from "@/components/chat-interface"
import { RiskIndicator } from "@/components/risk-indicator"
import { RiskDashboard } from "@/components/risk-dashboard"
import { EmergencyResources } from "@/components/emergency-resources"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Header } from "@/components/header"
import { ResourcesPage } from "@/components/resources-page"
import { SettingsPage } from "@/components/settings-page"
import { IncidentLog } from "@/components/incident-log"
import { SOSModal } from "@/components/sos-modal"
import { Onboarding } from "@/components/onboarding"
import { SummaryDashboard } from "@/components/summary-dashboard"
import { useSettings } from "@/lib/settings-context"
import { initSession, saveChatSummary, generateTopicSummary, trackSafetyAction } from "@/lib/activity-tracker"
import type { RiskFactor, Recommendation, RiskHistory, RiskAssessment } from "@/lib/parse-risk"

export type ActivePage = "home" | "sos" | "resources" | "settings" | "incidents"

export interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
}

const API_KEY_STORAGE_KEY = "safeher_gemini_api_key"
const RISK_HISTORY_STORAGE_KEY = "safeher_risk_history"

// Default initial factors (safe state)
const DEFAULT_FACTORS: RiskFactor[] = [
  { name: "Time of Day Risk", icon: "clock", level: "LOW", percentage: 15 },
  { name: "Location Familiarity", icon: "map", level: "LOW", percentage: 10 },
  { name: "Alone Status", icon: "person", level: "LOW", percentage: 20 },
  { name: "Environment Visibility", icon: "eye", level: "LOW", percentage: 12 },
]

// Default initial recommendations (safe state)
const DEFAULT_RECOMMENDATIONS: Recommendation[] = [
  { priority: 1, action: "Continue staying aware of your surroundings", icon: "shield" },
  { priority: 2, action: "Keep emergency contacts easily accessible", icon: "users" },
  { priority: 3, action: "Trust your instincts if something feels off", icon: "alert" },
]

export default function SafetyCompanion() {
  const { settings } = useSettings()
  const [showOnboarding, setShowOnboarding] = useState(!settings.onboardingComplete)
  const [showDashboard, setShowDashboard] = useState(true)
  const [activePage, setActivePage] = useState<ActivePage>("home")
  const [riskLevel, setRiskLevel] = useState(15)
  const [isSOSActive, setIsSOSActive] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [apiKey, setApiKey] = useState<string>("")
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>(DEFAULT_FACTORS)
  const [recommendations, setRecommendations] = useState<Recommendation[]>(DEFAULT_RECOMMENDATIONS)
  const [riskHistory, setRiskHistory] = useState<RiskHistory[]>([])

  const previousRiskLevel = useRef<number>(15)

  useEffect(() => {
    setShowOnboarding(!settings.onboardingComplete)
  }, [settings.onboardingComplete])

  useEffect(() => {
    initSession()
  }, [])

  // Load API key and risk history from localStorage
  useEffect(() => {
    try {
      const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY)
      if (savedApiKey) {
        setApiKey(savedApiKey)
      }

      const savedHistory = localStorage.getItem(RISK_HISTORY_STORAGE_KEY)
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory)
        setRiskHistory(
          parsed.map((h: { id: number; percentage: number; timestamp: string }) => ({
            ...h,
            timestamp: new Date(h.timestamp),
          })),
        )
      }
    } catch {
      // Handle localStorage errors gracefully (e.g., in incognito mode)
    }
  }, [])

  // Save risk history to localStorage
  useEffect(() => {
    if (riskHistory.length > 0) {
      try {
        localStorage.setItem(RISK_HISTORY_STORAGE_KEY, JSON.stringify(riskHistory))
      } catch {
        // Handle storage errors gracefully
      }
    }
  }, [riskHistory])

  useEffect(() => {
    if (messages.length >= 2) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.sender === "ai") {
        const currentLevel = riskLevel <= 33 ? "LOW" : riskLevel <= 66 ? "MEDIUM" : "HIGH"

        saveChatSummary({
          id: `chat_${Date.now()}`,
          timestamp: new Date(),
          topicSummary: generateTopicSummary(messages.map((m) => ({ content: m.content, sender: m.sender }))),
          riskLevel: currentLevel as "LOW" | "MEDIUM" | "HIGH",
          messageCount: messages.length,
        })
      }
    }
  }, [messages, riskLevel])

  const handleApiKeyChange = useCallback((newKey: string) => {
    setApiKey(newKey)
    try {
      if (newKey) {
        localStorage.setItem(API_KEY_STORAGE_KEY, newKey)
      } else {
        localStorage.removeItem(API_KEY_STORAGE_KEY)
      }
    } catch {
      // Handle storage errors gracefully
    }
  }, [])

  const handleRiskUpdate = useCallback(
    (assessment: RiskAssessment) => {
      previousRiskLevel.current = riskLevel
      const newLevel = Math.max(0, Math.min(100, assessment.percentage))
      setRiskLevel(newLevel)

      if (assessment.factors && assessment.factors.length > 0) {
        setRiskFactors(assessment.factors)
      }

      if (assessment.recommendations && assessment.recommendations.length > 0) {
        setRecommendations(assessment.recommendations)
      }

      setRiskHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            id: Date.now(),
            percentage: newLevel,
            timestamp: new Date(),
          },
        ].slice(-5)
        return newHistory
      })
    },
    [riskLevel],
  )

  const handleSimpleRiskUpdate = useCallback(
    (newRisk: number) => {
      handleRiskUpdate({
        level: newRisk <= 33 ? "LOW" : newRisk <= 66 ? "MEDIUM" : "HIGH",
        percentage: newRisk,
      })
    },
    [handleRiskUpdate],
  )

  const handleSOSActivate = useCallback(() => {
    setIsSOSActive(true)
    previousRiskLevel.current = riskLevel
    handleSimpleRiskUpdate(100)
    trackSafetyAction({ action: "SOS Activated", type: "sos" })
  }, [riskLevel, handleSimpleRiskUpdate])

  const handleSOSDeactivate = useCallback(() => {
    setIsSOSActive(false)
  }, [])

  const handleNavigate = useCallback(
    (page: ActivePage) => {
      if (page === "sos") {
        handleSOSActivate()
      } else {
        setActivePage(page)
        if (page === "home") {
          setShowDashboard(true)
        }
      }
    },
    [handleSOSActivate],
  )

  const handleStartChat = useCallback(() => {
    setShowDashboard(false)
    setActivePage("home")
    trackSafetyAction({ action: "Started Safety Chat", type: "chat" })
  }, [])

  const handleShowEmergency = useCallback(() => {
    handleSOSActivate()
  }, [handleSOSActivate])

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false)
  }, [])

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  return (
    <div className="gradient-bg min-h-screen flex flex-col">
      <Header />

      <main
        id="main-content"
        className="flex-1 flex flex-col lg:flex-row gap-4 p-4 pb-24 lg:pb-4 max-w-7xl mx-auto w-full"
        role="main"
        aria-label="Main content"
      >
        {activePage === "home" && (
          <>
            {showDashboard ? (
              <div className="w-full">
                <SummaryDashboard
                  currentRiskLevel={riskLevel}
                  onNavigate={handleNavigate}
                  onStartChat={handleStartChat}
                  onShowEmergency={handleShowEmergency}
                />
              </div>
            ) : (
              <>
                {/* Chat Interface - Main Content */}
                <section
                  className="flex-1 lg:w-[70%] order-2 lg:order-1 flex flex-col gap-4"
                  aria-label="Chat and Risk Analysis"
                >
                  <ChatInterface onRiskUpdate={handleRiskUpdate} apiKey={apiKey} />

                  <RiskDashboard
                    level={riskLevel}
                    previousLevel={previousRiskLevel.current}
                    factors={riskFactors}
                    recommendations={recommendations}
                    history={riskHistory}
                  />
                </section>

                {/* Right Sidebar - Risk & Emergency */}
                <aside className="w-full lg:w-[30%] flex flex-col gap-4 order-1 lg:order-2" aria-label="Safety Status">
                  <RiskIndicator level={riskLevel} previousLevel={previousRiskLevel.current} />
                  <EmergencyResources />
                </aside>
              </>
            )}
          </>
        )}

        {activePage === "resources" && <ResourcesPage />}

        {activePage === "settings" && <SettingsPage apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />}

        {activePage === "incidents" && <IncidentLog />}
      </main>

      <BottomNavigation activePage={activePage} onNavigate={handleNavigate} />

      <SOSModal isOpen={isSOSActive} onClose={handleSOSDeactivate} />
    </div>
  )
}
