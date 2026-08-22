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
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = currentPage - 2;
    let end = currentPage + 2;

    if (start < 1) {
      start = 1;
      end = maxVisible;
    }

    if (end > totalPages) {
      end = totalPages;
      start = totalPages - maxVisible + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg px-4 sm:px-6 py-4 w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* Prev */}
        <button
          onClick={() => onPageChange(offset - limit)}
          disabled={!has_prev}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-5 py-2 rounded-xl font-semibold text-sm border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Prev
        </button>

        {/* Page numbers */}
        <div className="flex items-center justify-center flex-wrap gap-1 sm:gap-1.5 max-w-full overflow-x-auto">

          {/* Leading */}
          {getPageNumbers()[0] > 1 && (
            <>
              <button
                onClick={() => onPageChange(0)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-semibold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
              >
                1
              </button>

              {getPageNumbers()[0] > 2 && (
                <span className="w-8 h-8 sm:w-9 sm:h-9 flex items-end justify-center pb-1 text-gray-400 text-sm sm:text-lg font-bold select-none">
                  ···
                </span>
              )}
            </>
          )}

          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => onPageChange((page - 1) * limit)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                currentPage === page
                  ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
            >
              {page}
            </button>
          ))}

          {/* Trailing */}
          {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
            <>
              {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                <span className="w-8 h-8 sm:w-9 sm:h-9 flex items-end justify-center pb-1 text-gray-400 text-sm sm:text-lg font-bold select-none">
                  ···
                </span>
              )}

              <button
                onClick={() => onPageChange((totalPages - 1) * limit)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-semibold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
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
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-5 py-2 rounded-xl font-semibold text-sm border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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