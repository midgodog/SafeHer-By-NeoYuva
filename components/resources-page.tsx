"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Phone,
  MapPin,
  Navigation,
  Share2,
  Star,
  StarOff,
  Plus,
  Trash2,
  Clock,
  Shield,
  Building2,
  Heart,
  AlertTriangle,
  Flame,
  Ambulance,
  User,
  Users,
  Copy,
  Check,
  Loader2,
  MapPinOff,
  MessageCircle,
  Coffee,
  Train,
} from "lucide-react"
import { cn } from "@/lib/utils"
import resourcesData from "@/data/resources.json"
import {
  getCurrentPosition,
  calculateDistance,
  formatDistance,
  getDirectionsUrl,
  generateShareableLink,
  formatTimeRemaining,
  DEFAULT_LOCATION,
  DEFAULT_ADDRESS,
  type Coordinates,
} from "@/lib/location"
import {
  getTrustedContacts,
  addTrustedContact,
  removeTrustedContact,
  validatePhone,
  formatPhone,
  getInitials,
  type TrustedContact,
} from "@/lib/trusted-contacts"

// Types
interface Resource {
  id: string
  name: string
  number: string
  type: string
  description: string
  address?: string
  distance?: string
  open24Hours?: boolean
  coordinates?: Coordinates
  category?: string
}

interface LocationShare {
  url: string
  expiresAt: Date
  timeLimit: number
}

// Icon mapping
const typeIcons: Record<string, React.ReactNode> = {
  police: <Shield className="w-5 h-5" />,
  ambulance: <Ambulance className="w-5 h-5" />,
  fire: <Flame className="w-5 h-5" />,
  hospital: <Building2 className="w-5 h-5" />,
  clinic: <Heart className="w-5 h-5" />,
  helpline: <Phone className="w-5 h-5" />,
  "police-station": <Shield className="w-5 h-5" />,
  "public-place": <Users className="w-5 h-5" />,
  cafe: <Coffee className="w-5 h-5" />,
  train: <Train className="w-5 h-5" />,
}

