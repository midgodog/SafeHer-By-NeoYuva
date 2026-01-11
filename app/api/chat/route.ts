import { analyzeWithGemini, type GeminiMessage } from "@/lib/gemini"

export const runtime = "edge"
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, apiKey } = await req.json()

    // Get API key from request body (user settings) or server environment variable only
    const geminiApiKey = apiKey || process.env.GEMINI_API_KEY

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error: "API key not configured. Please add your Gemini API key in Settings.",
          code: "NO_API_KEY",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Convert messages to Gemini format
    const conversationHistory: GeminiMessage[] = messages
      .filter((msg: { role: string }) => msg.role === "user" || msg.role === "assistant")
      .slice(-10) // Keep last 10 messages for context
      .map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }))

    // Get the latest user message
    const userMessages = messages.filter((msg: { role: string }) => msg.role === "user")
    const latestUserMessage = userMessages[userMessages.length - 1]?.content || ""

    // Remove the latest user message from history (it will be sent separately)
    const historyWithoutLatest = conversationHistory.slice(0, -1)

    const result = await analyzeWithGemini(latestUserMessage, historyWithoutLatest, geminiApiKey)

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(
      JSON.stringify({
        content: result.text,
        role: "assistant",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to process your message. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
