export interface Poster {
  id: string
  title: string
  authors: string[]
  abstract: string
  file: File | null
  codeId: string
  processed: boolean
  content: string
}

export interface SpeechRecognitionResult {
  transcript: string
  confidence: number
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}
