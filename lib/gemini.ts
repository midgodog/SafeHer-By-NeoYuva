// Google Gemini 2.5 Flash API Integration
// Endpoint: https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent

export interface GeminiMessage {
  role: "user" | "model"
  parts: { text: string }[]
}

export interface GeminiResponse {
  candidates?: {
    content: {
      parts: { text: string }[]
      role: string
    }
    finishReason: string
    safetyRatings?: {
      category: string
      probability: string
    }[]
  }[]
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
  error?: {
    code: number
    message: string
    status: string
  }
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent"

const SAFETY_SYSTEM_PROMPT = `You are SafeHer, an empathetic AI safety advisor and companion for women. Your primary role is to:

1. LISTEN with genuine empathy to women's safety concerns, fears, and experiences
2. ASSESS the risk level of their situation (Low, Medium, or High)
3. PROVIDE specific, actionable safety advice tailored to their situation
4. SUPPORT them emotionally without judgment
5. EMPOWER them to trust their instincts

IMPORTANT FORMATTING RULES:
- Always end your response with a risk assessment in this EXACT format on a new line:
  [RISK: LOW|MEDIUM|HIGH - percentage%]
- Example: [RISK: MEDIUM - 55%]

RISK ASSESSMENT GUIDELINES:
- LOW (0-33%): Safe environment, routine situations, positive check-ins, feeling good
- MEDIUM (34-66%): Potentially concerning situations like being alone at night, unfamiliar areas, feeling uneasy, uncomfortable situations
- HIGH (67-100%): Immediate danger signs like being followed, threatened, harassed, domestic violence, or in an emergency

RESPONSE STYLE:
- Be warm, supportive, and non-judgmental like a caring friend
- Use clear, simple language
- Provide numbered steps when giving safety advice
- Acknowledge their feelings first before offering solutions
- Keep responses concise but thorough (2-4 paragraphs max)
- Include relevant emergency numbers when appropriate:
  * Women Helpline: 1090
  * Police: 100
  * Ambulance: 102
  * National Commission for Women: 7827-170-170

Remember: Every concern is valid. Trust and validate their instincts. Never dismiss their feelings.`

export async function analyzeWithGemini(
  userMessage: string,
  conversationHistory: GeminiMessage[],
  apiKey: string,
): Promise<{ text: string; error?: string }> {
  try {
    // Build the conversation with system context
    const systemContext: GeminiMessage = {
      role: "user",
      parts: [
        { text: `System Instructions: ${SAFETY_SYSTEM_PROMPT}\n\nPlease follow these instructions for all responses.` },
      ],
    }

    const systemAck: GeminiMessage = {
      role: "model",
      parts: [
        {
          text: "I understand. I am SafeHer, your empathetic AI safety companion. I will assess risk levels, provide actionable advice, and always end my responses with a risk assessment in the format [RISK: LEVEL - percentage%]. How can I help you today?",
        },
      ],
    }

    // Combine system prompt with conversation history and new message
    const contents: GeminiMessage[] = [
      systemContext,
      systemAck,
      ...conversationHistory,
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ]

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Gemini API Error:", errorData)

      if (response.status === 400) {
        return { text: "", error: `Invalid request: ${errorData.error?.message || "Please check your API key"}` }
      } else if (response.status === 403) {
        return { text: "", error: "API key is invalid or has insufficient permissions." }
      } else if (response.status === 429) {
        return { text: "", error: "Rate limit exceeded. Please wait a moment and try again." }
      } else if (response.status === 500) {
        return { text: "", error: "Gemini service is temporarily unavailable. Please try again." }
      }

      return { text: "", error: errorData.error?.message || "Failed to get response from AI" }
    }

    const data: GeminiResponse = await response.json()

    if (data.error) {
      return { text: "", error: data.error.message }
    }

    if (!data.candidates || data.candidates.length === 0) {
      return { text: "", error: "No response generated. Please try rephrasing your message." }
    }

    const candidate = data.candidates[0]

    // Check if response was blocked by safety filters
    if (candidate.finishReason === "SAFETY") {
      return {
        text: "I understand you're going through something difficult. I'm here to help. Could you tell me more about your situation so I can provide appropriate guidance?\n\n[RISK: MEDIUM - 50%]",
        error: undefined,
      }
    }

    const text = candidate.content.parts.map((part) => part.text).join("")

    return { text }
  } catch (error) {
    console.error("[v0] Gemini API call failed:", error)

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return { text: "", error: "Network error. Please check your internet connection." }
    }

    return { text: "", error: "Something went wrong. Please try again." }
  }
}

export async function streamWithGemini(
  userMessage: string,
  conversationHistory: GeminiMessage[],
  apiKey: string,
  onChunk: (chunk: string) => void,
  onComplete: (fullText: string) => void,
  onError: (error: string) => void,
): Promise<void> {
  try {
    const systemContext: GeminiMessage = {
      role: "user",
      parts: [
        { text: `System Instructions: ${SAFETY_SYSTEM_PROMPT}\n\nPlease follow these instructions for all responses.` },
      ],
    }

    const systemAck: GeminiMessage = {
      role: "model",
      parts: [
        {
          text: "I understand. I am SafeHer, your empathetic AI safety companion. I will assess risk levels, provide actionable advice, and always end my responses with a risk assessment in the format [RISK: LEVEL - percentage%]. How can I help you today?",
        },
      ],
    }

    const contents: GeminiMessage[] = [
      systemContext,
      systemAck,
      ...conversationHistory,
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ]

    const streamUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`

    const response = await fetch(streamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Gemini Stream Error:", errorText)
      onError("Failed to connect to AI service. Please try again.")
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      onError("Failed to read response stream")
      return
    }

    const decoder = new TextDecoder()
    let fullText = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split("\n")

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const jsonStr = line.slice(6)
            if (jsonStr.trim() === "[DONE]") continue

            const data = JSON.parse(jsonStr)
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
              const text = data.candidates[0].content.parts[0].text
              fullText += text
              onChunk(text)
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }
    }

    onComplete(fullText)
  } catch (error) {
    console.error("[v0] Gemini streaming failed:", error)
    onError("Connection error. Please try again.")
  }
}
