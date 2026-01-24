'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center relative">
        {/* Floating Warning Icon */}
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-24 h-24 bg-gradient-to-r from-red-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <div className="text-white text-4xl">⚠️</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/20">
          {/* Error Animation */}
          <div className="mb-8 relative">
            <div className="flex justify-center items-center space-x-4 mb-6">
              {/* Broken Pieces */}
              <div className="animate-pulse">
                <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                  <span className="text-xs">🔧</span>
                </div>
              </div>
              {/* Tools */}
              <div className="animate-pulse" style={{ animationDelay: '0.2s' }}>
                <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                  <span className="text-xs">🛠️</span>
                </div>
              </div>
              {/* Fix */}
              <div className="animate-pulse" style={{ animationDelay: '0.4s' }}>
                <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">
                  <span className="text-xs">🔨</span>
                </div>
              </div>
              {/* Success */}
              <div className="animate-pulse" style={{ animationDelay: '0.6s' }}>
                <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                  <span className="text-xs">✅</span>
                </div>
              </div>
            </div>

            {/* Fixing Animation */}
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-gradient-to-b from-gray-200 to-gray-300 rounded-full border-4 border-gray-400"></div>
              <div className="absolute inset-2 bg-gradient-to-b from-red-100 to-red-200 rounded-full animate-pulse"></div>
              <div className="absolute inset-4 bg-gradient-to-b from-orange-100 to-orange-200 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
              <div className="absolute inset-6 bg-gradient-to-b from-yellow-100 to-yellow-200 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Text Content */}
          <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent mb-4">
            Oops! Something Broke
          </h1>
          
          <p className="text-xl text-gray-600 mb-6 leading-relaxed">
            Our developers are working hard to fix this issue! 
            <br />
            <span className="text-sm text-gray-500">(Don't worry, it's not your fault)</span>
          </p>

          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200 text-left">
              <p className="text-sm font-mono text-red-700 break-all">
                <strong>Error:</strong> {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">
                  <strong>Digest:</strong> {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-red-400 to-orange-500 h-3 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-semibold hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              🔄 Try Again
            </button>
            
            <Link 
              href="/"
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-semibold hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              🏠 Go Home
            </Link>
          </div>

          {/* Helpful Information */}
          <div className="mt-8 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-100">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-red-600">Need Help?</span> If this problem persists, 
              please contact our support team. We're here to help! 🛟
            </p>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-10 left-10 animate-float">
          <div className="w-4 h-4 bg-red-300 rounded-full opacity-60"></div>
        </div>
        <div className="absolute top-20 right-20 animate-float" style={{ animationDelay: '1s' }}>
          <div className="w-3 h-3 bg-orange-300 rounded-full opacity-60"></div>
        </div>
        <div className="absolute bottom-20 left-20 animate-float" style={{ animationDelay: '2s' }}>
          <div className="w-5 h-5 bg-yellow-300 rounded-full opacity-60"></div>
        </div>
        <div className="absolute bottom-10 right-10 animate-float" style={{ animationDelay: '3s' }}>
          <div className="w-4 h-4 bg-red-400 rounded-full opacity-60"></div>
        </div>
      </div>


    </div>
  );
}