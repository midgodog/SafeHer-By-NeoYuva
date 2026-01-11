"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

// Types
export interface UserProfile {
  name: string
  age: string
  avatar: string
}

export interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
}

export interface NotificationSettings {
  pushNotifications: boolean
  smsAlerts: boolean
  emailAlerts: boolean
  dailyTips: boolean
  incidentReminders: boolean
}

export interface DisplaySettings {
  darkMode: boolean
  language: "en" | "hi"
  fontSize: "small" | "medium" | "large"
}

export interface PrivacySettings {
  autoDeleteIncidents: "never" | "1month" | "3months" | "1year"
  locationServices: boolean
}

export interface UserSettings {
  profile: UserProfile
  emergencyContacts: EmergencyContact[]
  riskSensitivity: number // 1-3 (Low, Medium, High)
  notifications: NotificationSettings
  display: DisplaySettings
  privacy: PrivacySettings
  onboardingComplete: boolean
  firstVisitDate: string | null
  totalIncidentsLogged: number
  safetyScore: number
}

const DEFAULT_SETTINGS: UserSettings = {
  profile: {
    name: "",
    age: "",
    avatar: "",
  },
  emergencyContacts: [],
  riskSensitivity: 2, // Medium
  notifications: {
    pushNotifications: true,
    smsAlerts: false,
    emailAlerts: false,
    dailyTips: true,
    incidentReminders: true,
  },
  display: {
    darkMode: false,
    language: "en",
    fontSize: "medium",
  },
  privacy: {
    autoDeleteIncidents: "never",
    locationServices: false,
  },
  onboardingComplete: false,
  firstVisitDate: null,
  totalIncidentsLogged: 0,
  safetyScore: 92,
}

const STORAGE_KEY = "safeher_user_settings"

interface SettingsContextType {
  settings: UserSettings
  updateProfile: (profile: Partial<UserProfile>) => void
  addEmergencyContact: (contact: Omit<EmergencyContact, "id">) => void
  updateEmergencyContact: (id: string, contact: Partial<EmergencyContact>) => void
  removeEmergencyContact: (id: string) => void
  setRiskSensitivity: (level: number) => void
  updateNotifications: (notifications: Partial<NotificationSettings>) => void
  updateDisplay: (display: Partial<DisplaySettings>) => void
  updatePrivacy: (privacy: Partial<PrivacySettings>) => void
  completeOnboarding: () => void
  resetOnboarding: () => void
  exportData: () => string
  deleteAllData: () => void
  incrementIncidentCount: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      }
    } catch {
      // Use default settings if parsing fails
    }
    setIsLoaded(true)
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    }
  }, [settings, isLoaded])

  // Apply dark mode
  useEffect(() => {
    if (isLoaded) {
      if (settings.display.darkMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  }, [settings.display.darkMode, isLoaded])

  // Apply font size
  useEffect(() => {
    if (isLoaded) {
      const root = document.documentElement
      switch (settings.display.fontSize) {
        case "small":
          root.style.fontSize = "14px"
          break
        case "medium":
          root.style.fontSize = "16px"
          break
        case "large":
          root.style.fontSize = "18px"
          break
      }
    }
  }, [settings.display.fontSize, isLoaded])

  const updateProfile = useCallback((profile: Partial<UserProfile>) => {
    setSettings((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...profile },
    }))
  }, [])

  const addEmergencyContact = useCallback((contact: Omit<EmergencyContact, "id">) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    setSettings((prev) => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, newContact],
    }))
  }, [])

  const updateEmergencyContact = useCallback((id: string, contact: Partial<EmergencyContact>) => {
    setSettings((prev) => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.map((c) => (c.id === id ? { ...c, ...contact } : c)),
    }))
  }, [])

  const removeEmergencyContact = useCallback((id: string) => {
    setSettings((prev) => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter((c) => c.id !== id),
    }))
  }, [])

  const setRiskSensitivity = useCallback((level: number) => {
    setSettings((prev) => ({ ...prev, riskSensitivity: level }))
  }, [])

  const updateNotifications = useCallback((notifications: Partial<NotificationSettings>) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, ...notifications },
    }))
  }, [])

  const updateDisplay = useCallback((display: Partial<DisplaySettings>) => {
    setSettings((prev) => ({
      ...prev,
      display: { ...prev.display, ...display },
    }))
  }, [])

  const updatePrivacy = useCallback((privacy: Partial<PrivacySettings>) => {
    setSettings((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, ...privacy },
    }))
  }, [])

  const completeOnboarding = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      onboardingComplete: true,
      firstVisitDate: prev.firstVisitDate || new Date().toISOString(),
    }))
  }, [])

  const resetOnboarding = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      onboardingComplete: false,
    }))
  }, [])

  const exportData = useCallback(() => {
    return JSON.stringify(settings, null, 2)
  }, [settings])

  const deleteAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem("safeher_gemini_api_key")
    localStorage.removeItem("safeher_risk_history")
    localStorage.removeItem("safeher_incidents")
    localStorage.removeItem("safeher_trusted_contacts")
    setSettings(DEFAULT_SETTINGS)
  }, [])

  const incrementIncidentCount = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      totalIncidentsLogged: prev.totalIncidentsLogged + 1,
    }))
  }, [])

  // Don't render children until settings are loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/30" />
          <div className="h-4 w-32 bg-primary/20 rounded" />
        </div>
      </div>
    )
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateProfile,
        addEmergencyContact,
        updateEmergencyContact,
        removeEmergencyContact,
        setRiskSensitivity,
        updateNotifications,
        updateDisplay,
        updatePrivacy,
        completeOnboarding,
        resetOnboarding,
        exportData,
        deleteAllData,
        incrementIncidentCount,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
