"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  Plus,
  FileText,
  BarChart3,
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  Users,
  Camera,
  Shield,
  Download,
  Share2,
  Printer,
  Trash2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  ArrowUpDown,
  FileJson,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPinned,
} from "lucide-react"
import {
  type Incident,
  getIncidents,
  saveIncident,
  deleteIncident,
  generateReportId,
  compressImage,
  calculateAnalytics,
  generateSafetySuggestions,
  exportIncidents,
  type IncidentAnalytics,
} from "@/lib/incidents"

// PDF generation using jsPDF (dynamic import)
async function generatePDF(incident: Incident): Promise<Blob> {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = 20

  // Header with gradient-like effect
  doc.setFillColor(147, 51, 234) // Purple
  doc.rect(0, 0, pageWidth, 40, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("SafeHer Incident Report", margin, 28)

  y = 55

  // Report ID and timestamp
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Report ID: ${incident.reportId}`, margin, y)
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin - 60, y)

  y += 15

  // Severity badge
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  const severityColors = {
    low: [34, 197, 94],
    medium: [234, 179, 8],
    high: [239, 68, 68],
  } as const
  const [r, g, b] = severityColors[incident.severity]
  doc.setFillColor(r, g, b)
  doc.roundedRect(margin, y - 5, 60, 10, 2, 2, "F")
  doc.setTextColor(255, 255, 255)
  doc.text(`${incident.severity.toUpperCase()} SEVERITY`, margin + 5, y + 2)

  y += 20

  // Incident Details Section
  doc.setTextColor(50, 50, 50)
  doc.setFillColor(243, 232, 255) // Light purple
  doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 8, 1, 1, "F")
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Incident Details", margin + 5, y + 1)

  y += 15

  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(80, 80, 80)

  // Date & Time
  doc.setFont("helvetica", "bold")
  doc.text("Date & Time:", margin, y)
  doc.setFont("helvetica", "normal")
  doc.text(new Date(incident.incidentDate).toLocaleString(), margin + 35, y)

  y += 10

  // Location
  doc.setFont("helvetica", "bold")
  doc.text("Location:", margin, y)
  doc.setFont("helvetica", "normal")
  const locationText = incident.location.text || "Not specified"
  doc.text(locationText, margin + 25, y)

  if (incident.location.coordinates) {
    y += 7
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(
      `Coordinates: ${incident.location.coordinates.lat.toFixed(6)}, ${incident.location.coordinates.lng.toFixed(6)}`,
      margin + 25,
      y,
    )
    doc.setFontSize(11)
    doc.setTextColor(80, 80, 80)
  }

  y += 12

  // Witnesses
  doc.setFont("helvetica", "bold")
  doc.text("Witnesses:", margin, y)
  doc.setFont("helvetica", "normal")
  doc.text(incident.hasWitnesses ? "Yes" : "No", margin + 28, y)

  y += 10

  // Police Report
  doc.setFont("helvetica", "bold")
  doc.text("Report to Police:", margin, y)
  doc.setFont("helvetica", "normal")
  doc.text(incident.reportToPolice ? "Yes (Recommended)" : "Not requested", margin + 42, y)

  y += 20

  // Description Section
  doc.setFillColor(243, 232, 255)
  doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 8, 1, 1, "F")
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(50, 50, 50)
  doc.text("Incident Description", margin + 5, y + 1)

  y += 15

  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(80, 80, 80)

  const descriptionLines = doc.splitTextToSize(incident.description, pageWidth - margin * 2)
  doc.text(descriptionLines, margin, y)
  y += descriptionLines.length * 6 + 15

  // AI Safety Recommendations
  if (incident.aiSuggestions && incident.aiSuggestions.length > 0) {
    if (y > 230) {
      doc.addPage()
      y = 20
    }

    doc.setFillColor(243, 232, 255)
    doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 8, 1, 1, "F")
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(50, 50, 50)
    doc.text("Safety Recommendations", margin + 5, y + 1)

    y += 15

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")

    incident.aiSuggestions.forEach((suggestion, index) => {
      doc.setFillColor(147, 51, 234)
      doc.circle(margin + 3, y - 1, 2, "F")
      doc.setTextColor(80, 80, 80)
      const suggestionLines = doc.splitTextToSize(suggestion, pageWidth - margin * 2 - 15)
      doc.text(suggestionLines, margin + 10, y)
      y += suggestionLines.length * 5 + 5
    })
  }

  // Photos section
  if (incident.photos && incident.photos.length > 0) {
    if (y > 200) {
      doc.addPage()
      y = 20
    }

    doc.setFillColor(243, 232, 255)
    doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 8, 1, 1, "F")
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(50, 50, 50)
    doc.text(`Evidence Photos (${incident.photos.length})`, margin + 5, y + 1)

    y += 15

    const photoWidth = 50
    const photoHeight = 40
    let x = margin

    for (const photo of incident.photos) {
      if (x + photoWidth > pageWidth - margin) {
        x = margin
        y += photoHeight + 10
      }

      if (y + photoHeight > 270) {
        doc.addPage()
        y = 20
        x = margin
      }

      try {
        doc.addImage(photo, "JPEG", x, y, photoWidth, photoHeight)
        x += photoWidth + 10
      } catch {
        // Skip if image fails to load
      }
    }

    y += photoHeight + 15
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(
    "This report was generated by SafeHer - Women Safety AI Companion. Keep this document secure.",
    pageWidth / 2,
    footerY,
    { align: "center" },
  )

  return doc.output("blob")
}

export function IncidentLog() {
  const [activeTab, setActiveTab] = useState("new")
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [analytics, setAnalytics] = useState<IncidentAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // New incident form state
  const [incidentDate, setIncidentDate] = useState(() => {
    const now = new Date()
    return now.toISOString().slice(0, 16)
  })
  const [location, setLocation] = useState("")
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium")
  const [hasWitnesses, setHasWitnesses] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [reportToPolice, setReportToPolice] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [lastSubmittedIncident, setLastSubmittedIncident] = useState<Incident | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // My incidents state
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null)
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "severity">("newest")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [viewPdfIncident, setViewPdfIncident] = useState<Incident | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load incidents on mount
  useEffect(() => {
    const loadedIncidents = getIncidents()
    setIncidents(loadedIncidents)
    setAnalytics(calculateAnalytics(loadedIncidents))
    setIsLoading(false)
  }, [])

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setFormErrors((prev) => ({ ...prev, location: "Geolocation not supported" }))
      return
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setCoordinates({ lat: latitude, lng: longitude })

        // Try to get address from coordinates
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          )
          const data = await response.json()
          if (data.display_name) {
            setLocation(data.display_name)
          } else {
            setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
          }
        } catch {
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        }

        setIsGettingLocation(false)
      },
      (error) => {
        setFormErrors((prev) => ({ ...prev, location: `Location error: ${error.message}` }))
        setIsGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  // Handle photo upload
  const handlePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files) return

      const newPhotos: string[] = []

      for (let i = 0; i < Math.min(files.length, 3 - photos.length); i++) {
        try {
          const compressed = await compressImage(files[i])
          newPhotos.push(compressed)
        } catch (error) {
          console.error("Failed to compress image:", error)
        }
      }

      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 3))

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [photos.length],
  )

  // Remove photo
  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // Validate form
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {}

    if (!incidentDate) errors.incidentDate = "Date and time is required"
    if (!location.trim()) errors.location = "Location is required"
    if (!description.trim()) errors.description = "Description is required"
    else if (description.length < 10) errors.description = "Description must be at least 10 characters"
    else if (description.length > 1000) errors.description = "Description must be less than 1000 characters"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [incidentDate, location, description])

  // Submit incident
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    const newIncident: Incident = {
      id: crypto.randomUUID(),
      reportId: generateReportId(),
      timestamp: new Date(),
      incidentDate: new Date(incidentDate),
      location: {
        text: location,
        coordinates: coordinates || undefined,
      },
      description,
      severity,
      hasWitnesses,
      photos,
      reportToPolice,
      aiSuggestions: generateSafetySuggestions({
        severity,
        incidentDate: new Date(incidentDate),
        hasWitnesses,
      }),
    }

    // Simulate processing delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500))

    const success = saveIncident(newIncident)

    if (success) {
      setIncidents((prev) => [newIncident, ...prev])
      setAnalytics(calculateAnalytics([newIncident, ...incidents]))
      setLastSubmittedIncident(newIncident)
      setSubmitSuccess(true)

      // Reset form
      setIncidentDate(new Date().toISOString().slice(0, 16))
      setLocation("")
      setCoordinates(null)
      setDescription("")
      setSeverity("medium")
      setHasWitnesses(false)
      setPhotos([])
      setReportToPolice(false)
    }

    setIsSubmitting(false)
  }, [
    validateForm,
    incidentDate,
    location,
    coordinates,
    description,
    severity,
    hasWitnesses,
    photos,
    reportToPolice,
    incidents,
  ])

  // Download PDF
  const handleDownloadPdf = useCallback(async (incident: Incident) => {
    setIsGeneratingPdf(true)
    try {
      const pdfBlob = await generatePDF(incident)
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `SafeHer-Report-${incident.reportId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to generate PDF:", error)
    }
    setIsGeneratingPdf(false)
  }, [])

  // Share report
  const handleShare = useCallback(async (incident: Incident) => {
    const shareText = `SafeHer Incident Report\nReport ID: ${incident.reportId}\nDate: ${new Date(incident.incidentDate).toLocaleString()}\nLocation: ${incident.location.text}\nSeverity: ${incident.severity.toUpperCase()}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `SafeHer Incident Report - ${incident.reportId}`,
          text: shareText,
        })
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(shareText)
    }
  }, [])

  // Print report
  const handlePrint = useCallback(async (incident: Incident) => {
    setIsGeneratingPdf(true)
    try {
      const pdfBlob = await generatePDF(incident)
      const url = URL.createObjectURL(pdfBlob)
      const printWindow = window.open(url, "_blank")
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }
    } catch (error) {
      console.error("Failed to print:", error)
    }
    setIsGeneratingPdf(false)
  }, [])

  // Delete incident
  const handleDelete = useCallback(
    (id: string) => {
      deleteIncident(id)
      setIncidents((prev) => prev.filter((i) => i.id !== id))
      setAnalytics((prev) => (prev ? calculateAnalytics(incidents.filter((i) => i.id !== id)) : null))
      setDeleteConfirmId(null)
    },
    [incidents],
  )

  // Export all data
  const handleExportAll = useCallback(() => {
    const data = exportIncidents()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `SafeHer-Incidents-Export-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  // Filter and sort incidents
  const filteredIncidents = incidents
    .filter((i) => filterSeverity === "all" || i.severity === filterSeverity)
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.incidentDate).getTime() - new Date(b.incidentDate).getTime()
        case "severity":
          const severityOrder = { high: 0, medium: 1, low: 2 }
          return severityOrder[a.severity] - severityOrder[b.severity]
        default:
          return new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime()
      }
    })

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto">
      <Card className="glass border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5 text-primary" />
            Incident Log
          </CardTitle>
          <CardDescription>Document safety concerns and generate evidence reports</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="new" className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Incident</span>
                <span className="sm:hidden">New</span>
              </TabsTrigger>
              <TabsTrigger value="my" className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">My Incidents</span>
                <span className="sm:hidden">My</span>
                {incidents.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {incidents.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
            </TabsList>

            {/* NEW INCIDENT TAB */}
            <TabsContent value="new" className="mt-0">
              <ScrollArea className="h-[calc(100vh-320px)] pr-4">
                <div className="space-y-5">
                  {/* Date & Time */}
                  <div className="space-y-2">
                    <Label htmlFor="incident-date" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      When did it happen? <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="incident-date"
                      type="datetime-local"
                      value={incidentDate}
                      onChange={(e) => setIncidentDate(e.target.value)}
                      className={cn(formErrors.incidentDate && "border-destructive")}
                    />
                    {formErrors.incidentDate && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.incidentDate}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Where did it happen? <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="location"
                        placeholder="Enter location or use current location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className={cn("flex-1", formErrors.location && "border-destructive")}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        title="Use current location"
                      >
                        {isGettingLocation ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MapPinned className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {coordinates && (
                      <p className="text-xs text-muted-foreground">
                        Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                      </p>
                    )}
                    {formErrors.location && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.location}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      What happened? <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the incident in detail. Include what happened, who was involved, and any other relevant information..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={cn("min-h-[120px] resize-none", formErrors.description && "border-destructive")}
                      maxLength={1000}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Min 10 characters</span>
                      <span
                        className={cn(
                          description.length > 900 && "text-warning",
                          description.length > 1000 && "text-destructive",
                        )}
                      >
                        {description.length}/1000
                      </span>
                    </div>
                    {formErrors.description && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.description}
                      </p>
                    )}
                  </div>

                  {/* Severity */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-primary" />
                      How severe was it? <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                      {(["low", "medium", "high"] as const).map((level) => (
                        <Button
                          key={level}
                          type="button"
                          variant={severity === level ? "default" : "outline"}
                          className={cn(
                            "flex-1 capitalize",
                            severity === level && level === "low" && "bg-green-500 hover:bg-green-600",
                            severity === level && level === "medium" && "bg-yellow-500 hover:bg-yellow-600 text-black",
                            severity === level && level === "high" && "bg-red-500 hover:bg-red-600",
                          )}
                          onClick={() => setSeverity(level)}
                        >
                          {level}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Witnesses */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <Label htmlFor="witnesses" className="flex items-center gap-2 cursor-pointer">
                      <Users className="w-4 h-4 text-primary" />
                      Were there witnesses?
                    </Label>
                    <Switch id="witnesses" checked={hasWitnesses} onCheckedChange={setHasWitnesses} />
                  </div>

                  {/* Photos */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-primary" />
                      Evidence photos (optional)
                    </Label>
                    <div className="flex flex-wrap gap-3">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo || "/placeholder.svg"}
                            alt={`Evidence ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removePhoto(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      {photos.length < 3 && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-20 h-20 flex flex-col items-center justify-center gap-1 bg-transparent"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera className="w-5 h-5" />
                          <span className="text-[10px]">Add</span>
                        </Button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <p className="text-xs text-muted-foreground">
                      Max 3 photos, images will be compressed automatically
                    </p>
                  </div>

                  {/* Report to Police */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <Label htmlFor="police" className="flex items-center gap-2 cursor-pointer">
                      <Shield className="w-4 h-4 text-destructive" />
                      <span>Report to police?</span>
                    </Label>
                    <Switch id="police" checked={reportToPolice} onCheckedChange={setReportToPolice} />
                  </div>

                  {/* Submit Button */}
                  <Button className="w-full h-12 text-lg font-semibold" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Submit Incident
                      </>
                    )}
                  </Button>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* MY INCIDENTS TAB */}
            <TabsContent value="my" className="mt-0">
              {incidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">No incidents recorded</h3>
                  <p className="text-sm text-muted-foreground/70 mt-1">Your documented incidents will appear here</p>
                  <Button className="mt-4" onClick={() => setActiveTab("new")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Record First Incident
                  </Button>
                </div>
              ) : (
                <>
                  {/* Filters */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Severity</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                      <SelectTrigger className="w-[140px]">
                        <ArrowUpDown className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="severity">Most Severe</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm" onClick={handleExportAll} className="ml-auto bg-transparent">
                      <FileJson className="w-4 h-4 mr-2" />
                      Export All
                    </Button>
                  </div>

                  {/* Incidents List */}
                  <ScrollArea className="h-[calc(100vh-400px)]">
                    <div className="space-y-3 pr-4">
                      {filteredIncidents.map((incident) => (
                        <Card
                          key={incident.id}
                          className={cn(
                            "border transition-all",
                            expandedIncident === incident.id && "ring-2 ring-primary",
                          )}
                        >
                          <CardContent className="p-4">
                            <div
                              className="flex items-start justify-between cursor-pointer"
                              onClick={() => setExpandedIncident(expandedIncident === incident.id ? null : incident.id)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      incident.severity === "low" && "bg-green-100 text-green-700",
                                      incident.severity === "medium" && "bg-yellow-100 text-yellow-700",
                                      incident.severity === "high" && "bg-red-100 text-red-700",
                                    )}
                                  >
                                    {incident.severity.toUpperCase()}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(incident.incidentDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm font-medium truncate">{incident.location.text}</p>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {incident.description.slice(0, 50)}...
                                </p>
                              </div>
                              {expandedIncident === incident.id ? (
                                <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              )}
                            </div>

                            {expandedIncident === incident.id && (
                              <div className="mt-4 pt-4 border-t space-y-4">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Full Description</p>
                                  <p className="text-sm">{incident.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground">Date & Time</p>
                                    <p>{new Date(incident.incidentDate).toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground">Witnesses</p>
                                    <p>{incident.hasWitnesses ? "Yes" : "No"}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground">Report ID</p>
                                    <p className="font-mono text-xs">{incident.reportId}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground">Police Report</p>
                                    <p>{incident.reportToPolice ? "Requested" : "No"}</p>
                                  </div>
                                </div>

                                {incident.photos && incident.photos.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Evidence Photos</p>
                                    <div className="flex gap-2">
                                      {incident.photos.map((photo, idx) => (
                                        <img
                                          key={idx}
                                          src={photo || "/placeholder.svg"}
                                          alt={`Evidence ${idx + 1}`}
                                          className="w-16 h-16 object-cover rounded-lg border"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {incident.aiSuggestions && incident.aiSuggestions.length > 0 && (
                                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                                    <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
                                      <Shield className="w-3 h-3" />
                                      Safety Recommendations
                                    </p>
                                    <ul className="text-xs space-y-1">
                                      {incident.aiSuggestions.map((suggestion, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                          <span className="text-primary">•</span>
                                          {suggestion}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                <div className="flex flex-wrap gap-2 pt-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleDownloadPdf(incident)}
                                    disabled={isGeneratingPdf}
                                  >
                                    {isGeneratingPdf ? (
                                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                    ) : (
                                      <Download className="w-4 h-4 mr-1" />
                                    )}
                                    PDF
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleShare(incident)}>
                                    <Share2 className="w-4 h-4 mr-1" />
                                    Share
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handlePrint(incident)}>
                                    <Printer className="w-4 h-4 mr-1" />
                                    Print
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="ml-auto"
                                    onClick={() => setDeleteConfirmId(incident.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </TabsContent>

            {/* ANALYTICS TAB */}
            <TabsContent value="analytics" className="mt-0">
              {!analytics || incidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BarChart3 className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">No analytics available</h3>
                  <p className="text-sm text-muted-foreground/70 mt-1">Record incidents to see pattern insights</p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div className="grid gap-4 pr-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{analytics.totalIncidents}</p>
                            <p className="text-xs text-muted-foreground">Total Incidents</p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-accent/10">
                            <Calendar className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{analytics.thisMonthCount}</p>
                            <p className="text-xs text-muted-foreground">This Month</p>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Severity Trend */}
                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium">Severity Trend</p>
                        <Badge
                          variant="secondary"
                          className={cn(
                            analytics.severityTrend === "improving" && "bg-green-100 text-green-700",
                            analytics.severityTrend === "worsening" && "bg-red-100 text-red-700",
                            analytics.severityTrend === "stable" && "bg-gray-100 text-gray-700",
                          )}
                        >
                          {analytics.severityTrend === "improving" && <TrendingDown className="w-3 h-3 mr-1" />}
                          {analytics.severityTrend === "worsening" && <TrendingUp className="w-3 h-3 mr-1" />}
                          {analytics.severityTrend === "stable" && <Minus className="w-3 h-3 mr-1" />}
                          {analytics.severityTrend.charAt(0).toUpperCase() + analytics.severityTrend.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {(["low", "medium", "high"] as const).map((level) => (
                          <div
                            key={level}
                            className={cn(
                              "flex-1 p-3 rounded-lg text-center",
                              level === "low" && "bg-green-50",
                              level === "medium" && "bg-yellow-50",
                              level === "high" && "bg-red-50",
                            )}
                          >
                            <p className="text-xl font-bold">{analytics.severityCounts[level]}</p>
                            <p className="text-xs capitalize text-muted-foreground">{level}</p>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Most Common Location */}
                    {analytics.mostCommonLocation && (
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-destructive/10">
                            <MapPin className="w-5 h-5 text-destructive" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">Most Incidents In</p>
                            <p className="text-lg font-bold truncate capitalize mt-1">{analytics.mostCommonLocation}</p>
                            <p className="text-xs text-muted-foreground">
                              {analytics.locationCounts[analytics.mostCommonLocation]} incidents
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Peak Time */}
                    {analytics.peakTimeRange && (
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-warning/10">
                            <Clock className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Peak Incident Time</p>
                            <p className="text-lg font-bold mt-1">{analytics.peakTimeRange}</p>
                            <p className="text-xs text-muted-foreground">
                              {analytics.timeCounts[analytics.peakTimeRange]} incidents
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* High Risk Areas */}
                    {analytics.highRiskAreas.length > 0 && (
                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          <p className="text-sm font-medium">High-Risk Areas</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {analytics.highRiskAreas.map((area) => (
                            <Badge key={area} variant="destructive" className="capitalize">
                              {area} ({analytics.locationCounts[area]})
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Time Distribution */}
                    <Card className="p-4">
                      <p className="text-sm font-medium mb-3">Incidents by Time of Day</p>
                      <div className="space-y-2">
                        {Object.entries(analytics.timeCounts).map(([time, count]) => (
                          <div key={time} className="flex items-center gap-3">
                            <span className="text-xs w-32 text-muted-foreground">{time.split(" ")[0]}</span>
                            <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                                style={{
                                  width: `${analytics.totalIncidents > 0 ? (count / analytics.totalIncidents) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium w-6 text-right">{count}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={submitSuccess} onOpenChange={setSubmitSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              Incident Recorded
            </DialogTitle>
            <DialogDescription>Your incident has been securely documented.</DialogDescription>
          </DialogHeader>

          {lastSubmittedIncident && (
            <div className="space-y-3 py-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Report ID</p>
                <p className="font-mono font-bold">{lastSubmittedIncident.reportId}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    handleDownloadPdf(lastSubmittedIncident)
                  }}
                  disabled={isGeneratingPdf}
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download PDF
                </Button>
                <Button variant="outline" onClick={() => handleShare(lastSubmittedIncident)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" onClick={() => handlePrint(lastSubmittedIncident)}>
                  <Printer className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="secondary" onClick={() => setSubmitSuccess(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Incident?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The incident record and any attached photos will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
