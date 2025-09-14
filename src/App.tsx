"use client"

import { useState } from "react"
import { HomePage } from "./components/HomePage"
import { UploadPage } from "./components/UploadPage"
import { ScannerPage } from "./components/ScannerPage"
import { ContentViewer } from "./components/ContentViewer"

type Page = "home" | "upload" | "scanner" | "content"

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home")

  const navigateToPage = (page: Page) => {
    setCurrentPage(page)
  }

  const goHome = () => {
    setCurrentPage("home")
  }

  return (
    <div className="App">
      {currentPage === "home" && <HomePage onNavigate={navigateToPage} />}
      {currentPage === "upload" && <UploadPage onBack={goHome} />}
      {currentPage === "scanner" && <ScannerPage onBack={goHome} />}
      {currentPage === "content" && <ContentViewer onBack={goHome} />}
    </div>
  )
}

export default App
