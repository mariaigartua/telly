"use client"

import { Upload, Camera, FileText } from "lucide-react"

interface HomePageProps {
  onNavigate: (page: "upload" | "scanner" | "content") => void
}

export const HomePage = ({ onNavigate }: HomePageProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Logo/Title */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-foreground mb-3">
          tel<span className="text-primary">ly</span>
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-sm">
          Autonomous access for academic spaces
        </p>
      </div>

      {/* Main Buttons */}
      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={() => onNavigate("upload")}
          className="w-full bg-primary text-primary-foreground py-5 px-6 rounded-lg text-lg font-medium flex items-center justify-center gap-3 hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Upload poster for accessibility"
        >
          <Upload size={24} />
          Upload
        </button>

        <button
          onClick={() => onNavigate("scanner")}
          className="w-full bg-secondary text-secondary-foreground py-5 px-6 rounded-lg text-lg font-medium flex items-center justify-center gap-3 hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Start scanning posters"
        >
          <Camera size={24} />
          Start
        </button>

        <button
          onClick={() => onNavigate("content")}
          className="w-full bg-accent text-accent-foreground py-5 px-6 rounded-lg text-lg font-medium flex items-center justify-center gap-3 hover:bg-accent/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="View parsed poster content"
        >
          <FileText size={24} />
          View Content
        </button>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">Making academic spaces accessible for everyone</p>
      </div>
    </div>
  )
}
