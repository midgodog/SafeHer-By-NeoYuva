// Incident data types and localStorage utilities

export interface Incident {
  id: string
  reportId: string
  timestamp: Date
  incidentDate: Date
  location: {
    text: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  description: string
  severity: "low" | "medium" | "high"
  hasWitnesses: boolean
  photos: string[] // Base64 encoded
  reportToPolice: boolean
  aiSuggestions?: string[]
}

export interface IncidentStorage {
  incidents: Incident[]
}

const INCIDENTS_STORAGE_KEY = "safeher_incidents"
const MAX_PHOTO_SIZE = 800 // Max width/height in pixels
const MAX_PHOTOS_PER_INCIDENT = 3
const MAX_STORAGE_PER_INCIDENT = 2 * 1024 * 1024 // 2MB

// Generate unique report ID
export function generateReportId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `SH-${timestamp}-${random}`
}

// Compress image to reduce size
export async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let { width, height } = img

        // Scale down if too large
        if (width > MAX_PHOTO_SIZE || height > MAX_PHOTO_SIZE) {
          const ratio = Math.min(MAX_PHOTO_SIZE / width, MAX_PHOTO_SIZE / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert to JPEG with quality compression
        let quality = 0.8
        let base64 = canvas.toDataURL("image/jpeg", quality)

        // Further reduce quality if still too large
        while (base64.length > 500000 && quality > 0.3) {
          quality -= 0.1
          base64 = canvas.toDataURL("image/jpeg", quality)
        }

        resolve(base64)
      }
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

// Get all incidents from localStorage
export function getIncidents(): Incident[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(INCIDENTS_STORAGE_KEY)
    if (!stored) return []

    const data: IncidentStorage = JSON.parse(stored)
    return data.incidents.map((incident) => ({
      ...incident,
      timestamp: new Date(incident.timestamp),
      incidentDate: new Date(incident.incidentDate),
    }))
  } catch {
    return []
  }
}

// Save incident to localStorage
export function saveIncident(incident: Incident): boolean {
  try {
    const incidents = getIncidents()
    incidents.unshift(incident) // Add to beginning (newest first)

    const data: IncidentStorage = { incidents }
    const serialized = JSON.stringify(data)

    // Check storage size
    if (serialized.length > 5 * 1024 * 1024) {
      // 5MB limit
      console.warn("Storage limit approaching, removing oldest incidents")
      while (incidents.length > 10 && JSON.stringify({ incidents }).length > 5 * 1024 * 1024) {
        incidents.pop()
      }
    }

    localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify({ incidents }))
    return true
  } catch (error) {
    console.error("Failed to save incident:", error)
    return false
  }
}

// Delete incident
export function deleteIncident(id: string): boolean {
  try {
    const incidents = getIncidents().filter((i) => i.id !== id)
    localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify({ incidents }))
    return true
  } catch {
    return false
  }
}

// Get incident by ID
export function getIncidentById(id: string): Incident | null {
  const incidents = getIncidents()
  return incidents.find((i) => i.id === id) || null
}

// Export all incidents as JSON
export function exportIncidents(): string {
  const incidents = getIncidents()
  return JSON.stringify(incidents, null, 2)
}

// Analytics helpers
export interface IncidentAnalytics {
  totalIncidents: number
  thisMonthCount: number
  mostCommonLocation: string | null
  locationCounts: Record<string, number>
  peakTimeRange: string | null
  timeCounts: Record<string, number>
  severityTrend: "improving" | "worsening" | "stable"
  severityCounts: Record<string, number>
  highRiskAreas: string[]
}