// Color mapping
const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  police: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  ambulance: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  fire: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  hospital: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  clinic: { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-200" },
  helpline: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  "police-station": { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  "public-place": { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  cafe: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
}

// Relationship options
const relationshipOptions = ["Parent", "Spouse", "Sibling", "Friend", "Relative", "Colleague", "Neighbor", "Other"]

// Time limit options for location sharing
const timeLimitOptions = [
  { value: 5, label: "5 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 60, label: "1 hour" },
  { value: 480, label: "8 hours" },
]

export function ResourcesPage() {
  // Location state
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  const [locationAddress, setLocationAddress] = useState<string>(DEFAULT_ADDRESS)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Trusted contacts state
  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>([])
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: "", phone: "", relationship: "" })
  const [contactError, setContactError] = useState<string | null>(null)

  // Location sharing state
  const [locationShare, setLocationShare] = useState<LocationShare | null>(null)
  const [shareTimeLimit, setShareTimeLimit] = useState(15)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareCountdown, setShareCountdown] = useState("")

  // Favorites state
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Call confirmation state
  const [callConfirm, setCallConfirm] = useState<{ service: string; number: string } | null>(null)

  // Load data on mount
  useEffect(() => {
    // Load trusted contacts
    setTrustedContacts(getTrustedContacts())

    // Load favorites
    const savedFavorites = localStorage.getItem("safeher_favorites")
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)))
    }

    // Try to get user location
    requestLocation()
  }, [])

  // Update countdown timer for location sharing
  useEffect(() => {
    if (!locationShare) return

    const interval = setInterval(() => {
      const remaining = formatTimeRemaining(locationShare.expiresAt)
      setShareCountdown(remaining)

      if (remaining === "Expired") {
        setLocationShare(null)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [locationShare])

  // Request user location
  const requestLocation = useCallback(async () => {
    setLocationLoading(true)
    setLocationError(null)

    try {
      const coords = await getCurrentPosition()
      setUserLocation(coords)
      setLocationAddress("Your current location")
      setPermissionDenied(false)
    } catch (error) {
      if (error instanceof Error && error.message === "PERMISSION_DENIED") {
        setPermissionDenied(true)
        setLocationError("Location access denied")
      } else {
        setLocationError("Could not get location")
      }
      // Fall back to default location
      setUserLocation(DEFAULT_LOCATION)
      setLocationAddress(DEFAULT_ADDRESS)
    } finally {
      setLocationLoading(false)
    }
  }, [])

  // Calculate distance for a resource
  const getResourceDistance = useCallback(
    (resource: Resource): string => {
      if (!userLocation || !resource.coordinates) {
        return resource.distance || "Unknown"
      }
      const dist = calculateDistance(userLocation, resource.coordinates)
      return formatDistance(dist)
    },
    [userLocation],
  )

  // Sort resources by distance
  const sortByDistance = useCallback(
    <T extends Resource>(resources: T[]): T[] => {
      if (!userLocation) return resources

      return [...resources].sort((a, b) => {
        if (!a.coordinates || !b.coordinates) return 0
        const distA = calculateDistance(userLocation, a.coordinates)
        const distB = calculateDistance(userLocation, b.coordinates)
        return distA - distB
      })
    },
    [userLocation],
  )

  // Handle adding trusted contact
  const handleAddContact = () => {
    setContactError(null)

    if (!newContact.name.trim()) {
      setContactError("Please enter a name")
      return
    }

    if (!newContact.phone.trim()) {
      setContactError("Please enter a phone number")
      return
    }

    if (!validatePhone(newContact.phone)) {
      setContactError("Please enter a valid 10-digit phone number")
      return
    }

    if (!newContact.relationship) {
      setContactError("Please select a relationship")
      return
    }

    if (trustedContacts.length >= 3) {
      setContactError("Maximum 3 contacts allowed")
      return
    }

    const contact = addTrustedContact({
      name: newContact.name.trim(),
      phone: newContact.phone.replace(/\D/g, ""),
      relationship: newContact.relationship,
    })

    setTrustedContacts([...trustedContacts, contact])
    setNewContact({ name: "", phone: "", relationship: "" })
    setShowAddContact(false)
  }

  // Handle removing trusted contact
  const handleRemoveContact = (id: string) => {
    removeTrustedContact(id)
    setTrustedContacts(trustedContacts.filter((c) => c.id !== id))
  }

  // Handle location sharing
  const handleShareLocation = () => {
    const coords = userLocation || DEFAULT_LOCATION
    const share = generateShareableLink(coords, shareTimeLimit)
    setLocationShare({ ...share, timeLimit: shareTimeLimit })
    setShareCountdown(formatTimeRemaining(share.expiresAt))
    setShowShareDialog(false)
  }

  // Copy share link
  const copyShareLink = async () => {
    if (!locationShare) return

    try {
      await navigator.clipboard.writeText(locationShare.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea")
      textarea.value = locationShare.url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(id)) {
      newFavorites.delete(id)
    } else {
      newFavorites.add(id)
    }
    setFavorites(newFavorites)
    localStorage.setItem("safeher_favorites", JSON.stringify([...newFavorites]))
  }

  // Handle call with confirmation
  const handleCall = (service: string, number: string) => {
    setCallConfirm({ service, number })
  }

  // Confirm and make call
  const confirmCall = () => {
    if (callConfirm) {
      window.open(`tel:${callConfirm.number}`, "_self")
      setCallConfirm(null)
    }
  }

  // Share via WhatsApp
  const shareViaWhatsApp = (contact: TrustedContact) => {
    const coords = userLocation || DEFAULT_LOCATION
    const message = `I'm sharing my location with you. Please check on me. Location: https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    const url = `https://wa.me/${contact.phone}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank")
  }

  // Resource card component
  const ResourceCard = ({ resource }: { resource: Resource }) => {
    const colors = typeColors[resource.type] || typeColors.helpline
    const icon = typeIcons[resource.type] || <Phone className="w-5 h-5" />
    const isFavorite = favorites.has(resource.id)
    const distance = getResourceDistance(resource)

    return (
      <Card
        className={cn(
          "glass rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg",
          "border",
          colors.border,
        )}
      >
        <div className={cn("h-1", colors.bg.replace("50", "500"))} />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-start gap-3">
              <div
                className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", colors.bg, colors.text)}
              >
                {icon}
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-foreground text-sm leading-tight">{resource.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{resource.description}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => toggleFavorite(resource.id)}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorite ? (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              ) : (
                <StarOff className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </div>

          {/* Distance & Status */}
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              {distance}
            </Badge>
            {resource.open24Hours !== undefined && (
              <Badge
                variant={resource.open24Hours ? "default" : "secondary"}
                className={cn(
                  "text-xs",
                  resource.open24Hours ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-600",
                )}
              >
                <Clock className="w-3 h-3 mr-1" />
                {resource.open24Hours ? "Open 24/7" : "Limited Hours"}
              </Badge>
            )}
          </div>

          {/* Address */}
          {resource.address && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{resource.address}</p>}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {resource.number && (
              <Button
                size="sm"
                className={cn("flex-1 h-9", colors.bg, colors.text, "hover:opacity-90 border", colors.border)}
                onClick={() => handleCall(resource.name, resource.number)}
              >
                <Phone className="w-4 h-4 mr-1.5" />
                Call {resource.number.length <= 4 ? resource.number : ""}
              </Button>
            )}

            {resource.coordinates && (
              <Button
                size="sm"
                variant="outline"
                className={cn("h-9 bg-transparent", !resource.number && "flex-1")}
                onClick={() =>
                  window.open(getDirectionsUrl(resource.coordinates!, userLocation || undefined), "_blank")
                }
              >
                <Navigation className="w-4 h-4" />
                {!resource.number && <span className="ml-1.5">Get Directions</span>}
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              className="h-9 bg-transparent"
              onClick={() => {
                const text = `${resource.name}${resource.number ? `: ${resource.number}` : ""}${resource.address ? ` - ${resource.address}` : ""}`
                navigator.clipboard.writeText(text)
              }}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-4 pb-4">
      {/* Header */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Smart Resources Hub</h2>
          </div>
        </div>

        {/* Location Status */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
          <div className="flex items-center gap-2">
            {locationLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : permissionDenied ? (
              <MapPinOff className="w-4 h-4 text-destructive" />
            ) : (
              <MapPin className="w-4 h-4 text-primary" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {locationLoading ? "Getting location..." : locationAddress}
              </p>
              {locationError && <p className="text-xs text-destructive">{locationError}</p>}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={requestLocation} disabled={locationLoading}>
            {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Emergency Quick-Dial Buttons */}
      <Card className="glass rounded-2xl p-4">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Emergency Quick-Dial
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            size="lg"
            className="h-16 bg-red-500 hover:bg-red-600 text-white rounded-xl flex flex-col items-center justify-center gap-1"
            onClick={() => handleCall("Police", "100")}
          >
            <Shield className="w-6 h-6" />
            <span className="text-sm font-semibold">Call Police 100</span>
          </Button>
          <Button
            size="lg"
            className="h-16 bg-purple-500 hover:bg-purple-600 text-white rounded-xl flex flex-col items-center justify-center gap-1"
            onClick={() => handleCall("Women Helpline", "1090")}
          >
            <Phone className="w-6 h-6" />
            <span className="text-sm font-semibold">Women Helpline 1090</span>
          </Button>
          <Button
            size="lg"
            className="h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex flex-col items-center justify-center gap-1"
            onClick={() => handleCall("Ambulance", "102")}
          >
            <Ambulance className="w-6 h-6" />
            <span className="text-sm font-semibold">Call Ambulance 102</span>
          </Button>
        </div>
      </Card>

      {/* Location Sharing */}
      <Card className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share My Location
          </h3>
        </div>

        {locationShare ? (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-primary">Location sharing active</span>
                <Badge variant="outline" className="text-primary border-primary">
                  <Clock className="w-3 h-3 mr-1" />
                  {shareCountdown}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Input value={locationShare.url} readOnly className="text-xs bg-background" />
                <Button size="sm" variant="outline" onClick={copyShareLink}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive hover:text-destructive bg-transparent"
              onClick={() => setLocationShare(null)}
            >
              Stop Sharing
            </Button>
          </div>
        ) : (
          <Button className="w-full bg-transparent" variant="outline" onClick={() => setShowShareDialog(true)}>
            <Share2 className="w-4 h-4 mr-2" />
            Generate Shareable Link
          </Button>
        )}
      </Card>

      {/* Trusted Contacts */}
      <Card className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Trusted Contacts
          </h3>
          {trustedContacts.length < 3 && (
            <Button size="sm" variant="outline" onClick={() => setShowAddContact(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}
        </div>

        {trustedContacts.length === 0 ? (
          <div className="text-center py-6">
            <User className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No trusted contacts yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add up to 3 emergency contacts</p>
            <Button size="sm" variant="outline" className="mt-3 bg-transparent" onClick={() => setShowAddContact(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Contact
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {trustedContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary">{getInitials(contact.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{contact.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {contact.relationship} • {formatPhone(contact.phone)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-green-600 hover:bg-green-50"
                    onClick={() => shareViaWhatsApp(contact)}
                    aria-label="Share location via WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-primary"
                    onClick={() => handleCall(contact.name, contact.phone)}
                    aria-label={`Call ${contact.name}`}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveContact(contact.id)}
                    aria-label={`Remove ${contact.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Resource Categories */}
      <Tabs defaultValue="emergency" className="w-full">
        <TabsList className="w-full glass rounded-xl h-auto p-1 grid grid-cols-4">
          <TabsTrigger value="emergency" className="text-xs py-2 rounded-lg">
            Emergency
          </TabsTrigger>
          <TabsTrigger value="health" className="text-xs py-2 rounded-lg">
            Health
          </TabsTrigger>
          <TabsTrigger value="helplines" className="text-xs py-2 rounded-lg">
            Helplines
          </TabsTrigger>
          <TabsTrigger value="safe" className="text-xs py-2 rounded-lg">
            Safe Places
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emergency" className="mt-4 space-y-3">
          {resourcesData.emergencyServices.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </TabsContent>

        <TabsContent value="health" className="mt-4 space-y-3">
          {sortByDistance(resourcesData.healthServices as Resource[]).map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </TabsContent>

        <TabsContent value="helplines" className="mt-4 space-y-3">
          {resourcesData.helplines.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </TabsContent>

        <TabsContent value="safe" className="mt-4 space-y-3">
          {sortByDistance(resourcesData.safePlaces as Resource[]).map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Quick Find Nearby */}
      <Card className="glass rounded-2xl p-4">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary" />
          Quick Find Nearby
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1 rounded-xl bg-transparent"
            onClick={() => window.open("https://www.google.com/maps/search/hospital+near+me", "_blank")}
          >
            <Building2 className="w-5 h-5 text-blue-500" />
            <span className="text-xs">Hospitals</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1 rounded-xl bg-transparent"
            onClick={() => window.open("https://www.google.com/maps/search/police+station+near+me", "_blank")}
          >
            <Shield className="w-5 h-5 text-red-500" />
            <span className="text-xs">Police Stations</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1 rounded-xl bg-transparent"
            onClick={() => window.open("https://www.google.com/maps/search/pharmacy+near+me", "_blank")}
          >
            <Heart className="w-5 h-5 text-green-500" />
            <span className="text-xs">Pharmacies</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1 rounded-xl bg-transparent"
            onClick={() => window.open("https://www.google.com/maps/search/24+hour+cafe+near+me", "_blank")}
          >
            <Coffee className="w-5 h-5 text-amber-500" />
            <span className="text-xs">24hr Cafes</span>
          </Button>
        </div>
      </Card>

      {/* Call Confirmation Dialog */}
      <Dialog open={!!callConfirm} onOpenChange={() => setCallConfirm(null)}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Confirm Call
            </DialogTitle>
            <DialogDescription>
              You are about to call <strong>{callConfirm?.service}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="text-3xl font-bold text-foreground mb-2">{callConfirm?.number}</div>
            <p className="text-sm text-muted-foreground">Tap to confirm and dial</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCallConfirm(null)}>
              Cancel
            </Button>
            <Button onClick={confirmCall} className="bg-green-500 hover:bg-green-600">
              <Phone className="w-4 h-4 mr-2" />
              Call Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add Trusted Contact
            </DialogTitle>
            <DialogDescription>Add someone you trust to contact in emergencies</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="10-digit mobile number"
                type="tel"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship</Label>
              <Select
                value={newContact.relationship}
                onValueChange={(value) => setNewContact({ ...newContact, relationship: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {contactError && <p className="text-sm text-destructive">{contactError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddContact(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddContact}>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Location Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Share My Location
            </DialogTitle>
            <DialogDescription>Generate a link to share your current location</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>How long should the link be valid?</Label>
              <Select value={shareTimeLimit.toString()} onValueChange={(value) => setShareTimeLimit(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeLimitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 text-sm text-muted-foreground">
              Your location will be shared as a Google Maps link that others can view.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleShareLocation}>
              <Share2 className="w-4 h-4 mr-2" />
              Generate Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
