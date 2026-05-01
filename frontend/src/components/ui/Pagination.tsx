// components/ui/Pagination.tsx

interface PaginationProps {
    offset: number;
    limit: number;
    total: number;
    has_next: boolean;
    has_prev: boolean;
    onPageChange: (newOffset: number) => void;
  }
  
  export default function Pagination({
    offset,
    limit,
    total,
    has_next,
    has_prev,
    onPageChange,
  }: PaginationProps) {
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.floor(offset / limit) + 1;
  
    const getPageNumbers = (): number[] => {
      // Always show 5 pages if possible
      const maxVisible = 5;
  
      if (totalPages <= maxVisible) {
        // Not enough pages to need a window — show all
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
  
      // We want currentPage to sit in the middle (index 2 of 5)
      let start = currentPage - 2;
      let end = currentPage + 2;
  
      // Clamp: don't go below 1
      if (start < 1) {
        start = 1;
        end = maxVisible;
      }
  
      // Clamp: don't go above totalPages
      if (end > totalPages) {
        end = totalPages;
        start = totalPages - maxVisible + 1;
      }
  
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };
  
    if (totalPages <= 1) return null;
  
    return (
      <div className="bg-white rounded-2xl shadow-lg px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Prev */}
          <button
            onClick={() => onPageChange(offset - limit)}
            disabled={!has_prev}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </button>
  
          {/* Page numbers */}
          <div className="flex items-center gap-1.5">
            {/* Show leading ellipsis if window doesn't start at 1 */}
            {getPageNumbers()[0] > 1 && (
              <>
                <button
                  onClick={() => onPageChange(0)}
                  className="w-9 h-9 rounded-lg text-sm font-semibold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                >
                  1
                </button>
                {getPageNumbers()[0] > 2 && (
                  <span className="w-9 h-9 flex items-end justify-center pb-1 text-gray-400 text-lg font-bold select-none">
                    ···
                  </span>
                )}
              </>
            )}
  
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => onPageChange((page - 1) * limit)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                  currentPage === page
                    ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
              >
                {page}
              </button>
            ))}
  
            {/* Show trailing ellipsis if window doesn't end at last page */}
            {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
              <>
                {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                  <span className="w-9 h-9 flex items-end justify-center pb-1 text-gray-400 text-lg font-bold select-none">
                    ···
                  </span>
                )}
                <button
                  onClick={() => onPageChange((totalPages - 1) * limit)}
                  className="w-9 h-9 rounded-lg text-sm font-semibold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
  
          {/* Next */}
          <button
            onClick={() => onPageChange(offset + limit)}
            disabled={!has_next}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }