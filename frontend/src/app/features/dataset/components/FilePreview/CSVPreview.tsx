import { useRef, useEffect } from "react";

interface CSVPreviewProps {
  data: string[][];
  headers?: string[];
}

export function CSVPreview({ data, headers }: CSVPreviewProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Synchronize scrolling between header and body
  useEffect(() => {
    const headerEl = headerRef.current;
    const bodyEl = bodyRef.current;

    if (!headerEl || !bodyEl) return;

    const handleHeaderScroll = () => {
      if (bodyEl) bodyEl.scrollLeft = headerEl.scrollLeft;
    };

    const handleBodyScroll = () => {
      if (headerEl) headerEl.scrollLeft = bodyEl.scrollLeft;
    };

    headerEl.addEventListener("scroll", handleHeaderScroll);
    bodyEl.addEventListener("scroll", handleBodyScroll);

    return () => {
      headerEl.removeEventListener("scroll", handleHeaderScroll);
      bodyEl.removeEventListener("scroll", handleBodyScroll);
    };
  }, []);

  return (
    <div className="relative">
      {/* Sticky header container */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div ref={headerRef} className="overflow-x-auto">
          {headers && (
            <table className="min-w-full">
              <thead className="bg-gray-50">
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
            </table>
          )}
        </div>
      </div>

      {/* Table body container */}
      <div ref={bodyRef} className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {headers && (
            <thead className="invisible h-0">
              <tr>
                {headers.map((_, i) => (
                  <th key={i}></th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
