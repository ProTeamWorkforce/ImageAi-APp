'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Table, Search, LogOut, Download, CreditCard, AlertCircle, Moon, Sun, X, Camera, Image as ImageIcon } from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSwipeable } from 'react-swipeable'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../../lib/firebase'
import { Auth } from '../components/Auth'
import { useRouter } from 'next/navigation'

export default function AppPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [resultType, setResultType] = useState<'text' | 'excel' | 'search' | null>(null)
  const [credits, setCredits] = useState(10)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedCredits = localStorage.getItem('userCredits')
    if (savedCredits) {
      setCredits(parseInt(savedCredits))
    } else {
      localStorage.setItem('userCredits', '10')
      setCredits(10)
    }

    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    if (isDarkMode) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
  }

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit. Please choose a smaller file.')
        return
      }

      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }, [])

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*'
      fileInputRef.current.capture = 'environment'
      fileInputRef.current.click()
    }
  }

  const handleGallerySelect = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.click()
    }
  }

  interface Label {
    description: string;
    score: number;
  }

  interface SearchResult {
    url: string;
  }

  const formatResult = (result: string, type: 'text' | 'excel' | 'search') => {
    if (type === 'text') {
      // Split the text into lines and format each line
      const lines = result.split('\n');
      return lines.map((line, index) => {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        if (value) {
          return (
            <div key={index} className="mb-2">
              <span className="font-bold">{key}:</span> {value}
            </div>
          );
        }
        return <div key={index} className="font-bold mb-2">{key}</div>;
      });
    } else if (type === 'search') {
      try {
        const data = JSON.parse(result);
        return (
          <div>
            <h3 className="font-bold mb-2">Labels:</h3>
            <ul className="list-disc list-inside mb-4">
              {data.labels.map((label: Label, index: number) => (
                <li key={index}>{label.description}: {(label.score * 100).toFixed(2)}%</li>
              ))}
            </ul>
            <h3 className="font-bold mb-2">Similar Images:</h3>
            <ul className="list-disc list-inside">
              {data.searchResults.map((result: SearchResult, index: number) => (
                <li key={index}><a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{result.url}</a></li>
              ))}
            </ul>
          </div>
        );
      } catch (error) {
        console.error('Error parsing search results:', error);
        return <div>{result}</div>;
      }
    }
    return <div>{result}</div>;
  };

  const handleSubmit = async (type: 'text' | 'excel' | 'search') => {
    if (!file) return

    setIsProcessing(true)
    setResult('Processing...')
    setResultType(type)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        let errorData;
        
        // Clone the response so we can try reading it in different formats
        const responseClone = response.clone();
        
        try {
          errorData = await response.json();
        } catch {
          // If it's not JSON, get it as text from the cloned response
          try {
            const errorText = await responseClone.text();
            errorData = { error: 'Server error', details: errorText };
          } catch {
            // If both fail, create a generic error
            errorData = { error: 'Server error', details: 'Unknown error format' };
          }
        }
        console.error('Server error:', errorData);
        throw new Error(`Conversion failed: ${errorData.error || 'Unknown error'}`);
      }

      if (type === 'excel') {
        // Handle Excel file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setResult('Excel file downloaded successfully');
      } else {
        const data = await response.json();
        console.log('Received data:', data);

        if (data.error) {
          throw new Error(data.error);
        }

        setResult(data.result || JSON.stringify(data, null, 2));
      }

      setResultType(type);
      setCredits(prevCredits => {
        const newCredits = prevCredits - 1;
        localStorage.setItem('userCredits', newCredits.toString());
        return newCredits;
      });
    } catch (error) {
      console.error('Error:', error);
      setResult('An error occurred during conversion. Please try again later.');
      toast.error('Conversion failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return

    const blob = new Blob([result], { type: resultType === 'text' ? 'text/plain' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `result.${resultType === 'text' ? 'txt' : 'xlsx'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePurchaseCredits = () => {
    toast.info('Redirecting to payment gateway...')
  }

  const sidebarHandlers = useSwipeable({
    onSwipedRight: () => setIsSidebarOpen(true),
    onSwipedLeft: () => setIsSidebarOpen(false),
    trackMouse: true
  })

  const toggleZoom = () => {
    setIsZoomed(!isZoomed)
  }

  const handleSignIn = () => {
    router.push('/dashboard');
  };

  const handleSignUp = () => {
    router.push('/dashboard');
  };

  const handleGoogleSignIn = () => {
    router.push('/dashboard');
  };

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`} {...sidebarHandlers}>
      <div className="bg-gradient-to-br from-purple-700 via-pink-500 to-red-500 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-white">
        <motion.div
          className="absolute inset-0 -z-10"
          animate={{
            background: isDarkMode
              ? [
                  'linear-gradient(to right top, #1f2937, #111827, #030712)',
                  'linear-gradient(to left top, #374151, #1f2937, #111827)',
                  'linear-gradient(to bottom right, #4b5563, #374151, #1f2937)',
                ]
              : [
                  'linear-gradient(to right top, #6d28d9, #db2777, #ef4444)',
                  'linear-gradient(to left top, #8b5cf6, #ec4899, #f43f5e)',
                  'linear-gradient(to bottom right, #6d28d9, #db2777, #ef4444)',
                ],
          }}
          transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
        />

        <header className="bg-white bg-opacity-10 backdrop-blur-md dark:bg-gray-800 dark:bg-opacity-30">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-white">ImageAI</Link>
            <nav className="flex items-center space-x-4">
              <span className="text-white hidden md:inline">Credits: {credits}</span>
              <button
                onClick={handlePurchaseCredits}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200 flex items-center"
              >
                <CreditCard className="mr-2" /> <span className="hidden md:inline">Buy Credits</span>
              </button>
              <button
                onClick={toggleTheme}
                className="text-white hover:text-gray-200 transition duration-200"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleLogout}
                className="text-white hover:text-gray-200 transition duration-200 flex items-center"
              >
                <LogOut className="w-5 h-5 mr-2" /> <span className="hidden md:inline">Logout</span>
              </button>
            </nav>
          </div>
        </header>

        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween' }}
              className="fixed inset-y-0 right-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-50"
            >
              <div className="p-4">
                <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <X className="w-6 h-6" />
                </button>
                <nav className="mt-8 space-y-4">
                  <Link href="/app" className="block text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white">Dashboard</Link>
                  <Link href="/settings" className="block text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white">Settings</Link>
                  <Link href="/help" className="block text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white">Help</Link>
                  <Link href="/" className="block text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white">Logout</Link>
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-white text-center">Image Converter Dashboard</h1>
          
          {user ? (
            <div className="bg-white bg-opacity-10 backdrop-blur-md dark:bg-gray-800 dark:bg-opacity-30 p-8 rounded-lg shadow-lg">
              <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                handleSubmit('text'); // or 'search' or 'excel', depending on your use case
              }} className="mb-8">
                <div className="mb-4">
                  <label htmlFor="file-upload" className="block text-white mb-2">Upload an image:</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      id="file-upload"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      ref={fileInputRef}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      ref={galleryInputRef}
                    />
                    <button
                      type="button"
                      onClick={handleCameraCapture}
                      className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition duration-200"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={handleGallerySelect}
                      className="bg-purple-500 text-white p-2 rounded-full hover:bg-purple-600 transition duration-200"
                    >
                      <ImageIcon className="w-6 h-6" />
                    </button>
                    <span className="text-white">Or drag and drop an image here</span>
                  </div>
                </div>
                {preview && (
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold mb-2 text-white">Image Preview:</h2>
                    <div className="relative">
                      <Image
                        src={preview}
                        alt="Uploaded image preview"
                        width={300}
                        height={300}
                        className={`rounded-lg cursor-pointer transition-transform duration-300 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                        onClick={toggleZoom}
                      />
                      {isZoomed && (
                        <button
                          onClick={toggleZoom}
                          className="absolute top-2 right-2 bg-white bg-opacity-50 p-1 rounded-full"
                        >
                          <X className="w-4 h-4 text-black" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-4 mt-4">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="bg-white text-purple-700 px-4 py-2 rounded-md hover:bg-opacity-90 transition duration-200 flex items-center disabled:opacity-50 dark:bg-gray-700 dark:text-white"
                  >
                    <FileText className="mr-2" /> Extract Text
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleSubmit('excel')}
                    className="bg-white text-purple-700 px-4 py-2 rounded-md hover:bg-opacity-90 transition duration-200 flex items-center disabled:opacity-50 dark:bg-gray-700 dark:text-white"
                  >
                    <Table className="mr-2" /> Convert to Excel
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleSubmit('search')}
                    className="bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition duration-200 flex items-center disabled:opacity-50 dark:bg-gray-600"
                  >
                    <Search className="mr-2" /> Image Search
                  </button>
                </div>
              </form>

              {credits <= 0 && (
                <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-md p-4 mb-8 dark:bg-yellow-900 dark:bg-opacity-20 dark:border-yellow-700">
                  <p className="text-white flex items-center">
                    <AlertCircle className="mr-2" /> You have no credits left. Please purchase more to continue using the service.
                  </p>
                </div>
              )}

              {result && (
                <div className="bg-white bg-opacity-20 border border-white rounded-md p-4 mb-8 dark:bg-gray-700 dark:bg-opacity-20 dark:border-gray-600">
                  <h2 className="text-xl font-semibold mb-2 text-white">Results:</h2>
                  <div className="text-white mb-4 whitespace-pre-wrap overflow-x-auto">
                    {formatResult(result, resultType as 'text' | 'excel' | 'search')}
                  </div>
                  {result !== 'Processing...' && resultType !== 'excel' && (
                    <button
                      onClick={handleDownload}
                      className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200 flex items-center"
                    >
                      <Download className="mr-2" /> Download {resultType === 'text' ? 'Text' : 'JSON'}
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white bg-opacity-20 p-6 rounded-lg dark:bg-gray-700 dark:bg-opacity-20">
                  <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                    <FileText className="mr-2" /> Text Extraction
                  </h2>
                  <p className="text-white">Extract text from your images with high accuracy.</p>
                </div>
                <div className="bg-white bg-opacity-20 p-6 rounded-lg dark:bg-gray-700 dark:bg-opacity-20">
                  <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                    <Table className="mr-2" /> Excel Conversion
                  </h2>
                  <p className="text-white">Convert image data into structured Excel spreadsheets.</p>
                </div>
              </div>
            </div>
          ) : (
            <Auth 
              onSignIn={handleSignIn}
              onSignUp={handleSignUp}
              onGoogleSignIn={handleGoogleSignIn}
              onLogout={handleLogout}
            />
          )}
        </main>

        <ToastContainer position="bottom-right" />
      </div>
    </div>
  )
}