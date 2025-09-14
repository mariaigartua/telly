// App.jsx (Main Component)
import React, { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import UploadStep from "./components/UploadStep";
import ProcessingStep from "./components/ProcessingStep";
import ActivationStep from "./components/ActivationStep";
import DetectionStep from "./components/DetectionStep";
import { extractAuthors, extractAbstract, checkAccessibility } from "./utils/textProcessing";
import "./styles/App.css";

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'upload', 'scanner', 'code'
  const [posterData, setPosterData] = useState({
    title: "",
    authors: "",
    abstract: "",
    content: "",
    accessibilityFeatures: []
  });
  const [codiconData, setCodiconData] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedPoster, setDetectedPoster] = useState(null);
  const fileInputRef = useRef(null);

  // Process uploaded file
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setError("");
    
    try {
      // Simulate OCR Processing (in a real app, this would use Tesseract.js)
      for (let i = 0; i <= 100; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setProcessingProgress(i);
      }
      
      // Simulate extracted text
      const extractedText = `Research Poster Title
      
      Authors: Jane Smith, John Doe, University of Science
      
      ABSTRACT
      This study examines the impact of digital accessibility on research dissemination. 
      We implemented a novel system for making academic posters more accessible through 
      the use of specialized codicons that contain both content and accessibility metadata.
      
      Our results show a 65% improvement in accessibility for vision-impaired researchers
      and a 40% increase in engagement across all demographics. This approach has
      significant implications for making academic conferences more inclusive.
      
      Keywords: accessibility, research posters, digital inclusion, assistive technology`;
      
      // Extract structured information
      const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
      const title = lines[0] || "Untitled Research Poster";
      const authors = extractAuthors(lines);
      const abstract = extractAbstract(lines, extractedText);
      
      // Check accessibility features
      const accessibilityFeatures = checkAccessibility(extractedText);
      
      setPosterData({
        title,
        authors,
        abstract,
        content: extractedText,
        accessibilityFeatures
      });
      
      // Generate codicon data (combination of metadata and content)
      const codiconPayload = JSON.stringify({
        t: title,
        a: authors,
        ab: abstract.substring(0, 200) + (abstract.length > 200 ? "..." : ""),
        f: accessibilityFeatures
      });
      
      setCodiconData(codiconPayload);
      setActiveStep(4); // Move to activation step
      setSuccess("Poster processed successfully! Review information below.");
      
    } catch (err) {
      setError(err.message || "Failed to process the poster. Please try again.");
      console.error("Processing error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Activate the codicon
  const activateCodicon = () => {
    // In a real application, this would save to a database
    // For this demo, we'll store in localStorage
    const posterId = Date.now().toString();
    const posterRecord = {
      id: posterId,
      ...posterData,
      timestamp: new Date().toISOString()
    };
    
    // Save to localStorage
    const existingPosters = JSON.parse(localStorage.getItem('accessibilityPosters') || '[]');
    existingPosters.push(posterRecord);
    localStorage.setItem('accessibilityPosters', JSON.stringify(existingPosters));
    
    setSuccess(`Codicon activated successfully with ID: ${posterId}`);
    setActiveStep(5);
  };

  // Start camera for detection
  const startCamera = () => {
    setCameraActive(true);
    // In a real implementation, this would initialize camera and codicon detection
    setTimeout(() => {
      // Simulate detection after a delay
      setDetectedPoster({
        title: posterData.title,
        authors: posterData.authors,
        abstract: posterData.abstract,
        accessibilityFeatures: posterData.accessibilityFeatures
      });
    }, 2000);
  };

  // Reset the process
  const resetProcess = () => {
    setActiveStep(1);
    setPosterData({
      title: "",
      authors: "",
      abstract: "",
      content: "",
      accessibilityFeatures: []
    });
    setCodiconData("");
    setDetectedPoster(null);
    setCameraActive(false);
    setError("");
    setSuccess("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Landing page component
  const LandingPage = () => {
    const handleUploadClick = () => {
      setCurrentView('upload');
    };

    const handleStartClick = () => {
      setCurrentView('scanner');
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm mx-auto">
          {/* Logo/Title */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Telly</h1>
            <p className="text-slate-600 text-sm">Autonomous Access for Academic Spaces</p>
          </div>

          {/* Main Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleUploadClick}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-2xl font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
              aria-label="Upload poster and generate accessibility code"
            >
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Upload</span>
              </div>
            </button>

            <button
              onClick={handleStartClick}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-4 px-6 rounded-2xl font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-300"
              aria-label="Start scanning for accessible posters"
            >
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Start</span>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-xs text-slate-500">
            <p>Accessible academic spaces for everyone</p>
          </div>
        </div>
      </div>
    );
  };

  // Header component for other pages
  const Header = ({ title, onBack }) => {
    return (
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="px-4 py-3 flex items-center">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Go back"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-slate-800 ml-2">{title}</h1>
        </div>
      </div>
    );
  };

  const handleBack = () => {
    if (currentView === 'upload' || currentView === 'scanner') {
      setCurrentView('landing');
    } else if (currentView === 'code') {
      setCurrentView('upload');
    }
  };

  const handleUploadComplete = (poster) => {
    setPosterData(poster);
    setCurrentView('code');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage />;
      case 'upload':
        return (
          <>
            <Header title="Upload Poster" onBack={handleBack} />
            <UploadStep 
              fileInputRef={fileInputRef}
              handleFileUpload={handleFileUpload}
              onUploadComplete={handleUploadComplete}
            />
          </>
        );
      case 'scanner':
        return (
          <>
            <Header title="Scanner" onBack={handleBack} />
            <DetectionStep 
              cameraActive={cameraActive}
              detectedPoster={detectedPoster}
              startCamera={startCamera}
              resetProcess={() => setCurrentView('landing')}
            />
          </>
        );
      case 'code':
        return (
          <>
            <Header title="Accessibility Code" onBack={handleBack} />
            <ActivationStep 
              posterData={posterData}
              codiconData={codiconData}
              activateCodicon={activateCodicon}
            />
          </>
        );
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {error && (
        <div className="fixed top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">×</button>
          </div>
        </div>
      )}
      
      {success && (
        <div className="fixed top-4 left-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="text-green-500 hover:text-green-700">×</button>
          </div>
        </div>
      )}

      {isProcessing && (
        <ProcessingStep processingProgress={processingProgress} />
      )}

      {renderContent()}
    </div>
  );
}

export default App;
