import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pageNumbers: (number | '...')[] = [];
  const maxButtons = 7;

  if (totalPages <= maxButtons) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    const left = Math.max(2, currentPage - 2);
    const right = Math.min(totalPages - 1, currentPage + 2);

    pageNumbers.push(1);
    if (left > 2) pageNumbers.push('...');

    for (let i = left; i <= right; i++) pageNumbers.push(i);

    if (right < totalPages - 1) pageNumbers.push('...');
    pageNumbers.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-2 mt-6" aria-label="Pagination">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`px-3 py-2 rounded-full text-sm font-medium transition ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-text-primary shadow-sm hover:border-blue-300 border border-gray-200'}`}
      >
        Prev
      </button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((p, idx) =>
          p === '...' ? (
            <span key={idx} className="px-2 text-sm text-text-secondary">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`min-w-[40px] h-10 flex items-center justify-center rounded-full text-sm font-medium transition ${currentPage === p ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-text-primary hover:bg-blue-50 border border-gray-200'}`}
              aria-current={currentPage === p ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`px-3 py-2 rounded-full text-sm font-medium transition ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-text-primary shadow-sm hover:border-blue-300 border border-gray-200'}`}
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;
