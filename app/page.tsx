'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Menu, X } from 'lucide-react'

export default function LandingPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
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

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
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
            <nav className="hidden md:flex space-x-4">
              <Link href="#features" className="text-white hover:text-gray-200">Features</Link>
              <Link href="#pricing" className="text-white hover:text-gray-200">Pricing</Link>
              <Link href="#contact" className="text-white hover:text-gray-200">Contact</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="text-white hover:text-gray-200 transition duration-200"
              >
                {isDarkMode ? 'Light' : 'Dark'}
              </button>
              <Link
                href="/signin"
                className="bg-white text-purple-700 px-4 py-2 rounded-md hover:bg-opacity-90 transition duration-200"
              >
                Sign In
              </Link>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-white"
              >
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </header>

        {isMenuOpen && (
          <div className="md:hidden bg-white bg-opacity-10 backdrop-blur-md dark:bg-gray-800 dark:bg-opacity-30">
            <nav className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              <Link href="#features" className="text-white hover:text-gray-200">Features</Link>
              <Link href="#pricing" className="text-white hover:text-gray-200">Pricing</Link>
              <Link href="#contact" className="text-white hover:text-gray-200">Contact</Link>
            </nav>
          </div>
        )}

        <main className="container mx-auto px-4 py-12">
          <section className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Transform Your Images with AI</h1>
            <p className="text-xl md:text-2xl mb-8">Extract text, convert to Excel, and more with our powerful image processing tools.</p>
            <Link
              href="/signup"
              className="bg-white text-purple-700 px-8 py-3 rounded-md text-lg font-semibold hover:bg-opacity-90 transition duration-200 inline-flex items-center"
            >
              Get Started <ArrowRight className="ml-2" />
            </Link>
          </section>

          <section id="features" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white bg-opacity-10 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Text Extraction</h3>
                <p>Extract text from images with high accuracy using advanced OCR technology.</p>
              </div>
              <div className="bg-white bg-opacity-10 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Excel Conversion</h3>
                <p>Convert image data into structured Excel spreadsheets for easy analysis.</p>
              </div>
              <div className="bg-white bg-opacity-10 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Image Search</h3>
                <p>Find similar images or search for specific content within your image library.</p>
              </div>
            </div>
          </section>

          <section id="pricing" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white bg-opacity-10 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Basic</h3>
                <p className="text-3xl font-bold mb-4">$3.99<span className="text-sm font-normal">/month</span></p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center"><Check className="mr-2" /> 100 image conversions</li>
                  <li className="flex items-center"><Check className="mr-2" /> Text extraction</li>
                  <li className="flex items-center"><Check className="mr-2" /> Excel conversion</li>
                </ul>
                <Link
                  href="/signup"
                  className="block text-center bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition duration-200"
                >
                  Choose Plan
                </Link>
              </div>
              <div className="bg-white bg-opacity-10 p-6 rounded-lg border-2 border-purple-500">
                <h3 className="text-xl font-semibold mb-4">Pro</h3>
                <p className="text-3xl font-bold mb-4">$9.99<span className="text-sm font-normal">/month</span></p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center"><Check className="mr-2" /> 500 image conversions</li>
                  <li className="flex items-center"><Check className="mr-2" /> Text extraction</li>
                  <li className="flex items-center"><Check className="mr-2" /> Excel conversion</li>
                  <li className="flex items-center"><Check className="mr-2" /> Image search</li>
                </ul>
                <Link
                  href="/signup"
                  className="block text-center bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition duration-200"
                >
                  Choose Plan
                </Link>
              </div>
              <div className="bg-white bg-opacity-10 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Enterprise</h3>
                <p className="text-3xl font-bold mb-4">Custom</p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center"><Check className="mr-2" /> Unlimited conversions</li>
                  <li className="flex items-center"><Check className="mr-2" /> All features included</li>
                  <li className="flex items-center"><Check className="mr-2" /> Dedicated support</li>
                  <li className="flex items-center"><Check className="mr-2" /> Custom integrations</li>
                </ul>
                <Link
                  href="/contact"
                  className="block text-center bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition duration-200"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </section>

          <section id="contact" className="text-center">
            <h2 className="text-3xl font-bold mb-8">Get in Touch</h2>
            <p className="text-xl mb-8">Have questions? We're here to help!</p>
            <Link
              href="/contact"
              className="bg-white text-purple-700 px-8 py-3 rounded-md text-lg font-semibold hover:bg-opacity-90 transition duration-200 inline-flex items-center"
            >
              Contact Us <ArrowRight className="ml-2" />
            </Link>
          </section>
        </main>

        <footer className="bg-white bg-opacity-10 backdrop-blur-md dark:bg-gray-800 dark:bg-opacity-30 mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm">&copy; 2023 ImageAI. All rights reserved.</p>
              <nav className="flex space-x-4 mt-4 md:mt-0">
                <Link href="/privacy" className="text-sm text-white hover:text-gray-200">Privacy Policy</Link>
                <Link href="/terms" className="text-sm text-white hover:text-gray-200">Terms of Service</Link>
              </nav>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}