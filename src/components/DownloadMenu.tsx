// Small "download this chart" dropdown — exports the referenced element as a
// PDF or a PPTX slide. Sits in a card header, e.g. <DownloadMenu targetRef={ref} .../>
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Download, FileText, Presentation, Loader2 } from 'lucide-react';
import { downloadElementAsPDF, downloadElementAsPPTX } from '@/lib/exportChart';

interface DownloadMenuProps {
  targetRef: RefObject<HTMLElement>;
  filename: string;
  title?: string;
}

export function DownloadMenu({ targetRef, filename, title }: DownloadMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<'pdf' | 'pptx' | null>(null);
  const [error, setError] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleDownload = async (type: 'pdf' | 'pptx') => {
    if (!targetRef.current || loading) return;
    setLoading(type);
    setError(false);
    try {
      if (type === 'pdf') await downloadElementAsPDF(targetRef.current, filename);
      else await downloadElementAsPPTX(targetRef.current, filename, title);
      setOpen(false);
    } catch (err) {
      console.error('Chart export failed', err);
      setError(true);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative" ref={wrapRef} data-html2canvas-ignore="true">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={!!loading}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200 disabled:opacity-60 flex-shrink-0"
        title="Download this chart"
        aria-label="Download this chart"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-stone-200/60 shadow-card-lg py-1.5 z-30 animate-fade-in-scale origin-top-right"
        >
          <button
            role="menuitem"
            onClick={() => handleDownload('pdf')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-red-500 flex-shrink-0" /> Download as PDF
          </button>
          <button
            role="menuitem"
            onClick={() => handleDownload('pptx')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <Presentation className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" /> Download as PPTX
          </button>
          {error && (
            <div className="px-3 pt-1.5 pb-0.5 text-[11px] text-red-500">Couldn't export — try again.</div>
          )}
        </div>
      )}
    </div>
  );
}
