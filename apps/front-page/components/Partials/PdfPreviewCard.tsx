"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import Link from "next/link";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export function PdfPreviewCard({ title, href }: { title: string; href: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState<number>(0);

  useEffect(() => {
    if (containerRef.current) {
      setPageWidth(containerRef.current.clientWidth);
    }
  }, []);

  return (
    <Link href={href} target="_blank" rel="noopener noreferrer">
      <div className="group flex flex-col rounded-xl border border-gray-200 overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white">
        <div ref={containerRef} className="w-full bg-gray-50 overflow-hidden" style={{ height: 280 }}>
          {pageWidth > 0 ? (
            <Document
              file={href}
              loading={
                <div className="w-full h-full bg-gray-100 animate-pulse" />
              }
              error={
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                  Preview unavailable
                </div>
              }
            >
              <Page
                pageNumber={1}
                width={pageWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          ) : (
            <div className="w-full h-full bg-gray-100 animate-pulse" />
          )}
        </div>
        <div className="px-4 py-3 bg-gray-800">
          <p className="text-sm font-semibold text-white text-center leading-snug">
            {title}
          </p>
        </div>
      </div>
    </Link>
  );
}
