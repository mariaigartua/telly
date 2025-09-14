"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, FileText, Users, Hash, Calendar } from "lucide-react"

interface ContentViewerProps {
  onBack: () => void
}

const getStoredPosters = () => {
  if (typeof window !== "undefined") {
    console.log("[v0] ContentViewer - Getting stored posters")

    // Try localStorage first
    let stored = localStorage.getItem("tellyPosters")
    if (!stored) {
      console.log("[v0] ContentViewer - localStorage empty, trying sessionStorage")
      stored = sessionStorage.getItem("tellyPosters")
    }

    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        console.log("[v0] ContentViewer - Found posters:", parsed.length)
        return parsed
      } catch (error) {
        console.error("[v0] ContentViewer - Error parsing stored data:", error)
        return []
      }
    }

    console.log("[v0] ContentViewer - No posters found in storage")
    return []
  }
  return []
}

export const ContentViewer = ({ onBack }: ContentViewerProps) => {
  const [posters, setPosters] = useState(getStoredPosters())
  const [selectedPoster, setSelectedPoster] = useState<any>(null)

  useEffect(() => {
    const refreshPosters = () => {
      const updated = getStoredPosters()
      setPosters(updated)
      console.log("[v0] ContentViewer - Refreshed posters:", updated.length)
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "tellyPosters") {
        refreshPosters()
      }
    }

    const handleFocus = () => {
      refreshPosters()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("focus", handleFocus)

    // Initial refresh
    refreshPosters()

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [])

  if (selectedPoster) {
    return (
      <div className="min-h-screen bg-white p-6">
        <button
          onClick={() => setSelectedPoster(null)}
          className="mb-8 p-3 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Go back to poster list"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedPoster.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>{selectedPoster.authors?.join(", ") || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Hash size={16} />
                    <span>{selectedPoster.codeId}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>{new Date(Number.parseInt(selectedPoster.id)).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Enhanced Abstract (Used for Voice Queries)</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {selectedPoster.abstract || "No abstract available"}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Full Content (Used for Detailed Queries)</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {selectedPoster.content || selectedPoster.abstract || "No content available"}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Processing Status</h3>
                  <p className="text-sm text-gray-600">
                    {selectedPoster.processed ? "✅ Processed for accessibility" : "❌ Not processed"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">File Information</h3>
                  <p className="text-sm text-gray-600">
                    {selectedPoster.file ? `File uploaded: ${selectedPoster.file.name}` : "No file attached"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Accessibility Code</h3>
                  <p className="text-sm font-mono text-gray-900 bg-white px-2 py-1 rounded border">
                    {selectedPoster.codeId}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Created</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(Number.parseInt(selectedPoster.id)).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
              <h2 className="text-lg font-semibold text-green-900 mb-4">Voice Interaction Ready</h2>
              <div className="space-y-2">
                <p className="text-sm text-green-800">
                  This poster is ready for natural language queries when scanned.
                </p>
                <p className="text-sm text-green-700">
                  Use the scanner to point your camera at the accessibility code and ask questions about the research.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <button
        onClick={onBack}
        className="mb-8 p-3 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Go back to home"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Parsed Poster Content</h1>

        {posters.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Posters Available</h2>
            <p className="text-gray-600">Upload some posters first to see their parsed content here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6">
              <p className="text-blue-800 text-sm">
                <strong>{posters.length}</strong> poster{posters.length === 1 ? "" : "s"} processed and ready for voice
                queries
              </p>
            </div>

            {posters.map((poster: any) => (
              <div
                key={poster.id}
                className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedPoster(poster)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{poster.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Users size={16} />
                        <span>{poster.authors?.join(", ") || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Hash size={16} />
                        <span>{poster.codeId}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 line-clamp-3 leading-relaxed">
                      {poster.abstract || "No abstract available"}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${poster.processed ? "bg-green-500" : "bg-gray-300"}`} />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Content Length: {(poster.content || poster.abstract || "").length} characters</span>
                    <span>Created: {new Date(Number.parseInt(poster.id)).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
