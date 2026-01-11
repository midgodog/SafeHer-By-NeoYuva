"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Mic, MicOff, RefreshCw, AlertCircle, Sparkles, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { parseRiskFromResponse, removeRiskTag, type RiskAssessment } from "@/lib/parse-risk"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  onRiskUpdate: (assessment: RiskAssessment) => void
  apiKey: string
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 max-w-[85%] animate-slide-in-left">
      <div className="flex items-center gap-2 bg-ai-message rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-border/30">
        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        <span className="text-sm text-muted-foreground">SafeHer is thinking</span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  )
}

function ErrorMessage({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-2 max-w-[85%] animate-slide-in-left">
      <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-2xl px-4 py-3">
        <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-destructive font-medium">Something went wrong</p>
          <p className="text-xs text-destructive/70">{error}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Retry
        </Button>
      </div>
    </div>
  )
}

function ApiKeyMissing({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Key className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">API Key Required</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">
        To chat with SafeHer AI, please add your Google Gemini API key in the Settings page.
      </p>
      <Button onClick={onOpenSettings} className="rounded-full">
        Go to Settings
      </Button>
    </div>
  )
}

const WELCOME_MESSAGE: Message = {
  id: "welcome-1",
  role: "assistant",
  content:
    "Hello! I'm SafeHer, your personal safety companion powered by AI. I'm here to support you 24/7 with empathy and understanding.\n\nHow are you feeling right now? Is everything okay, or is there something on your mind you'd like to talk about?\n\n[RISK: LOW - 15%]",
  timestamp: new Date(Date.now() - 60000),
}

export function ChatInterface({ onRiskUpdate, apiKey }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUserMessage, setLastUserMessage] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Parse risk from welcome message on mount
  useEffect(() => {
    const risk = parseRiskFromResponse(WELCOME_MESSAGE.content)
    if (risk) {
      onRiskUpdate(risk)
    }
  }, [onRiskUpdate])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [inputValue])

  const sendMessageToGemini = useCallback(
    async (userMessage: string) => {
      setIsLoading(true)
      setError(null)

      // Add user message immediately
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userMessage,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg])

      try {
        // Prepare conversation history for API
        const conversationForApi = messages
          .filter((m) => m.id !== "welcome-1") // Exclude welcome message from history
          .map((m) => ({
            role: m.role,
            content: m.content,
          }))

        // Add the new user message
        conversationForApi.push({
          role: "user",
          content: userMessage,
        })

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: conversationForApi,
            apiKey: apiKey,
          }),
        })

        const data = await response.json()

        if (!response.ok || data.error) {
          throw new Error(data.error || "Failed to get response")
        }

        // Add AI response
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.content,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, aiMsg])

        const risk = parseRiskFromResponse(data.content)
        if (risk) {
          onRiskUpdate(risk)
        }
      } catch (err) {
        console.error("Chat error:", err)
        setError(err instanceof Error ? err.message : "Failed to send message. Please try again.")
      } finally {
        setIsLoading(false)
      }
    },
    [messages, apiKey, onRiskUpdate],
  )

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return

    const message = inputValue.trim()
    setLastUserMessage(message)
    setInputValue("")

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    await sendMessageToGemini(message)
  }, [inputValue, isLoading, sendMessageToGemini])

  const handleRetry = useCallback(async () => {
    if (!lastUserMessage) return
    setError(null)

    // Remove the last user message that failed
    setMessages((prev) => prev.slice(0, -1))

    await sendMessageToGemini(lastUserMessage)
  }, [lastUserMessage, sendMessageToGemini])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      }
    },
    [handleSendMessage],
  )

  const toggleRecording = useCallback(() => {
    setIsRecording((prev) => !prev)
    // Voice recording implementation placeholder
  }, [])

  // Check if API key is missing
  const hasApiKey = Boolean(apiKey)

  return (
    <Card className="glass h-[60vh] lg:h-[calc(100vh-180px)] flex flex-col rounded-2xl shadow-xl overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-border/50 bg-card/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-risk-low rounded-full border-2 border-card animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">SafeHer AI</h3>
            <p className="text-xs text-muted-foreground">
              {isLoading ? (
                <span className="text-primary">Responding...</span>
              ) : hasApiKey ? (
                <span>Powered by Gemini AI • Online</span>
              ) : (
                <span className="text-amber-500">API Key Required</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const displayContent = message.role === "assistant" ? removeRiskTag(message.content) : message.content

          return (
            <div
              key={message.id}
              className={cn(
                "flex flex-col max-w-[85%]",
                message.role === "user"
                  ? "ml-auto items-end animate-slide-in-right"
                  : "mr-auto items-start animate-slide-in-left",
              )}
            >
              <div
                className={cn(
                  "px-4 py-3 rounded-2xl shadow-sm",
                  message.role === "user"
                    ? "bg-user-message text-foreground rounded-br-md"
                    : "bg-ai-message text-foreground rounded-bl-md border border-border/30",
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{displayContent}</p>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 px-1">{formatTime(message.timestamp)}</span>
            </div>
          )
        })}

        {isLoading && <TypingIndicator />}

        {error && <ErrorMessage error={error} onRetry={handleRetry} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-border/50 bg-card/50">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                hasApiKey ? "Share what's on your mind..." : "Add your API key in Settings to start chatting"
              }
              className="w-full min-h-[44px] max-h-[120px] rounded-2xl bg-muted/50 border-border/50 pr-12 resize-none focus-visible:ring-primary/50 py-3"
              aria-label="Message input"
              rows={1}
              disabled={isLoading || !hasApiKey}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRecording}
            disabled={!hasApiKey}
            className={cn(
              "shrink-0 rounded-full h-11 w-11 transition-all duration-200",
              isRecording
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 scale-110"
                : "text-muted-foreground hover:text-foreground hover:bg-primary/10",
            )}
            aria-label={isRecording ? "Stop recording" : "Start voice input"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || !hasApiKey}
            size="icon"
            className={cn(
              "shrink-0 rounded-full h-11 w-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              inputValue.trim() && !isLoading && hasApiKey && "scale-105 shadow-primary/30",
            )}
            aria-label="Send message"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
          <span className="inline-block w-3 h-3">🔒</span>
          Your conversations are private and secure
        </p>
      </div>
    </Card>
  )
}
