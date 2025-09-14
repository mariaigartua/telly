"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Mic, MicOff, Eye } from "lucide-react"
import { useTextToSpeech } from "../hooks/useTextToSpeech"
import { useImageDetection } from "../hooks/useImageDetection"
import { useWispr } from "../hooks/useWispr"

interface ScannerPageProps {
  onBack: () => void
}

const getStoredPosters = () => {
  if (typeof window !== "undefined") {
    try {
      // Try localStorage first
      let stored = localStorage.getItem("tellyPosters")
      let source = "localStorage"

      // If localStorage is empty or null, try sessionStorage
      if (!stored || stored === "null") {
        stored = sessionStorage.getItem("tellyPosters")
        source = "sessionStorage"
        console.log("[v0] localStorage empty, trying sessionStorage")
      }

      if (!stored || stored === "null") {
        console.log("[v0] No posters found in either storage")
        return []
      }

      const parsed = JSON.parse(stored)
      console.log(`[v0] Getting stored posters from ${source} - count:`, parsed.length)
      console.log(`[v0] Getting stored posters - first poster:`, parsed[0] ? parsed[0].title : "none")

      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error("[v0] Error parsing stored posters:", error)
      return []
    }
  }
  return []
}

export const ScannerPage = ({ onBack }: ScannerPageProps) => {
  const [isScanning, setIsScanning] = useState(false)
  const [currentPoster, setCurrentPoster] = useState<any>(null)
  const [storedPosters, setStoredPosters] = useState<any[]>([])
  const [statusMessage, setStatusMessage] = useState("")
  const [alertMessage, setAlertMessage] = useState("")

  const { isListening, transcript, error: wisprError, startListening, stopListening, processQuery } = useWispr()
  const { speak, isSpeaking } = useTextToSpeech()
  const { isDetecting, detectedCodes, startDetection, stopDetection, videoRef, canvasRef } = useImageDetection()

  const refreshPosters = () => {
    try {
      const updated = getStoredPosters()
      setStoredPosters(updated)
      console.log("[v0] Refreshed posters - count:", updated.length)

      if (updated.length > 0) {
        console.log(
          "[v0] Refreshed posters - titles:",
          updated.map((p) => p.title),
        )
        console.log(
          "[v0] Refreshed posters - codes:",
          updated.map((p) => p.codeId),
        )
      }

      return updated
    } catch (error) {
      console.error("[v0] Error refreshing posters:", error)
      return []
    }
  }

  useEffect(() => {
    // Initial load
    refreshPosters()

    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      console.log("[v0] Storage change event:", e.type)
      if ("key" in e && e.key === "tellyPosters") {
        console.log("[v0] Storage event for tellyPosters key")
        refreshPosters()
      } else if (e.type === "tellyPostersUpdated") {
        console.log("[v0] Custom tellyPostersUpdated event")
        refreshPosters()
      }
    }

    const handleCustomStorageUpdate = (e: CustomEvent) => {
      console.log("[v0] Custom storage update event:", e.detail)
      refreshPosters()
    }

    // Listen for both storage events and custom events
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("focus", refreshPosters)
    window.addEventListener("tellyPostersUpdated", handleCustomStorageUpdate)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("focus", refreshPosters)
      window.removeEventListener("tellyPostersUpdated", handleCustomStorageUpdate)
    }
  }, []) // Removed storedPosters.length dependency to prevent infinite loop

  const announceStatus = (message: string, isAlert = false) => {
    if (isAlert) {
      setAlertMessage(message)
      setTimeout(() => setAlertMessage(""), 100)
    } else {
      setStatusMessage(message)
      setTimeout(() => setStatusMessage(""), 100)
    }
    speak(message)
  }

  useEffect(() => {
    if (transcript && currentPoster) {
      handleWisprQuery(transcript)
    }
  }, [transcript, currentPoster])

  const handleWisprQuery = async (query: string) => {
    if (!currentPoster) return

    try {
      const answer = await processQuery(query, currentPoster.content || currentPoster.abstract)
      announceStatus(answer)
    } catch (error) {
      console.error("Error processing Wispr query:", error)
      handleBasicVoiceCommand(query.toLowerCase())
    }
  }

  const handleBasicVoiceCommand = (command: string) => {
    if (!currentPoster) return

    if (command.includes("tell me more") || command.includes("more details")) {
      announceStatus(`Here are the full details: ${currentPoster.content || currentPoster.abstract}`)
    } else if (command.includes("authors") || command.includes("who wrote")) {
      announceStatus(`The authors are: ${currentPoster.authors?.join(", ") || "Unknown"}`)
    } else if (command.includes("title") || command.includes("what is this")) {
      announceStatus(`The title is: ${currentPoster.title}`)
    } else if (command.includes("next") || command.includes("continue")) {
      findNextPoster()
    } else if (command.includes("repeat")) {
      announceStatus(`${currentPoster.title} by ${currentPoster.authors?.join(", ") || "Unknown"}`)
    }
  }

  const startScanning = async () => {
    setIsScanning(true)

    const currentPosters = refreshPosters()

    if (currentPosters.length === 0) {
      announceStatus(
        "No research posters have been uploaded and processed yet. Please use the upload feature to add posters with accessibility codes before scanning.",
        true,
      )
      setIsScanning(false)
      return
    }

    announceStatus(
      `Starting camera detection for accessibility codes. ${currentPosters.length} research poster${currentPosters.length === 1 ? "" : "s"} available. Point your camera at accessibility codes next to posters to begin interaction.`,
    )

    try {
      await startDetection()
    } catch (error) {
      announceStatus(
        "Camera access denied. Please allow camera access to scan accessibility codes on research posters.",
        true,
      )
      setIsScanning(false)
    }
  }

  useEffect(() => {
    if (detectedCodes.length > 0 && isScanning) {
      const detectedCode = detectedCodes[0]
      const foundPoster = storedPosters.find((p: any) => p.codeId === detectedCode.id)

      if (foundPoster && foundPoster.id !== currentPoster?.id) {
        setCurrentPoster(foundPoster)
        announceStatus(
          `Poster detected: ${foundPoster.title} by ${foundPoster.authors?.join(", ") || "Unknown"}. Ask me anything about this poster using natural language.`,
        )
      }
    }
  }, [detectedCodes, isScanning, currentPoster, storedPosters])

  const findNextPoster = () => {
    announceStatus("Looking for next poster...")
    if (isDetecting) {
      announceStatus("Keep scanning with your camera to find more posters.")
    } else if (storedPosters.length > 0) {
      const randomPoster = storedPosters[Math.floor(Math.random() * storedPosters.length)]
      setCurrentPoster(randomPoster)
      announceStatus(
        `Poster found: ${randomPoster.title} by ${randomPoster.authors?.join(", ") || "Unknown"}. Ask me anything about this poster.`,
      )
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
      announceStatus("Voice recognition stopped.")
    } else {
      startListening()
      announceStatus("Voice recognition started. Speak your question.")
    }
  }

  const stopScanning = () => {
    setIsScanning(false)
    stopDetection()
    stopListening()
    announceStatus("Scanning stopped.")
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status" aria-label="Status updates">
        {statusMessage}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only" role="alert" aria-label="Important alerts">
        {alertMessage}
      </div>

      <button
        onClick={onBack}
        className="mb-8 p-3 rounded-full hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Go back to home page"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="max-w-sm mx-auto text-center">
        <h1 className="text-2xl font-bold mb-8">Research Poster Scanner</h1>

        {!isScanning ? (
          <div className="space-y-8">
            <div
              className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto"
              role="img"
              aria-label="Camera scanner icon"
            >
              <Eye size={40} />
            </div>

            <p className="text-gray-300 leading-relaxed">
              Tap start to begin real-time camera scanning for accessibility codes next to research posters at
              conferences.
            </p>

            <div className="bg-blue-900 border border-blue-600 p-4 rounded-xl" role="status" aria-live="polite">
              <p className="text-blue-200 text-sm">
                {storedPosters.length > 0
                  ? `${storedPosters.length} research poster${storedPosters.length === 1 ? "" : "s"} processed and available for scanning`
                  : "No research posters uploaded yet. Use the Upload feature to process posters with accessibility codes before scanning."}
              </p>
            </div>

            <button
              onClick={startScanning}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
              aria-describedby="poster-status"
              disabled={storedPosters.length === 0}
            >
              Start Camera Scanning
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="relative bg-black rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-48 object-cover"
                aria-label="Camera feed for scanning accessibility codes"
              />
              <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full opacity-0" aria-hidden="true" />
              {detectedCodes.length > 0 && (
                <div
                  className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs"
                  role="status"
                  aria-live="polite"
                >
                  Accessibility Code Detected
                </div>
              )}
            </div>

            {currentPoster && (
              <div
                className="bg-gray-800 p-6 rounded-xl text-left"
                role="region"
                aria-labelledby="current-poster-title"
                aria-describedby="current-poster-details"
              >
                <h2 id="current-poster-title" className="text-lg font-semibold mb-2">
                  {currentPoster.title}
                </h2>
                <p id="current-poster-details" className="text-gray-300 text-sm mb-2">
                  {currentPoster.authors?.join(", ") || "Authors not specified"}
                </p>
                <p className="text-xs text-gray-400">Accessibility Code: {currentPoster.codeId}</p>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={toggleListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-colors focus:outline-none focus:ring-4 ${
                  isListening
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-200"
                    : "bg-green-600 hover:bg-green-700 focus:ring-green-200"
                }`}
                aria-label={isListening ? "Stop voice recognition" : "Start voice recognition"}
                aria-pressed={isListening}
                role="button"
              >
                {isListening ? <MicOff size={32} /> : <Mic size={32} />}
              </button>

              <p className="text-sm text-gray-300">
                {isListening
                  ? "Listening with advanced speech recognition..."
                  : "Tap to ask questions about the poster"}
              </p>

              {wisprError && (
                <div className="bg-red-900 border border-red-600 p-3 rounded-xl" role="alert" aria-live="assertive">
                  <p className="text-red-200 text-sm">{wisprError}</p>
                </div>
              )}

              {transcript && (
                <div className="bg-gray-800 p-4 rounded-xl" role="log" aria-live="polite">
                  <p className="text-sm text-gray-300">You asked:</p>
                  <p className="text-white">{transcript}</p>
                </div>
              )}
            </div>

            <div className="bg-gray-800 p-4 rounded-xl text-left">
              <h3 className="text-sm font-medium mb-2">Ask Natural Questions About Research:</h3>
              <p className="text-xs text-gray-300">
                Point your camera at accessibility codes and ask questions using natural speech. The AI will provide
                concise, helpful answers about the research.
              </p>
            </div>

            <button
              onClick={stopScanning}
              className="w-full bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 transition-colors focus:outline-none focus:ring-4 focus:ring-red-200"
              aria-label="Stop scanning and return to scanner home"
            >
              Stop Scanning
            </button>

            <div className="text-xs text-gray-500">
              Powered by Wispr Flow - Advanced Speech Recognition for Academic Research
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
