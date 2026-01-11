"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Settings,
  User,
  Bell,
  Shield,
  MapPin,
  Phone,
  Moon,
  Plus,
  Trash2,
  Save,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ChevronDown,
  Palette,
  Lock,
  Info,
  Download,
  AlertTriangle,
  Mail,
  MessageSquare,
  Lightbulb,
  Clock,
  Globe,
  Type,
  Heart,
  Github,
  Edit3,
  FileText,
  RefreshCw,
} from "lucide-react"
import { useSettings } from "@/lib/settings-context"

interface SettingsPageProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
}

export function SettingsPage({ apiKey, onApiKeyChange }: SettingsPageProps) {
  const {
    settings,
    updateProfile,
    addEmergencyContact,
    updateEmergencyContact,
    removeEmergencyContact,
    setRiskSensitivity,
    updateNotifications,
    updateDisplay,
    updatePrivacy,
    exportData,
    deleteAllData,
    resetOnboarding,
  } = useSettings()

  const [openSections, setOpenSections] = useState<string[]>(["profile", "ai"])
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(settings.profile.name)
  const [editAge, setEditAge] = useState(settings.profile.age)

  const [newContact, setNewContact] = useState({ name: "", phone: "", relationship: "" })
  const [isAddingContact, setIsAddingContact] = useState(false)

  const [tempApiKey, setTempApiKey] = useState(apiKey)
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeySaved, setApiKeySaved] = useState(false)

  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  useEffect(() => {
    setTempApiKey(apiKey)
  }, [apiKey])

  useEffect(() => {
    setEditName(settings.profile.name)
    setEditAge(settings.profile.age)
  }, [settings.profile])

  const toggleSection = (section: string) => {
    setOpenSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const handleSaveApiKey = () => {
    onApiKeyChange(tempApiKey)
    setApiKeySaved(true)
    setTimeout(() => setApiKeySaved(false), 2000)
  }

  const handleSaveProfile = () => {
    updateProfile({ name: editName, age: editAge })
    setIsEditing(false)
    showSaveSuccess("Profile updated!")
  }

  const handleAddContact = () => {
    if (newContact.name && newContact.phone) {
      addEmergencyContact(newContact)
      setNewContact({ name: "", phone: "", relationship: "" })
      setIsAddingContact(false)
      showSaveSuccess("Contact added!")
    }
  }

  const showSaveSuccess = (message: string) => {
    setSaveSuccess(message)
    setTimeout(() => setSaveSuccess(null), 2000)
  }

  const handleExportData = () => {
    const data = exportData()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `safeher-data-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showSaveSuccess("Data exported!")
  }

  const handleRequestLocationPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: "geolocation" })
      if (result.state === "granted") {
        updatePrivacy({ locationServices: true })
        showSaveSuccess("Location enabled!")
      } else {
        navigator.geolocation.getCurrentPosition(
          () => {
            updatePrivacy({ locationServices: true })
            showSaveSuccess("Location enabled!")
          },
          () => {
            showSaveSuccess("Location denied")
          },
        )
      }
    } catch {
      navigator.geolocation.getCurrentPosition(
        () => {
          updatePrivacy({ locationServices: true })
          showSaveSuccess("Location enabled!")
        },
        () => {
          showSaveSuccess("Location denied")
        },
      )
    }
  }

  const getSensitivityLabel = (value: number) => {
    switch (value) {
      case 1:
        return "Low"
      case 2:
        return "Medium"
      case 3:
        return "High"
      default:
        return "Medium"
    }
  }

  return (
    <div className="w-full space-y-4 pb-4">
      {/* Header */}
      <div className="glass rounded-2xl p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Settings className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Settings</h2>
        </div>
        <p className="text-sm text-muted-foreground">Customize your safety preferences</p>
      </div>

      {/* Save Success Toast */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-risk-low text-white shadow-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">{saveSuccess}</span>
          </div>
        </div>
      )}

      {/* Section 1: Profile */}
      <Collapsible open={openSections.includes("profile")} onOpenChange={() => toggleSection("profile")}>
        <Card className="glass rounded-2xl overflow-hidden">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Profile</h3>
                  <p className="text-xs text-muted-foreground">Manage your personal information</p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${openSections.includes("profile") ? "rotate-180" : ""}`}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
              {/* Avatar and Stats */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  {settings.profile.name ? settings.profile.name.slice(0, 2).toUpperCase() : "U"}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-lg">{settings.profile.name || "User"}</p>
                  {settings.profile.age && (
                    <p className="text-sm text-muted-foreground">{settings.profile.age} years old</p>
                  )}
                  <div className="flex gap-4 mt-2">
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">{settings.totalIncidentsLogged}</p>
                      <p className="text-xs text-muted-foreground">Incidents</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-risk-low">{settings.safetyScore}%</p>
                      <p className="text-xs text-muted-foreground">Safety Score</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Profile */}
              {isEditing ? (
                <div className="space-y-3 p-4 rounded-xl bg-muted/30">
                  <div>
                    <Label className="text-xs text-muted-foreground">Display Name</Label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Age</Label>
                    <Input
                      type="number"
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      className="mt-1"
                      placeholder="Enter your age"
                      min="13"
                      max="120"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} className="flex-1">
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 2: AI Configuration */}
      <Collapsible open={openSections.includes("ai")} onOpenChange={() => toggleSection("ai")}>
        <Card className="glass rounded-2xl overflow-hidden border-2 border-primary/20">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">AI Configuration</h3>
                  <p className="text-xs text-muted-foreground">Connect to Google Gemini AI</p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${openSections.includes("ai") ? "rotate-180" : ""}`}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
              <div className="space-y-2">
                <Label htmlFor="api-key" className="text-sm font-medium flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  Google Gemini API Key
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="api-key"
                      type={showApiKey ? "text" : "password"}
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      placeholder="Enter your Gemini API key"
                      className="pr-10 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={handleSaveApiKey}
                    disabled={!tempApiKey || tempApiKey === apiKey}
                    className="shrink-0"
                  >
                    {apiKeySaved ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div
                className={`flex items-center gap-2 p-3 rounded-xl ${apiKey ? "bg-risk-low/10 border border-risk-low/30" : "bg-amber-500/10 border border-amber-500/30"}`}
              >
                <div className={`w-2 h-2 rounded-full ${apiKey ? "bg-risk-low animate-pulse" : "bg-amber-500"}`} />
                <span className={`text-sm ${apiKey ? "text-risk-low" : "text-amber-600"}`}>
                  {apiKey ? "API key configured - SafeHer AI is ready!" : "API key required to enable AI features"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 space-y-2">
                <p className="text-xs text-muted-foreground">To get your free Gemini API key:</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to Google AI Studio</li>
                  <li>Sign in with your Google account</li>
                  <li>Click &quot;Get API Key&quot; and create a new key</li>
                  <li>Copy and paste it here</li>
                </ol>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                >
                  Get your API key here
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 3: Emergency Contacts */}
      <Collapsible open={openSections.includes("contacts")} onOpenChange={() => toggleSection("contacts")}>
        <Card className="glass rounded-2xl overflow-hidden">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Emergency Contacts</h3>
                  <p className="text-xs text-muted-foreground">{settings.emergencyContacts.length} contacts saved</p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${openSections.includes("contacts") ? "rotate-180" : ""}`}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-4">
              {/* Contact List */}
              {settings.emergencyContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {contact.relationship}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEmergencyContact(contact.id)}
                      className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Add Contact Form */}
              {isAddingContact ? (
                <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                  <Input
                    value={newContact.name}
                    onChange={(e) => setNewContact((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Contact name"
                  />
                  <Input
                    value={newContact.phone}
                    onChange={(e) => setNewContact((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 XXXXX XXXXX"
                  />
                  <Select
                    value={newContact.relationship}
                    onValueChange={(value) => setNewContact((prev) => ({ ...prev, relationship: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Partner">Partner</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button onClick={handleAddContact} className="flex-1">
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingContact(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setIsAddingContact(true)} variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Contact
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 4: Location & Permissions */}
      <Collapsible open={openSections.includes("location")} onOpenChange={() => toggleSection("location")}>
        <Card className="glass rounded-2xl overflow-hidden">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-risk-low/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-risk-low" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Location & Permissions</h3>
                  <p className="text-xs text-muted-foreground">Manage location settings</p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${openSections.includes("location") ? "rotate-180" : ""}`}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Location Services</p>
                    <p className="text-xs text-muted-foreground">Enable for nearby resources</p>
                  </div>
                </div>
                <Switch
                  checked={settings.privacy.locationServices}
                  onCheckedChange={(checked) => updatePrivacy({ locationServices: checked })}
                />
              </div>

              <div
                className={`flex items-center gap-2 p-3 rounded-xl ${settings.privacy.locationServices ? "bg-risk-low/10 border border-risk-low/30" : "bg-muted/30 border border-border"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${settings.privacy.locationServices ? "bg-risk-low" : "bg-muted-foreground"}`}
                />
                <span className="text-sm">
                  {settings.privacy.locationServices ? "Location enabled" : "Location disabled"}
                </span>
              </div>

              {!settings.privacy.locationServices && (
                <Button onClick={handleRequestLocationPermission} variant="outline" className="w-full bg-transparent">
                  <MapPin className="w-4 h-4 mr-2" />
                  Request Permission
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 5: Risk Sensitivity */}
      <Collapsible open={openSections.includes("risk")} onOpenChange={() => toggleSection("risk")}>
        <Card className="glass rounded-2xl overflow-hidden">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-risk-medium/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-risk-medium" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Risk Sensitivity</h3>
                  <p className="text-xs text-muted-foreground">
                    Currently: {getSensitivityLabel(settings.riskSensitivity)}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${openSections.includes("risk") ? "rotate-180" : ""}`}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Low</span>
                  <span className="text-lg font-bold text-primary">
                    {getSensitivityLabel(settings.riskSensitivity)}
                  </span>
                  <span className="text-sm text-muted-foreground">High</span>
                </div>
                <Slider
                  value={[settings.riskSensitivity]}
                  onValueChange={(value) => setRiskSensitivity(value[0])}
                  min={1}
                  max={3}
                  step={1}
                />
              </div>
              <p className="text-xs text-muted-foreground p-3 rounded-xl bg-muted/30">
                {settings.riskSensitivity === 1 && "Only alert for clearly dangerous situations. Fewer notifications."}
                {settings.riskSensitivity === 2 && "Balanced alerts for moderate risk. Recommended for most users."}
                {settings.riskSensitivity === 3 &&
                  "Alert for any potential risk. Maximum protection with more notifications."}
              </p>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 6: Notifications */}
      <Collapsible open={openSections.includes("notifications")} onOpenChange={() => toggleSection("notifications")}>
        <Card className="glass rounded-2xl overflow-hidden">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  <p className="text-xs text-muted-foreground">Manage alert preferences</p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${openSections.includes("notifications") ? "rotate-180" : ""}`}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="divide-y divide-border/50 border-t border-border/50">
              <SettingToggle
                icon={<Bell className="w-5 h-5" />}
                label="Push Notifications"
                description="Get alerts on your device"
                checked={settings.notifications.pushNotifications}
                onChange={(checked) => updateNotifications({ pushNotifications: checked })}
              />
              <SettingToggle
                icon={<MessageSquare className="w-5 h-5" />}
                label="SMS Alerts"
                description="Receive important SMS alerts"
                checked={settings.notifications.smsAlerts}
                onChange={(checked) => updateNotifications({ smsAlerts: checked })}
              />
              <SettingToggle
                icon={<Mail className="w-5 h-5" />}
                label="Email Alerts"
                description="Get email notifications"
                checked={settings.notifications.emailAlerts}
                onChange={(checked) => updateNotifications({ emailAlerts: checked })}
              />
              <SettingToggle
                icon={<Lightbulb className="w-5 h-5" />}
                label="Daily Safety Tips"
                description="Receive daily safety advice"
                checked={settings.notifications.dailyTips}
                onChange={(checked) => updateNotifications({ dailyTips: checked })}
              />
              <SettingToggle
                icon={<Clock className="w-5 h-5" />}
                label="Incident Reminders"
                description="Follow-up on logged incidents"
                checked={settings.notifications.incidentReminders}
                onChange={(checked) => updateNotifications({ incidentReminders: checked })}
              />
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 7: Display & Theme */}
      <Collapsible open={openSections.includes("display")} onOpenChange={() => toggleSection("display")}>
        <Card className="glass rounded-2xl overflow-hidden">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Display & Theme</h3>
                  <p className="text-xs text-muted-foreground">Customize appearance</p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${openSections.includes("display") ? "rotate-180" : ""}`}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">Use dark theme</p>
                  </div>
                </div>
                <Switch
                  checked={settings.display.darkMode}
                  onCheckedChange={(checked) => updateDisplay({ darkMode: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Language
                </Label>
                <Select
                  value={settings.display.language}
                  onValueChange={(value: "en" | "hi") => updateDisplay({ language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Font Size
                </Label>
                <Select
                  value={settings.display.fontSize}
                  onValueChange={(value: "small" | "medium" | "large") => updateDisplay({ fontSize: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 8: Privacy & Data */}
      <Collapsible open={openSections.includes("privacy")} onOpenChange={() => toggleSection("privacy")}>
        <Card className="glass rounded-2xl overflow-hidden">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-risk-high/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-risk-high" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Privacy & Data</h3>
                  <p className="text-xs text-muted-foreground">Manage your data</p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${openSections.includes("privacy") ? "rotate-180" : ""}`}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
              <div className="space-y-2">
                <Label className="text-sm">Auto-delete incidents</Label>
                <Select
                  value={settings.privacy.autoDeleteIncidents}
                  onValueChange={(value: "never" | "1month" | "3months" | "1year") =>
                    updatePrivacy({ autoDeleteIncidents: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="1month">After 1 month</SelectItem>
                    <SelectItem value="3months">After 3 months</SelectItem>
                    <SelectItem value="1year">After 1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Button onClick={handleExportData} variant="outline" className="w-full justify-start bg-transparent">
                  <Download className="w-4 h-4 mr-2" />
                  Export My Data
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-destructive hover:text-destructive bg-transparent"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete All Data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your data including profile, contacts, incidents, and settings.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteAllData}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="ghost" size="sm" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  Privacy Policy
                </Button>
                <Button variant="ghost" size="sm" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  Terms of Service
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 9: About */}
      <Collapsible open={openSections.includes("about")} onOpenChange={() => toggleSection("about")}>
        <Card className="glass rounded-2xl overflow-hidden">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">About</h3>
                  <p className="text-xs text-muted-foreground">App information</p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${openSections.includes("about") ? "rotate-180" : ""}`}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <Shield className="w-10 h-10 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">SafeHer</h4>
                  <p className="text-sm text-muted-foreground">Version 1.0.0</p>
                </div>
                <p className="text-xs text-muted-foreground">AI-powered women safety companion</p>
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for women&apos;s safety
                </div>
              </div>

              <div className="grid gap-2">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Github className="w-5 h-5" />
                  <span className="text-sm font-medium">View on GitHub</span>
                </a>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => resetOnboarding()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restart Onboarding
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">Powered by Google Gemini AI</p>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}

interface SettingToggleProps {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function SettingToggle({ icon, label, description, checked, onChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <p className="font-medium text-foreground text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
