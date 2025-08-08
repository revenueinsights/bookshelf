// app/(auth)/signin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Package, Mail, Lock, AlertCircle, Loader2, BookOpen, Sparkles, ArrowRight, Book, Library, Zap } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(error || '');
  const [mounted, setMounted] = useState(false);
  const [animateBooks, setAnimateBooks] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // Trigger book animation after component mounts
    setTimeout(() => setAnimateBooks(true), 500);
  }, []);
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      
      if (result?.error) {
        setErrorMessage(result.error);
      } else {
        router.push(callbackUrl);
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred');
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = () => {
    setIsLoading(true);
    signIn('google', { callbackUrl });
  };
  
  if (!mounted) return null;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse opacity-30 blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse opacity-30 blur-xl" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-r from-pink-400 to-yellow-400 rounded-full animate-pulse opacity-30 blur-xl" style={{animationDelay: '2s'}}></div>
        
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

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <BookOpen className="h-16 w-16 text-blue-600 animate-pulse" />
                <Sparkles className="h-8 w-8 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-purple-500 rounded-full animate-ping"></div>
              </div>
            </div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-xl text-gray-600">
              Sign in to your BookShelf account
            </p>
          </div>

          {/* Opening Book Pages Animation */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              {/* Book Stack Animation */}
              <div className="flex space-x-1">
                <div 
                  className={`w-8 h-12 bg-gradient-to-b from-red-400 to-red-600 rounded-sm shadow-lg transition-all duration-1000 ${
                    animateBooks ? 'transform rotate-12 translate-y-0' : 'transform rotate-0 translate-y-4'
                  }`}
                  style={{animationDelay: '0s'}}
                ></div>
                <div 
                  className={`w-8 h-12 bg-gradient-to-b from-orange-400 to-orange-600 rounded-sm shadow-lg transition-all duration-1000 ${
                    animateBooks ? 'transform rotate-6 translate-y-0' : 'transform rotate-0 translate-y-4'
                  }`}
                  style={{animationDelay: '0.2s'}}
                ></div>
                <div 
                  className={`w-8 h-12 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-sm shadow-lg transition-all duration-1000 ${
                    animateBooks ? 'transform rotate-0 translate-y-0' : 'transform rotate-0 translate-y-4'
                  }`}
                  style={{animationDelay: '0.4s'}}
                ></div>
              </div>
              {/* Book Base */}
              <div className="w-32 h-2 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full mt-2 mx-auto shadow-lg"></div>
            </div>
          </div>
          
          {errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}
          
          {/* Enhanced Form Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-8">
            <form className="space-y-6" onSubmit={handleSignIn}>
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    placeholder="you@example.com"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/90 text-gray-500 font-medium">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-6 border border-gray-200 rounded-xl shadow-lg text-base font-semibold text-gray-700 bg-white/90 backdrop-blur-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300"
                >
                  <svg 
                    className="h-5 w-5 mr-3"
                    viewBox="0 0 24 24" 
                    width="24" 
                    height="24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                    </g>
                  </svg>
                  Sign in with Google
                </button>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-300"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-gray-600">
            <div className="flex items-center bg-white/60 backdrop-blur-md px-4 py-2 rounded-full">
              <Zap className="h-5 w-5 text-yellow-400 mr-2 animate-pulse" />
              <span className="font-medium text-sm">Secure & Fast</span>
            </div>
            <div className="flex items-center bg-white/60 backdrop-blur-md px-4 py-2 rounded-full">
              <Sparkles className="h-5 w-5 text-purple-400 mr-2 animate-pulse" />
              <span className="font-medium text-sm">AI-Powered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}