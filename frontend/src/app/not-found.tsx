'use client';

export default function UnderConstructionPage() {
  return (
    <div className="page-content min-h-screen flex items-center justify-center w-full">
      <div className="max-w-2xl mx-auto text-center px-6">
        {/* Animated Logo */}
        <div className="mb-8 inline-block">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] rounded-3xl flex items-center justify-center animate-float shadow-lg p-4">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            {/* Decorative circles */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--accent)] rounded-full animate-float-small"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[var(--secondary)] rounded-full animate-float"></div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
          We're Building Something
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)]">
            Amazing
          </span>
        </h1>

        {/* Description */}
        <p className="text-lg text-[var(--text-secondary)] mb-8 leading-relaxed">
          This feature is currently under development. We're working hard to bring you
          an exceptional experience. Check back soon!
        </p>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary-lightest)] rounded-full mb-8">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--primary)]"></span>
          </div>
          <span className="text-sm font-medium text-[var(--primary)]">In Progress</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-medium hover:bg-[var(--primary-dark)] transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Go Back
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-white text-[var(--text-primary)] rounded-xl font-medium hover:bg-[var(--surface)] transition-all duration-200 shadow-sm hover:shadow-md border border-[var(--border)]"
          >
            Return Home
          </a>
        </div>

        {/* Progress Dots */}
        <div className="mt-16 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[var(--border)]"
              style={{
                animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}