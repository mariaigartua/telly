import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { posterContent, prompt } = await request.json()

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt: prompt,
      maxTokens: 500,
      temperature: 0.6,
    })

    return Response.json({
      description: text,
    })
  } catch (error) {
    console.error("Groq API error:", error)
    return Response.json({ error: "Failed to generate description" }, { status: 500 })
  }
}
