// Location utilities for the Smart Resources Hub

export interface Coordinates {
  lat: number
  lng: number
}

export interface LocationState {
  coordinates: Coordinates | null
  address: string
  isLoading: boolean
  error: string | null
  permissionDenied: boolean
}

// Default location: Chiplun, Maharashtra
export const DEFAULT_LOCATION: Coordinates = {
  lat: 17.5333,
  lng: 73.5167,
}

export const DEFAULT_ADDRESS = "Chiplun, Maharashtra"

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(coord2.lat - coord1.lat)
  const dLng = toRad(coord2.lng - coord1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 10) / 10 // Round to 1 decimal place
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Format distance for display
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`
  }
  return `${km.toFixed(1)} km`
}

// Get current position using Geolocation API
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("PERMISSION_DENIED"))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Location information is unavailable"))
            break
          case error.TIMEOUT:
            reject(new Error("Location request timed out"))
            break
          default:
            reject(new Error("An unknown error occurred"))
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  })
}

// Generate Google Maps directions URL
export function getDirectionsUrl(destination: Coordinates, origin?: Coordinates): string {
  const destStr = `${destination.lat},${destination.lng}`
  if (origin) {
    const originStr = `${origin.lat},${origin.lng}`
    return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}`
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destStr}`
}

// Generate Google Maps search URL
export function getSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}`
}

// Generate shareable location link
export function generateShareableLink(
  coordinates: Coordinates,
  expiryMinutes: number,
): { url: string; expiresAt: Date } {
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000)
  const url = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`
  return { url, expiresAt }
}

// Format time remaining
export function formatTimeRemaining(expiresAt: Date): string {
  const now = new Date()
  const diff = expiresAt.getTime() - now.getTime()

  if (diff <= 0) return "Expired"

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s remaining`
  }
  return `${seconds}s remaining`
}
