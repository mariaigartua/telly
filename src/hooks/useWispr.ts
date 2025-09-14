"use client"

import { useState, useRef, useCallback } from "react"

interface WisprConfig {
  // Removed API key - now handled server-side
  baseUrl?: string
}

interface WisprResponse {
  text: string
  confidence: number
  language?: string
}

export const useWispr = (config: WisprConfig = {}) => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any | null>(null)

  const startListening = useCallback(async () => {
    try {
      setError(null)
      setIsListening(true)

      if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
        throw new Error("Speech recognition not supported in this browser")
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()

      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript.trim())
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        setError(`Speech recognition error: ${event.error}`)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current.start()
    } catch (err) {
      console.error("Error starting speech recognition:", err)
      setError("Failed to start speech recognition")
      setIsListening(false)
    }
  }, [])

  const stopListening = useCallback(() => {
    setIsListening(false)

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  const processQuery = useCallback(async (query: string, posterContent: string) => {
    try {
      const response = await fetch("/api/process-poster-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, posterContent }),
      })

      if (!response.ok) {
        throw new Error("Failed to process query")
      }

      const result = await response.json()
      return result.answer
    } catch (err) {
      console.error("Error processing query:", err)
      throw err
    }
  }, [])

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    processQuery,
  }
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}
