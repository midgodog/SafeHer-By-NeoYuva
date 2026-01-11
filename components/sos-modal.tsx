"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { X, Phone, MapPin, Share2, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface SOSModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SOSModal({ isOpen, onClose }: SOSModalProps) {
  const [countdown, setCountdown] = useState(5)
  const [isActivated, setIsActivated] = useState(false)
  const [locationStatus, setLocationStatus] = useState<"getting" | "success" | "error">("getting")
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isSirenPlaying, setIsSirenPlaying] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)

  // Get location when modal opens
  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      setLocationStatus("getting")
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLocationStatus("success")
        },
        () => {
          setLocationStatus("error")
        },
        { enableHighAccuracy: true, timeout: 10000 },
      )
    }
  }, [isOpen])

  // Countdown timer
  useEffect(() => {
    if (!isOpen || isActivated) return

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setIsActivated(true)
    }
  }, [isOpen, countdown, isActivated])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCountdown(5)
      setIsActivated(false)
      setLocationStatus("getting")
      setLocation(null)
      stopSiren()
    }
  }, [isOpen])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSiren()
    }
  }, [])

  const stopSiren = useCallback(() => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop()
      } catch {
        // Already stopped
      }
      oscillatorRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    setIsSirenPlaying(false)
  }, [])

  const handleCallPolice = useCallback(() => {
    window.open("tel:100", "_self")
  }, [])

  const handleCallHelpline = useCallback(() => {
    window.open("tel:1090", "_self")
  }, [])

  const handleShareLocation = useCallback(async () => {
    if (location) {
      const locationUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`
      const shareText = `🚨 EMERGENCY - I need help! This is my current location: ${locationUrl}`

      if (navigator.share) {
        try {
          await navigator.share({
            title: "EMERGENCY - My Current Location",
            text: shareText,
            url: locationUrl,
          })
        } catch {
          // User cancelled
        }
      } else {
        await navigator.clipboard.writeText(shareText)
        // Visual feedback handled by button state
      }
    }
  }, [location])

  const handleToggleSiren = useCallback(() => {
    if (isSirenPlaying) {
      stopSiren()
    } else {
      try {
        const AudioContextClass =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        audioContextRef.current = new AudioContextClass()
        const oscillator = audioContextRef.current.createOscillator()
        const gainNode = audioContextRef.current.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContextRef.current.destination)

        oscillator.type = "sawtooth"
        gainNode.gain.setValueAtTime(0.4, audioContextRef.current.currentTime)

        // Create siren effect
        const now = audioContextRef.current.currentTime
        for (let i = 0; i < 30; i++) {
          oscillator.frequency.setValueAtTime(800, now + i * 0.4)
          oscillator.frequency.linearRampToValueAtTime(1200, now + i * 0.4 + 0.2)
          oscillator.frequency.linearRampToValueAtTime(800, now + i * 0.4 + 0.4)
        }

        oscillator.start()
        oscillator.stop(now + 12) // Play for 12 seconds
        oscillatorRef.current = oscillator

        setIsSirenPlaying(true)

        // Auto-stop after 12 seconds
        setTimeout(() => {
          stopSiren()
        }, 12000)
      } catch (error) {
        console.error("Failed to play siren:", error)
      }
    }
  }, [isSirenPlaying, stopSiren])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md bg-gradient-to-br from-red-600 to-red-800 border-red-500 text-white"
        aria-describedby="sos-description"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-white flex items-center justify-center gap-2">
            <span aria-hidden="true">🚨</span> EMERGENCY SOS <span aria-hidden="true">🚨</span>
          </DialogTitle>
          <DialogDescription id="sos-description" className="sr-only">
            Emergency SOS mode activated. Use the buttons below to call for help or share your location.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Countdown / Activated Status */}
          <div className="text-center" role="status" aria-live="polite">
            {!isActivated ? (
              <div className="space-y-2">
                <div
                  className="w-24 h-24 mx-auto rounded-full bg-white/20 flex items-center justify-center"
                  aria-label={`Emergency services will be alerted in ${countdown} seconds`}
                >
                  <span className="text-5xl font-bold" aria-hidden="true">
                    {countdown}
                  </span>
                </div>
                <p className="text-white/90">Emergency mode activating in...</p>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30 touch-target"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  className="w-24 h-24 mx-auto rounded-full bg-white/20 flex items-center justify-center animate-pulse"
                  role="img"
                  aria-label="SOS Activated"
                >
                  <span className="text-3xl" aria-hidden="true">
                    🆘
                  </span>
                </div>
                <p className="text-xl font-semibold">SOS ACTIVATED</p>
                <p className="text-white/80 text-sm">Help is on the way. Stay calm.</p>
              </div>
            )}
          </div>

          {/* Location Status */}
          <div
            className={cn(
              "p-3 rounded-xl text-center",
              locationStatus === "success"
                ? "bg-green-500/30"
                : locationStatus === "error"
                  ? "bg-yellow-500/30"
                  : "bg-white/10",
            )}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">
                {locationStatus === "getting" && "Getting your location..."}
                {locationStatus === "success" && "Location captured successfully"}
                {locationStatus === "error" && "Location unavailable - please share manually"}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="Emergency actions">
            <Button
              onClick={handleCallPolice}
              className="h-auto py-4 flex flex-col items-center gap-2 bg-white text-red-600 hover:bg-white/90 touch-target"
              aria-label="Call Police - Dial 100"
            >
              <Phone className="w-6 h-6" aria-hidden="true" />
              <div className="text-center">
                <p className="font-bold">Call Police</p>
                <p className="text-xs opacity-70">100</p>
              </div>
            </Button>

            <Button
              onClick={handleCallHelpline}
              className="h-auto py-4 flex flex-col items-center gap-2 bg-white text-red-600 hover:bg-white/90 touch-target"
              aria-label="Call Women Helpline - Dial 1090"
            >
              <Phone className="w-6 h-6" aria-hidden="true" />
              <div className="text-center">
                <p className="font-bold">Women Helpline</p>
                <p className="text-xs opacity-70">1090</p>
              </div>
            </Button>

            <Button
              onClick={handleShareLocation}
              disabled={locationStatus !== "success"}
              className="h-auto py-4 flex flex-col items-center gap-2 bg-white/20 hover:bg-white/30 text-white disabled:opacity-50 touch-target"
              aria-label="Share your location with contacts"
              aria-disabled={locationStatus !== "success"}
            >
              <Share2 className="w-6 h-6" aria-hidden="true" />
              <div className="text-center">
                <p className="font-bold">Share Location</p>
                <p className="text-xs opacity-70">Send to contacts</p>
              </div>
            </Button>

            <Button
              onClick={handleToggleSiren}
              className={cn(
                "h-auto py-4 flex flex-col items-center gap-2 touch-target",
                isSirenPlaying ? "bg-white text-red-600 hover:bg-white/90" : "bg-white/20 hover:bg-white/30 text-white",
              )}
              aria-label={isSirenPlaying ? "Stop siren" : "Play loud siren alarm"}
              aria-pressed={isSirenPlaying}
            >
              {isSirenPlaying ? (
                <VolumeX className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Volume2 className="w-6 h-6" aria-hidden="true" />
              )}
              <div className="text-center">
                <p className="font-bold">{isSirenPlaying ? "Stop Siren" : "Play Siren"}</p>
                <p className="text-xs opacity-70">{isSirenPlaying ? "Turn off alarm" : "Loud alarm"}</p>
              </div>
            </Button>
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4 text-white/70 hover:text-white hover:bg-white/20 touch-target"
            aria-label="Close emergency modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
