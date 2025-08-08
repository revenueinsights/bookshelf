'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Sparkles, ArrowRight, Star, Zap, Users, TrendingUp, Book, Library, Globe } from 'lucide-react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse opacity-30 blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse opacity-30 blur-xl" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-r from-pink-400 to-yellow-400 rounded-full animate-pulse opacity-30 blur-xl" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 right-1/3 w-28 h-28 bg-gradient-to-r from-yellow-400 to-green-400 rounded-full animate-pulse opacity-30 blur-xl" style={{animationDelay: '0.5s'}}></div>
        
        {/* Floating Books */}
        <div className="absolute top-1/4 left-1/6 animate-bounce" style={{animationDelay: '0.3s'}}>
          <Book className="h-8 w-8 text-blue-500 opacity-60" />
        </div>
        <div className="absolute top-1/3 right-1/4 animate-bounce" style={{animationDelay: '0.7s'}}>
          <BookOpen className="h-6 w-6 text-purple-500 opacity-60" />
        </div>
        <div className="absolute bottom-1/3 left-1/3 animate-bounce" style={{animationDelay: '1.1s'}}>
          <Library className="h-7 w-7 text-pink-500 opacity-60" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <BookOpen className="h-10 w-10 text-blue-600 animate-pulse" />
            <Sparkles className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-purple-500 rounded-full animate-ping"></div>
          </div>
          <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            BookShelf
          </span>
        </div>
        <div className="flex space-x-6">
          <Link href="/signup" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="text-center">
          {/* Animated Book Shelf */}
          <div className="mb-16 relative">
            <div className="flex justify-center items-end space-x-3 mb-8">
              {/* Books on shelf with enhanced animations */}
              <div className="w-20 h-32 bg-gradient-to-b from-blue-400 to-blue-600 rounded-t-lg animate-bounce shadow-lg transform hover:scale-110 transition-transform duration-300" style={{animationDelay: '0s'}}></div>
              <div className="w-20 h-28 bg-gradient-to-b from-purple-400 to-purple-600 rounded-t-lg animate-bounce shadow-lg transform hover:scale-110 transition-transform duration-300" style={{animationDelay: '0.2s'}}></div>
              <div className="w-20 h-36 bg-gradient-to-b from-pink-400 to-pink-600 rounded-t-lg animate-bounce shadow-lg transform hover:scale-110 transition-transform duration-300" style={{animationDelay: '0.4s'}}></div>
              <div className="w-20 h-30 bg-gradient-to-b from-green-400 to-green-600 rounded-t-lg animate-bounce shadow-lg transform hover:scale-110 transition-transform duration-300" style={{animationDelay: '0.6s'}}></div>
              <div className="w-20 h-34 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-t-lg animate-bounce shadow-lg transform hover:scale-110 transition-transform duration-300" style={{animationDelay: '0.8s'}}></div>
              <div className="w-20 h-26 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-t-lg animate-bounce shadow-lg transform hover:scale-110 transition-transform duration-300" style={{animationDelay: '1s'}}></div>
            </div>
            {/* Enhanced Shelf */}
            <div className="w-[500px] h-6 bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 rounded-xl mx-auto shadow-2xl border border-gray-300"></div>
          </div>

          {/* Main Heading with enhanced styling */}
          <h1 className="text-7xl md:text-8xl font-black mb-8">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
              BookShelf
            </span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-700 mb-12 max-w-4xl mx-auto leading-relaxed">
            The ultimate <span className="font-bold text-blue-600">book inventory management</span> platform for 
            <span className="font-bold text-purple-600"> collectors</span>, 
            <span className="font-bold text-pink-600"> sellers</span>, and 
            <span className="font-bold text-green-600"> enthusiasts</span>
          </p>

          {/* Enhanced Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/30 transform hover:scale-105 transition-all duration-500 hover:shadow-3xl">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-xl w-fit mx-auto mb-6">
                <Zap className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Smart Pricing</h3>
              <p className="text-gray-600 text-lg">Real-time price tracking and market analysis with AI insights</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/30 transform hover:scale-105 transition-all duration-500 hover:shadow-3xl">
              <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-4 rounded-xl w-fit mx-auto mb-6">
                <BookOpen className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Inventory Management</h3>
              <p className="text-gray-600 text-lg">Organize and track your book collection with smart categorization</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/30 transform hover:scale-105 transition-all duration-500 hover:shadow-3xl">
              <div className="bg-gradient-to-r from-green-400 to-teal-500 p-4 rounded-xl w-fit mx-auto mb-6">
                <TrendingUp className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Advanced Analytics</h3>
              <p className="text-gray-600 text-lg">Detailed insights and performance metrics for your collection</p>
            </div>
          </div>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link 
              href="/signup" 
              className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-xl font-bold rounded-2xl hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-3xl"
            >
              Get Started Free
              <ArrowRight className="ml-3 h-6 w-6 animate-pulse" />
            </Link>
            <Link 
              href="/signin" 
              className="inline-flex items-center px-10 py-5 bg-white/90 backdrop-blur-xl text-gray-800 text-xl font-bold rounded-2xl hover:bg-white transition-all duration-300 transform hover:scale-110 shadow-2xl border-2 border-white/30"
            >
              Sign In
            </Link>
          </div>

          {/* Enhanced Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-12 text-gray-600">
            <div className="flex items-center bg-white/60 backdrop-blur-md px-4 py-2 rounded-full">
              <Star className="h-6 w-6 text-yellow-400 mr-3 animate-pulse" />
              <span className="font-semibold">Trusted by 1000+ users</span>
            </div>
            <div className="flex items-center bg-white/60 backdrop-blur-md px-4 py-2 rounded-full">
              <Users className="h-6 w-6 text-blue-400 mr-3 animate-pulse" />
              <span className="font-semibold">Free forever plan</span>
            </div>
            <div className="flex items-center bg-white/60 backdrop-blur-md px-4 py-2 rounded-full">
              <Sparkles className="h-6 w-6 text-purple-400 mr-3 animate-pulse" />
              <span className="font-semibold">AI-powered insights</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}