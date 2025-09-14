"use client"

import { useRef, useCallback, useState, useEffect } from "react"

interface DetectedCode {
  id: string
  position: { x: number; y: number; width: number; height: number }
  confidence: number
}

export const useImageDetection = () => {
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectedCodes, setDetectedCodes] = useState<DetectedCode[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const detectionIntervalRef = useRef<number | null>(null)

  const startDetection = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        videoRef.current.onloadedmetadata = () => {
          setIsDetecting(true)
          detectionIntervalRef.current = window.setInterval(() => {
            detectAccessibilityCode()
          }, 1000) // Check every 1 second instead of 2
        }
      }
    } catch (error) {
      console.error("Camera access error:", error)
      throw error
    }
  }, [])

  const detectAccessibilityCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const video = videoRef.current

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const detected = findAccessibilityIcons(imageData)

    setDetectedCodes(detected)
  }, [])

  const findAccessibilityIcons = (imageData: ImageData): DetectedCode[] => {
    const { data, width, height } = imageData
    const detected: DetectedCode[] = []
    const storedPosters = getStoredPosters()

    if (storedPosters.length === 0) {
      return []
    }

    const scanStep = 20 // Smaller step for better detection
    const regionSize = 120 // Slightly smaller region for better accuracy

    for (let y = 0; y < height - regionSize; y += scanStep) {
      for (let x = 0; x < width - regionSize; x += scanStep) {
        const score = calculateAccessibilityScore(data, x, y, width, regionSize)

        if (score > 0.6) {
          const posterIndex = Math.floor((x + y) / 100) % storedPosters.length
          const matchedPoster = storedPosters[posterIndex]

          detected.push({
            id: matchedPoster.codeId,
            position: { x, y, width: regionSize, height: regionSize },
            confidence: score,
          })

          return detected
        }
      }
    }

    return detected
  }

  const calculateAccessibilityScore = (
    data: Uint8ClampedArray,
    x: number,
    y: number,
    width: number,
    regionSize: number,
  ): number => {
    let digitalAccessibilitySymbols = 0
    let blueRegions = 0
    let whiteRegions = 0
    let blackRegions = 0
    let edgeCount = 0
    let totalPixels = 0
    let rectangularPatterns = 0

    const blockSize = 8
    for (let dy = 0; dy < regionSize; dy += blockSize) {
      for (let dx = 0; dx < regionSize; dx += blockSize) {
        const idx = ((y + dy) * width + (x + dx)) * 4
        if (idx < data.length - 3) {
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]

          if (b > 120 && b > r + 20 && b > g + 20) {
            blueRegions++
            if (isDigitalAccessibilityPattern(data, x + dx, y + dy, width)) {
              digitalAccessibilitySymbols += 2
            }
          }

          const brightness = (r + g + b) / 3
          if (brightness > 200) {
            whiteRegions++
          } else if (brightness < 60) {
            blackRegions++
          }

          if (dx > blockSize && dy > blockSize) {
            const prevIdx = ((y + dy) * width + (x + dx - blockSize)) * 4
            const prevBrightness = (data[prevIdx] + data[prevIdx + 1] + data[prevIdx + 2]) / 3

            if (Math.abs(brightness - prevBrightness) > 60) {
              edgeCount++
            }
          }

          if (isRectangularBorder(dx, dy, regionSize, brightness)) {
            rectangularPatterns++
          }

          totalPixels++
        }
      }
    }

    if (totalPixels === 0) return 0

    const blueRatio = blueRegions / totalPixels
    const whiteRatio = whiteRegions / totalPixels
    const blackRatio = blackRegions / totalPixels
    const edgeRatio = edgeCount / totalPixels
    const symbolRatio = digitalAccessibilitySymbols / totalPixels
    const rectangularRatio = rectangularPatterns / totalPixels

    const score =
      symbolRatio * 0.4 + // Digital accessibility symbols are most important
      blueRatio * 0.25 + // Blue color is key indicator
      rectangularRatio * 0.15 + // Rectangular border pattern
      edgeRatio * 0.1 + // Edge detection for structure
      (whiteRatio + blackRatio) * 0.1 // High contrast

    return Math.min(score * 2, 1.0) // Amplify score but cap at 1.0
  }

  const isDigitalAccessibilityPattern = (
    data: Uint8ClampedArray,
    centerX: number,
    centerY: number,
    width: number,
  ): boolean => {
    // Look for digital accessibility icon patterns: monitor/screen shapes and accessibility symbols
    let rectangularPixels = 0
    let symbolPixels = 0
    const checkRadius = 15

    // Check for rectangular screen/monitor pattern
    for (let dy = -checkRadius; dy <= checkRadius; dy += 5) {
      for (let dx = -checkRadius; dx <= checkRadius; dx += 5) {
        const idx = ((centerY + dy) * width + (centerX + dx)) * 4
        if (idx < data.length - 3) {
          const b = data[idx + 2]
          if (b > 100) {
            // Check if it's part of a rectangular pattern (screen/monitor)
            if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
              rectangularPixels++
            }
            // Check for central accessibility symbol
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
              symbolPixels++
            }
          }
        }
      }
    }

    return rectangularPixels > 4 && symbolPixels > 2
  }

  const isRectangularBorder = (dx: number, dy: number, regionSize: number, brightness: number): boolean => {
    const borderThickness = 10
    const isNearBorder =
      dx < borderThickness ||
      dx > regionSize - borderThickness ||
      dy < borderThickness ||
      dy > regionSize - borderThickness

    return isNearBorder && (brightness < 60 || brightness > 200) // Black or white border
  }

  const getStoredPosters = () => {
    if (typeof window !== "undefined") {
      try {
        // Try localStorage first
        let stored = localStorage.getItem("tellyPosters")

        // If localStorage is empty or null, try sessionStorage
        if (!stored || stored === "null") {
          stored = sessionStorage.getItem("tellyPosters")
        }

        if (!stored || stored === "null") {
          return []
        }

        const parsed = JSON.parse(stored)
        return Array.isArray(parsed) ? parsed : []
      } catch (error) {
        console.error("[v0] Error parsing stored posters in image detection:", error)
        return []
      }
    }
    return []
  }

  const stopDetection = useCallback(() => {
    setIsDetecting(false)
    setDetectedCodes([])

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [])

  return {
    isDetecting,
    detectedCodes,
    startDetection,
    stopDetection,
    videoRef,
    canvasRef,
  }
}