export function calculateAnalytics(incidents: Incident[]): IncidentAnalytics {
  if (incidents.length === 0) {
    return {
      totalIncidents: 0,
      thisMonthCount: 0,
      mostCommonLocation: null,
      locationCounts: {},
      peakTimeRange: null,
      timeCounts: {},
      severityTrend: "stable",
      severityCounts: { low: 0, medium: 0, high: 0 },
      highRiskAreas: [],
    }
  }

  // Count incidents this month
  const now = new Date()
  const thisMonth = incidents.filter((i) => {
    const date = new Date(i.incidentDate)
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length

  // Location analysis
  const locationCounts: Record<string, number> = {}
  incidents.forEach((i) => {
    const loc = i.location.text.toLowerCase().trim()
    if (loc) {
      locationCounts[loc] = (locationCounts[loc] || 0) + 1
    }
  })

  const sortedLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])
  const mostCommonLocation = sortedLocations[0]?.[0] || null

  // High risk areas (2+ incidents)
  const highRiskAreas = sortedLocations.filter(([_, count]) => count >= 2).map(([loc]) => loc)

  // Time analysis
  const timeRanges = {
    "Morning (6AM-12PM)": 0,
    "Afternoon (12PM-6PM)": 0,
    "Evening (6PM-10PM)": 0,
    "Night (10PM-6AM)": 0,
  }

  incidents.forEach((i) => {
    const hour = new Date(i.incidentDate).getHours()
    if (hour >= 6 && hour < 12) timeRanges["Morning (6AM-12PM)"]++
    else if (hour >= 12 && hour < 18) timeRanges["Afternoon (12PM-6PM)"]++
    else if (hour >= 18 && hour < 22) timeRanges["Evening (6PM-10PM)"]++
    else timeRanges["Night (10PM-6AM)"]++
  })

  const peakTime = Object.entries(timeRanges).sort((a, b) => b[1] - a[1])[0]
  const peakTimeRange = peakTime[1] > 0 ? peakTime[0] : null

  // Severity analysis
  const severityCounts = { low: 0, medium: 0, high: 0 }
  incidents.forEach((i) => {
    severityCounts[i.severity]++
  })

  // Calculate trend (compare last 3 vs previous 3)
  let severityTrend: "improving" | "worsening" | "stable" = "stable"
  if (incidents.length >= 6) {
    const recent = incidents.slice(0, 3)
    const older = incidents.slice(3, 6)

    const severityScore = (i: Incident) => (i.severity === "high" ? 3 : i.severity === "medium" ? 2 : 1)

    const recentAvg = recent.reduce((sum, i) => sum + severityScore(i), 0) / 3
    const olderAvg = older.reduce((sum, i) => sum + severityScore(i), 0) / 3

    if (recentAvg < olderAvg - 0.5) severityTrend = "improving"
    else if (recentAvg > olderAvg + 0.5) severityTrend = "worsening"
  }

  return {
    totalIncidents: incidents.length,
    thisMonthCount: thisMonth,
    mostCommonLocation,
    locationCounts,
    peakTimeRange,
    timeCounts: timeRanges,
    severityTrend,
    severityCounts,
    highRiskAreas,
  }
}

// Generate AI suggestions based on incident
export function generateSafetySuggestions(incident: Partial<Incident>): string[] {
  const suggestions: string[] = []

  if (incident.severity === "high") {
    suggestions.push("Consider filing an official police report immediately")
    suggestions.push("Document all evidence and keep copies in multiple secure locations")
    suggestions.push("Reach out to a women's helpline for professional guidance")
  } else if (incident.severity === "medium") {
    suggestions.push("Monitor the situation and document any further incidents")
    suggestions.push("Share your location with trusted contacts when in the area")
    suggestions.push("Consider changing your route if this location is on your regular path")
  } else {
    suggestions.push("Stay aware of your surroundings in this area")
    suggestions.push("Trust your instincts if you feel unsafe")
  }

  // Time-based suggestions
  if (incident.incidentDate) {
    const hour = new Date(incident.incidentDate).getHours()
    if (hour >= 22 || hour < 6) {
      suggestions.push("Avoid being alone in this area during late night hours")
      suggestions.push("Keep emergency numbers on speed dial when traveling at night")
    }
  }

  // Witness-based suggestions
  if (incident.hasWitnesses) {
    suggestions.push("Try to get witness contact information for future reference")
  } else {
    suggestions.push("Travel with a companion when possible in isolated areas")
  }

  return suggestions.slice(0, 5) // Return top 5 suggestions
}
