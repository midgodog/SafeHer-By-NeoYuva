"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Shield,
  Heart,
  User,
  MapPin,
  AlertTriangle,
  ChevronRight,
  SkipForward,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Users,
  MapPinned,
  Bell,
} from "lucide-react"
import { useSettings, type EmergencyContact } from "@/lib/settings-context"

interface OnboardingProps {
  onComplete: () => void
}

const TOTAL_STEPS = 5

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [contacts, setContacts] = useState<Omit<EmergencyContact, "id">[]>([])
  const [newContact, setNewContact] = useState({ name: "", phone: "", relationship: "" })
  const [locationPermission, setLocationPermission] = useState<"pending" | "granted" | "denied">("pending")
  const [riskSensitivity, setRiskSensitivity] = useState(2)
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)

  const {
    updateProfile,
    addEmergencyContact,
    setRiskSensitivity: saveRiskSensitivity,
    completeOnboarding,
    updatePrivacy,
  } = useSettings()

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSkip = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleAddContact = () => {
    if (newContact.name && newContact.phone && contacts.length < 3) {
      setContacts([...contacts, { ...newContact }])
      setNewContact({ name: "", phone: "", relationship: "" })
    }
  }

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index))
  }

  const handleRequestLocation = async () => {
    setIsRequestingLocation(true)
    try {
      const result = await navigator.permissions.query({ name: "geolocation" })
      if (result.state === "granted") {
        setLocationPermission("granted")
        updatePrivacy({ locationServices: true })
      } else if (result.state === "denied") {
        setLocationPermission("denied")
        updatePrivacy({ locationServices: false })
      } else {
        // Prompt user
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationPermission("granted")
            updatePrivacy({ locationServices: true })
          },
          () => {
            setLocationPermission("denied")
            updatePrivacy({ locationServices: false })
          },
        )
      }
    } catch {
      // Fallback: try to get location directly
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationPermission("granted")
          updatePrivacy({ locationServices: true })
        },
        () => {
          setLocationPermission("denied")
          updatePrivacy({ locationServices: false })
        },
      )
    }
    setIsRequestingLocation(false)
  }

  const handleComplete = () => {
    // Save all data
    if (name || age) {
      updateProfile({ name, age })
    }
    contacts.forEach((contact) => {
      addEmergencyContact(contact)
    })
    saveRiskSensitivity(riskSensitivity)
    completeOnboarding()
    onComplete()
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

  const getSensitivityDescription = (value: number) => {
    switch (value) {
      case 1:
        return "Only alert me in clearly dangerous situations. Fewer notifications, suitable for experienced users."
      case 2:
        return "Balanced alerts for moderate risk situations. Recommended for most users."
      case 3:
        return "Alert me for any potential risk, even minor concerns. More notifications, maximum protection."
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
      {/* Progress Indicator */}
      <div className="w-full max-w-md mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground/70">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
          <span className="text-sm text-muted-foreground">{Math.round((currentStep / TOTAL_STEPS) * 100)}%</span>
        </div>
        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out rounded-full"
            style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                step < currentStep
                  ? "bg-primary text-primary-foreground"
                  : step === currentStep
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted/50 text-muted-foreground"
              }`}
            >
              {step < currentStep ? <CheckCircle2 className="w-4 h-4" /> : step}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="glass w-full max-w-md p-6 rounded-3xl shadow-xl">
        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Shield className="w-12 h-12 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Welcome to SafeHer</h1>
              <p className="text-muted-foreground leading-relaxed">
                Your AI-powered safety companion, designed to help you feel secure and supported wherever you go.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">24/7 Support</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <p className="text-xs text-muted-foreground">AI Powered</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-risk-low/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-risk-low" />
                </div>
                <p className="text-xs text-muted-foreground">Always Safe</p>
              </div>
            </div>
            <Button onClick={handleNext} className="w-full h-12 text-lg rounded-xl" size="lg">
              Get Started
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Personal Info */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Tell us about yourself</h2>
              <p className="text-sm text-muted-foreground">This helps personalize your experience (optional)</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  What should we call you?
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium">
                  Your age (optional)
                </Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age"
                  className="h-12 rounded-xl"
                  min="13"
                  max="120"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSkip} variant="outline" className="flex-1 h-12 rounded-xl bg-transparent">
                <SkipForward className="w-4 h-4 mr-2" />
                Skip
              </Button>
              <Button onClick={handleNext} className="flex-1 h-12 rounded-xl">
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Emergency Contacts */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Add Emergency Contacts</h2>
              <p className="text-sm text-muted-foreground">These people will be notified in emergencies (up to 3)</p>
            </div>

            {/* Contact List */}
            {contacts.length > 0 && (
              <div className="space-y-2">
                {contacts.map((contact, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.phone}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveContact(index)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Contact Form */}
            {contacts.length < 3 && (
              <div className="space-y-3 p-4 rounded-xl bg-muted/20">
                <div className="grid gap-3">
                  <Input
                    value={newContact.name}
                    onChange={(e) => setNewContact((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Contact name"
                    className="h-11 rounded-xl"
                  />
                  <Input
                    value={newContact.phone}
                    onChange={(e) => setNewContact((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 XXXXX XXXXX"
                    className="h-11 rounded-xl"
                  />
                  <Select
                    value={newContact.relationship}
                    onValueChange={(value) => setNewContact((prev) => ({ ...prev, relationship: value }))}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Partner">Partner</SelectItem>
                      <SelectItem value="Guardian">Guardian</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddContact}
                  variant="secondary"
                  className="w-full h-11 rounded-xl"
                  disabled={!newContact.name || !newContact.phone}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleSkip} variant="outline" className="flex-1 h-12 rounded-xl bg-transparent">
                <SkipForward className="w-4 h-4 mr-2" />
                Skip
              </Button>
              <Button onClick={handleNext} className="flex-1 h-12 rounded-xl">
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Location Permission */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-risk-low/10 flex items-center justify-center">
                <MapPinned className="w-8 h-8 text-risk-low" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Enable Location Services?</h2>
              <p className="text-sm text-muted-foreground">
                Location helps us find nearby safe places and send your location in emergencies
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/20 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Find nearby resources</p>
                  <p className="text-xs text-muted-foreground">Locate hospitals, police stations, and safe places</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Emergency alerts</p>
                  <p className="text-xs text-muted-foreground">
                    Share your location with contacts when SOS is triggered
                  </p>
                </div>
              </div>
            </div>

            {locationPermission === "pending" && (
              <Button
                onClick={handleRequestLocation}
                className="w-full h-12 rounded-xl"
                disabled={isRequestingLocation}
              >
                {isRequestingLocation ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Enable Location
                  </>
                )}
              </Button>
            )}

            {locationPermission === "granted" && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-risk-low/10 border border-risk-low/30">
                <CheckCircle2 className="w-5 h-5 text-risk-low" />
                <span className="text-sm text-risk-low font-medium">Location enabled successfully!</span>
              </div>
            )}

            {locationPermission === "denied" && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-risk-high/10 border border-risk-high/30">
                <AlertTriangle className="w-5 h-5 text-risk-high" />
                <span className="text-sm text-risk-high">Location denied. You can enable it later in settings.</span>
              </div>
            )}

            <Button
              onClick={handleNext}
              className="w-full h-12 rounded-xl"
              variant={locationPermission === "pending" ? "outline" : "default"}
            >
              {locationPermission === "pending" ? "Skip for now" : "Continue"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 5: Risk Sensitivity */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-risk-medium/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-risk-medium" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Risk Alert Sensitivity</h2>
              <p className="text-sm text-muted-foreground">How sensitive should our safety alerts be?</p>
            </div>

            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Low</span>
                  <span className="text-lg font-bold text-primary">{getSensitivityLabel(riskSensitivity)}</span>
                  <span className="text-sm text-muted-foreground">High</span>
                </div>
                <Slider
                  value={[riskSensitivity]}
                  onValueChange={(value) => setRiskSensitivity(value[0])}
                  min={1}
                  max={3}
                  step={1}
                  className="w-full"
                />
              </div>

              <div
                className={`p-4 rounded-xl ${
                  riskSensitivity === 1
                    ? "bg-risk-low/10 border border-risk-low/30"
                    : riskSensitivity === 2
                      ? "bg-risk-medium/10 border border-risk-medium/30"
                      : "bg-risk-high/10 border border-risk-high/30"
                }`}
              >
                <p className="text-sm">{getSensitivityDescription(riskSensitivity)}</p>
              </div>
            </div>

            <Button
              onClick={handleComplete}
              className="w-full h-14 text-lg rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Using SafeHer
            </Button>
          </div>
        )}
      </Card>

      {/* Skip all button */}
      {currentStep < TOTAL_STEPS && (
        <Button variant="ghost" onClick={handleComplete} className="mt-4 text-muted-foreground hover:text-foreground">
          Skip setup entirely
        </Button>
      )}
    </div>
  )
}
