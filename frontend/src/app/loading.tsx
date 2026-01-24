export default function Loading({ message = "Preparing something amazing for you!" }) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center relative">
          {/* Floating Loading Icon */}
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <div className="text-white text-3xl">⏳</div>
            </div>
          </div>
  
          {/* Main Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border border-white/20">
            {/* Loading Animation */}
            <div className="mb-8 relative">
              <div className="flex justify-center items-center space-x-3 mb-6">
                {/* Loading Dots */}
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
              </div>
  
              {/* Spinning Circle */}
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-gray-100 rounded-full"></div>
                <div className="absolute inset-2 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
            </div>
  
            {/* Text Content */}
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
              Loading...
            </h2>
            
            <p className="text-lg text-gray-600 mb-6">
              {message? message : "Preparing something amazing for you!"} 
              <br />
              <span className="text-sm text-gray-500">Please wait a moment</span>
            </p>
  
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 h-2 rounded-full animate-pulse" style={{ width: '85%' }}></div>
            </div>
  
            {/* Loading Tips */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-blue-600">Tip:</span> While you wait, 
                why not take a deep breath? 🧘‍♀️
              </p>
            </div>
          </div>
  
          {/* Floating Elements */}
          <div className="absolute top-8 left-8 animate-float-small">
            <div className="w-3 h-3 bg-blue-300 rounded-full opacity-60"></div>
          </div>
          <div className="absolute top-16 right-16 animate-float-small" style={{ animationDelay: '1s' }}>
            <div className="w-2 h-2 bg-purple-300 rounded-full opacity-60"></div>
          </div>
          <div className="absolute bottom-16 left-16 animate-float-small" style={{ animationDelay: '2s' }}>
            <div className="w-4 h-4 bg-pink-300 rounded-full opacity-60"></div>
          </div>
          <div className="absolute bottom-8 right-8 animate-float-small" style={{ animationDelay: '3s' }}>
            <div className="w-3 h-3 bg-indigo-300 rounded-full opacity-60"></div>
          </div>
        </div>
  
  
      </div>
    );
  }