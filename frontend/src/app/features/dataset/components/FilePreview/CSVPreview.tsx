import { useRef, useEffect, useState } from "react";

interface CSVPreviewProps {
  data: string[][];
  headers?: string[];
}

export function CSVPreview({ data, headers }: CSVPreviewProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const stickyScrollRef = useRef<HTMLDivElement>(null);
  const [tableWidth, setTableWidth] = useState(0);

  // Validate data format - ensure it's actually an array of arrays
  const validData = Array.isArray(data)
    ? data.filter((row) => Array.isArray(row))
    : [];

  // Measure the table width and update the sticky scrollbar width
  useEffect(() => {
    const updateTableWidth = () => {
      if (tableContainerRef.current) {
        const tableEl = tableContainerRef.current.querySelector("table");
        if (tableEl) {
          setTableWidth(tableEl.offsetWidth);
        }
      }
    };

    // Initial measurement
    updateTableWidth();

    // Set up resize observer to handle window/content size changes
    const resizeObserver = new ResizeObserver(updateTableWidth);
    if (tableContainerRef.current) {
      resizeObserver.observe(tableContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [validData, headers]); // Use validData instead of data

  // Synchronize scrolling between the table container and sticky scrollbar
  useEffect(() => {
    const tableEl = tableContainerRef.current;
    const scrollEl = stickyScrollRef.current;

    if (!tableEl || !scrollEl) return;

    const handleTableScroll = () => {
      if (scrollEl) scrollEl.scrollLeft = tableEl.scrollLeft;
    };

    const handleScrollbarScroll = () => {
      if (tableEl) tableEl.scrollLeft = scrollEl.scrollLeft;
    };

    tableEl.addEventListener("scroll", handleTableScroll);
    scrollEl.addEventListener("scroll", handleScrollbarScroll);

    return () => {
      tableEl.removeEventListener("scroll", handleTableScroll);
      scrollEl.removeEventListener("scroll", handleScrollbarScroll);
    };
  }, []);

  return (
    <div className="relative flex flex-col">
      {/* Main table container with fixed height */}
      <div
        ref={tableContainerRef}
        className="overflow-y-auto overflow-x-hidden max-h-[60vh]"
      >
        <table className="min-w-full divide-y divide-gray-200">
          {headers && (
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {headers.map((header, i) => (
                  <th
                    key={i}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="bg-white divide-y divide-gray-200">
            {validData.length === 0 ? (
              <tr>
                <td
                  colSpan={headers?.length || 1}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No data to display
                </td>
              </tr>
            ) : (
              validData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sticky scrollbar that's always visible */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 z-10 mt-1">
        <div
          ref={stickyScrollRef}
          className="overflow-x-auto overflow-y-hidden h-4"
        >
          <div style={{ width: `${tableWidth}px`, height: "1px" }}></div>
        </div>
      </div>
    </div>
  );
}
