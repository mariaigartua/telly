import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { voiceInput, context, prompt } = await request.json()

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt: prompt,
      maxTokens: 200,
      temperature: 0.7,
    })

    // Parse the response to extract action and confidence
    const lines = text.split("\n")
    const response = text
    let action = undefined
    const confidence = 0.8

    // Simple parsing for actions
    if (voiceInput.toLowerCase().includes("more") || voiceInput.toLowerCase().includes("detail")) {
      action = "read_abstract"
    } else if (voiceInput.toLowerCase().includes("author")) {
      action = "read_authors"
    } else if (voiceInput.toLowerCase().includes("next")) {
      action = "next_poster"
    } else if (voiceInput.toLowerCase().includes("repeat")) {
      action = "repeat"
    }

    return Response.json({
      response: response,
      action: action,
      confidence: confidence,
    })
  } catch (error) {
    console.error("Groq API error:", error)
    return Response.json({ error: "Failed to process voice command" }, { status: 500 })
  }
}
