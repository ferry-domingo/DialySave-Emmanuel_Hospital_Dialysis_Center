const TablePagination = ({
  currentPage,
  totalPages,
  onPrev,
  onNext,
}) => {
  return (
    <div className="flex justify-end gap-3 mt-4">

      <button
        onClick={onPrev}
        disabled={currentPage === 1}
        className="px-3 py-2 border rounded"
      >
        Previous
      </button>

      <span className="flex items-center">
        {currentPage} / {totalPages}
      </span>

      <button
        onClick={onNext}
        disabled={currentPage === totalPages}
        className="px-3 py-2 border rounded"
      >
        Next
      </button>

    </div>
  );
};

export default TablePagination;