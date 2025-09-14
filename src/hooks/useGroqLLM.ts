"use client"

import { useState, useCallback } from "react"

interface LLMResponse {
  text: string
  action?: string
  confidence: number
}

export const useGroqLLM = () => {
  const [isProcessing, setIsProcessing] = useState(false)

  const enhanceVoiceCommand = useCallback(
    async (
      voiceInput: string,
      context: { posterTitle?: string; authors?: string[]; abstract?: string },
    ): Promise<LLMResponse> => {
      setIsProcessing(true)

      try {
        const response = await fetch("/api/enhance-command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            voiceInput,
            context,
            prompt: `You are accompanying a curious blind person wanting to learn and get the most out of a research conference. Context and key information is important. Your responses should be helpful, concise and easy to follow. The voice has to be brief and not redundant.

User said: "${voiceInput}"
Poster context: ${JSON.stringify(context)}

Provide a clear, brief response with key information. Focus on what matters most for understanding this research.`,
          }),
        })

        const data = await response.json()
        return {
          text:
            data.response ||
            "I didn't understand that. Try saying 'tell me more about this research' or 'what are the main findings'.",
          action: data.action,
          confidence: data.confidence || 0.5,
        }
      } catch (error) {
        console.error("LLM processing error:", error)
        return {
          text: "Sorry, I'm having trouble processing that. Please try again or ask me to repeat the information.",
          action: undefined,
          confidence: 0,
        }
      } finally {
        setIsProcessing(false)
      }
    },
    [],
  )

  const generateAccessibleDescription = useCallback(
    async (posterContent: {
      title: string
      authors: string[]
      abstract: string
      content?: string
    }): Promise<string> => {
      setIsProcessing(true)

      try {
        const response = await fetch("/api/generate-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            posterContent,
            prompt: `You are helping a curious blind person get the most out of a research conference. Create a concise, accessible description for this poster.

Title: ${posterContent.title}
Authors: ${posterContent.authors.join(", ")}
Abstract: ${posterContent.abstract}

Generate a brief, engaging description that:
1. Explains what the research is about and why it matters
2. Highlights key findings and methodology 
3. Mentions practical implications
4. Uses clear, accessible language
5. Is structured for easy audio consumption

Keep it informative but concise - focus on what a curious conference attendee needs to know.`,
          }),
        })

        const data = await response.json()
        return data.description || posterContent.abstract
      } catch (error) {
        console.error("Description generation error:", error)
        return posterContent.abstract
      } finally {
        setIsProcessing(false)
      }
    },
    [],
  )

  return {
    isProcessing,
    enhanceVoiceCommand,
    generateAccessibleDescription,
  }
}
