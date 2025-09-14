import { type NextRequest, NextResponse } from "next/server"
import { createGroq } from "@ai-sdk/groq"
import { generateText } from "ai"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { query, posterContent } = await request.json()

    if (!query || !posterContent) {
      return NextResponse.json({ error: "Query and poster content are required" }, { status: 400 })
    }

    console.log("[v0] Processing poster query:", query)

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt: `You are an AI assistant helping visually impaired users understand research posters at academic conferences. 

Poster Content:
${posterContent}

User Query: ${query}

Please provide a clear, concise answer based on the poster content. If the query cannot be answered from the poster content, politely explain what information is available instead. Keep responses conversational and accessible.`,
      maxTokens: 500,
    })

    return NextResponse.json({ answer: text })
  } catch (error) {
    console.error("[v0] Error processing poster query:", error)
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 })
  }
}
