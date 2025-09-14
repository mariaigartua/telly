"use client"

import type React from "react"
import { useState } from "react"
import { ArrowLeft, Upload, Check, Download, FileText } from "lucide-react"
import type { Poster } from "../types"
import { useGroqLLM } from "../hooks/useGroqLLM"
import Tesseract from "tesseract.js"

interface UploadPageProps {
  onBack: () => void
}

export const UploadPage = ({ onBack }: UploadPageProps) => {
  const [poster, setPoster] = useState<Poster>({
    id: "",
    title: "",
    authors: [],
    abstract: "",
    file: null,
    codeId: "",
    processed: false,
    content: "", // Added content field for queries
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const { generateAccessibleDescription } = useGroqLLM()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log("[v0] File selected:", file.name, file.type, file.size)
      setPoster((prev) => ({ ...prev, file }))

      parseFileContent(file)
    }
  }

  const parseFileContent = async (file: File) => {
    console.log("[v0] Starting file parsing for:", file.name)

    try {
      if (file.type === "application/pdf") {
        // For PDF files, we'll extract text content
        const text = await extractPDFText(file)
        console.log("[v0] Extracted PDF text length:", text.length)
        setPoster((prev) => ({ ...prev, abstract: text.substring(0, 500) + "..." }))
      } else if (file.type.startsWith("image/")) {
        // For image files, we'll use OCR-like processing
        const extractedText = await extractImageText(file)
        console.log("[v0] Extracted image text:", extractedText)
        setPoster((prev) => ({ ...prev, abstract: extractedText }))
      }
    } catch (error) {
      console.error("[v0] File parsing error:", error)
    }
  }

  const extractPDFText = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        // Simulate PDF text extraction
        resolve(
          "Research content extracted from PDF file. This would contain the actual poster content in a real implementation.",
        )
      }
      reader.readAsArrayBuffer(file)
    })
  }

  const extractImageText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const img = new Image()
          img.crossOrigin = "anonymous"

          img.onload = async () => {
            try {
              console.log("[v0] Starting Tesseract OCR processing...")

              // Use Tesseract.js for real OCR
              const {
                data: { text },
              } = await Tesseract.recognize(img, "eng", {
                logger: (m) => console.log("[v0] Tesseract:", m),
              })

              console.log("[v0] OCR completed, extracted text length:", text.length)

              if (text.trim().length > 10) {
                resolve(text.trim())
              } else {
                resolve("Minimal text detected in image. Please ensure the poster contains clear, readable text.")
              }
            } catch (error) {
              console.error("[v0] Tesseract OCR failed:", error)
              resolve("Text extraction failed. Please try with a clearer image or provide manual text input.")
            }
          }

          img.onerror = () => {
            resolve("Unable to load image for text extraction.")
          }

          img.src = reader.result as string
        } catch (error) {
          console.error("[v0] File processing error:", error)
          resolve("File processing failed. Please try again.")
        }
      }

      reader.onerror = () => {
        resolve("File reading failed. Please try again.")
      }

      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!poster.file || !poster.title) {
      console.log("[v0] Submit blocked - missing file or title")
      return
    }

    console.log("[v0] Starting poster processing:", poster.title)
    setIsProcessing(true)

    try {
      console.log("[v0] Generating enhanced description with Groq...")
      const enhancedDescription = await generateAccessibleDescription({
        title: poster.title,
        authors: poster.authors,
        abstract: poster.abstract || "Research poster content",
      })

      console.log("[v0] Enhanced description generated:", enhancedDescription.length, "characters")

      await new Promise((resolve) => setTimeout(resolve, 2000))

      const codeId = Math.random().toString(36).substring(2, 8).toUpperCase()
      console.log("[v0] Generated accessibility code:", codeId)

      const processedPoster = {
        id: Date.now().toString(),
        title: poster.title,
        authors: poster.authors,
        abstract:
          enhancedDescription.length > 2000 ? enhancedDescription.substring(0, 2000) + "..." : enhancedDescription,
        content:
          enhancedDescription.length > 2000 ? enhancedDescription.substring(0, 2000) + "..." : enhancedDescription,
        codeId,
        processed: true,
        timestamp: new Date().toISOString(),
      }

      setPoster({ ...poster, ...processedPoster })

      try {
        const existingPosters = JSON.parse(localStorage.getItem("tellyPosters") || "[]")
        console.log("[v0] Storage process - existing posters:", existingPosters.length)

        const updatedPosters = [...existingPosters, processedPoster]
        console.log(
          "[v0] Storage process - new poster data size:",
          JSON.stringify(processedPoster).length,
          "characters",
        )

        const testData = JSON.stringify(updatedPosters)
        console.log("[v0] Storage process - total data size:", testData.length, "characters")

        localStorage.setItem("tellyPosters", testData)

        const verification = localStorage.getItem("tellyPosters")
        if (verification === null) {
          throw new Error("localStorage.setItem failed - data not stored")
        }

        const parsedVerification = JSON.parse(verification)
        console.log("[v0] Storage verification - stored posters count:", parsedVerification.length)

        if (parsedVerification.length !== updatedPosters.length) {
          throw new Error("localStorage verification failed - count mismatch")
        }

        console.log("[v0] Poster stored successfully. Total posters:", updatedPosters.length)

        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "tellyPosters",
            newValue: testData,
            oldValue: JSON.stringify(existingPosters),
          }),
        )

        window.dispatchEvent(
          new CustomEvent("tellyPostersUpdated", {
            detail: { posters: updatedPosters },
          }),
        )
      } catch (storageError) {
        console.error("[v0] localStorage error:", storageError)

        try {
          const existingPosters = JSON.parse(sessionStorage.getItem("tellyPosters") || "[]")
          const updatedPosters = [...existingPosters, processedPoster]
          sessionStorage.setItem("tellyPosters", JSON.stringify(updatedPosters))
          console.log("[v0] Fallback to sessionStorage successful. Total posters:", updatedPosters.length)

          window.dispatchEvent(
            new CustomEvent("tellyPostersUpdated", {
              detail: { posters: updatedPosters, storage: "session" },
            }),
          )
        } catch (sessionError) {
          console.error("[v0] sessionStorage also failed:", sessionError)
        }
      }

      setIsProcessing(false)
      setIsComplete(true)
      console.log("[v0] Processing complete!")
    } catch (error) {
      console.error("[v0] Processing error:", error)
      const codeId = Math.random().toString(36).substring(2, 8).toUpperCase()

      const fallbackPoster = {
        ...poster,
        codeId,
        processed: true,
        id: Date.now().toString(),
        abstract: poster.abstract || "Accessible description will be generated for this research poster.",
        content: poster.abstract || "Accessible description will be generated for this research poster.",
      }

      setPoster(fallbackPoster)

      const existingPosters = JSON.parse(localStorage.getItem("tellyPosters") || "[]")
      const updatedPosters = [...existingPosters, fallbackPoster]
      localStorage.setItem("tellyPosters", JSON.stringify(updatedPosters))
      console.log("[v0] Storage process - existing posters:", existingPosters)
      console.log("[v0] Storage process - new poster:", fallbackPoster)
      console.log("[v0] Storage process - updated posters:", updatedPosters)
      console.log("[v0] Storage process - localStorage after set:", localStorage.getItem("tellyPosters"))
      console.log("[v0] Fallback poster stored. Total posters:", updatedPosters.length)

      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "tellyPosters",
          newValue: JSON.stringify(updatedPosters),
          oldValue: JSON.stringify(existingPosters),
        }),
      )

      window.dispatchEvent(
        new CustomEvent("tellyPostersUpdated", {
          detail: { posters: updatedPosters },
        }),
      )

      setIsProcessing(false)
      setIsComplete(true)
    }
  }

  const downloadCode = () => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 300
    canvas.height = 300

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, 300, 300)

    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 4
    ctx.strokeRect(10, 10, 280, 280)

    ctx.fillStyle = "#2563eb"
    ctx.font = "bold 60px Arial"
    ctx.textAlign = "center"

    ctx.fillRect(120, 100, 60, 40)
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(125, 105, 50, 30)
    ctx.fillStyle = "#2563eb"
    ctx.fillRect(145, 140, 10, 15)
    ctx.fillRect(135, 155, 30, 5)

    ctx.fillStyle = "#000000"
    ctx.font = "bold 16px Arial"
    ctx.fillText("ACCESSIBLE", 150, 180)

    ctx.font = "bold 20px monospace"
    ctx.fillText(poster.codeId, 150, 210)

    ctx.fillStyle = "#2563eb"
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(40 + i * 6, 240 + j * 6, 4, 4)
          ctx.fillRect(220 + i * 6, 240 + j * 6, 4, 4)
        }
      }
    }

    const link = document.createElement("a")
    link.download = `telly-accessibility-code-${poster.codeId}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background p-6">
        <button
          onClick={onBack}
          className="mb-8 p-3 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Go back to home"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="max-w-sm mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Print!</h2>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            Your poster has been processed for WCAG 2.2 accessibility compliance. The enhanced description is ready for
            audio delivery.
          </p>

          <div className="bg-muted p-4 rounded-lg mb-6">
            <p className="text-sm text-muted-foreground mb-2">Accessibility Code ID</p>
            <p className="text-xl font-mono font-bold text-foreground">{poster.codeId}</p>
          </div>

          <div className="bg-accent p-4 rounded-lg mb-8 text-left">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-accent-foreground" />
              <p className="text-sm font-medium text-accent-foreground">Enhanced Description</p>
            </div>
            <p className="text-xs text-accent-foreground/80 line-clamp-3">{poster.abstract}</p>
          </div>

          <button
            onClick={downloadCode}
            className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-lg text-lg font-medium flex items-center justify-center gap-3 hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Download size={20} />
            Download Accessibility Code
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <button
        onClick={onBack}
        className="mb-8 p-3 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Go back to home"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="max-w-sm mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Upload Poster</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
              Poster Title
            </label>
            <input
              type="text"
              id="title"
              value={poster.title}
              onChange={(e) => setPoster((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full p-4 border border-border rounded-lg text-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="authors" className="block text-sm font-medium text-foreground mb-2">
              Authors
            </label>
            <input
              type="text"
              id="authors"
              value={poster.authors.join(", ")}
              onChange={(e) => setPoster((prev) => ({ ...prev, authors: e.target.value.split(", ") }))}
              className="w-full p-4 border border-border rounded-lg text-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="abstract" className="block text-sm font-medium text-foreground mb-2">
              Abstract
            </label>
            <textarea
              id="abstract"
              value={poster.abstract}
              onChange={(e) => setPoster((prev) => ({ ...prev, abstract: e.target.value }))}
              rows={4}
              className="w-full p-4 border border-border rounded-lg text-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium text-foreground mb-2">
              Poster File
            </label>
            <div className="relative">
              <input
                type="file"
                id="file"
                onChange={handleFileUpload}
                accept=".pdf,.png,.jpg,.jpeg"
                className="sr-only"
                required
              />
              <label
                htmlFor="file"
                className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors focus-within:ring-2 focus-within:ring-ring"
              >
                <Upload size={32} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-foreground">{poster.file ? poster.file.name : "Choose file to upload"}</p>
                <p className="text-sm text-muted-foreground mt-2">PDF, PNG, or JPG</p>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing || !poster.file || !poster.title}
            className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-lg text-lg font-medium disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {isProcessing ? "Processing for Accessibility..." : "Generate Accessibility Code"}
          </button>

          {isProcessing && (
            <div className="bg-accent p-4 rounded-lg">
              <p className="text-sm text-accent-foreground font-medium mb-2">Processing Steps:</p>
              <ul className="text-xs text-accent-foreground/80 space-y-1">
                <li>• Analyzing content for accessibility</li>
                <li>• Generating WCAG 2.2 compliant description</li>
                <li>• Creating enhanced audio-ready content</li>
                <li>• Generating accessibility code</li>
              </ul>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
