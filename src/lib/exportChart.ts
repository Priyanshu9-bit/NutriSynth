// Utilities for exporting a chart/card DOM node as a downloadable PDF or PPTX.
// Libraries are dynamically imported so they don't bloat the main bundle for
// people who never click "download".

async function captureElement(el: HTMLElement): Promise<{ dataUrl: string; width: number; height: number }> {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(el, {
    scale: Math.min(2, window.devicePixelRatio || 1.5) + 0.5,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });
  return { dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
}

export async function downloadElementAsPDF(el: HTMLElement, filename = 'chart') {
  const [{ jsPDF }, { dataUrl, width, height }] = await Promise.all([
    import('jspdf'),
    captureElement(el),
  ]);

  const orientation = width >= height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 32;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;
  const ratio = Math.min(maxW / width, maxH / height);
  const w = width * ratio;
  const h = height * ratio;
  const x = (pageW - w) / 2;
  const y = (pageH - h) / 2;

  pdf.addImage(dataUrl, 'PNG', x, y, w, h, undefined, 'FAST');
  pdf.save(`${filename}.pdf`);
}

export async function downloadElementAsPPTX(el: HTMLElement, filename = 'chart', title?: string) {
  const [{ default: PptxGenJS }, { dataUrl, width, height }] = await Promise.all([
    import('pptxgenjs'),
    captureElement(el),
  ]);

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'NUTRISYNTH', width: 10, height: 5.63 });
  pptx.layout = 'NUTRISYNTH';

  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };

  let availW = 9.2;
  let availH = 5.0;
  let imageY = (5.63 - availH) / 2;

  if (title) {
    slide.addText(title, {
      x: 0.4, y: 0.28, w: 9.2, h: 0.5,
      fontSize: 20, bold: true, color: '1C1917', fontFace: 'Arial',
    });
    availH = 4.55;
    imageY = 0.95;
  }

  const ratio = Math.min(availW / width, availH / height);
  const w = width * ratio;
  const h = height * ratio;
  const x = (10 - w) / 2;

  slide.addImage({ data: dataUrl, x, y: imageY, w, h });
  await pptx.writeFile({ fileName: `${filename}.pptx` });
}
