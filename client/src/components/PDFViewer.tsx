import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Play, Pause, Square, Upload } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

interface WordPosition {
  word: string;
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
}

interface PDFViewerProps {
  onTextExtracted?: (text: string) => void;
  currentWordIndex?: number;
  isReading?: boolean;
  onReadingStateChange?: (isReading: boolean) => void;
  readSpeed?: number;
  onReadSpeedChange?: (speed: number) => void;
}

export function PDFViewer({
  onTextExtracted,
  currentWordIndex = -1,
  isReading = false,
  onReadingStateChange,
  readSpeed = 1,
  onReadSpeedChange,
}: PDFViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [pageText, setPageText] = useState<string>("");
  const [wordPositions, setWordPositions] = useState<WordPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;
    
    setIsLoading(true);
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      } as any).promise;
      
      const textContent = await page.getTextContent();
      const words: WordPosition[] = [];
      let fullText = "";
      let wordIndex = 0;
      
      for (const item of textContent.items) {
        const textItem = item as TextItem;
        if (!textItem.str.trim()) continue;
        
        const [scaleX, , , scaleY, x, y] = textItem.transform;
        const itemWords = textItem.str.split(/\s+/).filter(w => w.length > 0);
        
        let currentX = x * scale;
        const itemY = viewport.height - (y * scale);
        const charWidth = (textItem.width * scale) / textItem.str.length;
        
        for (const word of itemWords) {
          const wordWidth = word.length * charWidth;
          words.push({
            word,
            x: currentX,
            y: itemY - (Math.abs(scaleY) * scale),
            width: wordWidth,
            height: Math.abs(scaleY) * scale * 1.2,
            index: wordIndex,
          });
          fullText += (fullText ? " " : "") + word;
          currentX += wordWidth + charWidth;
          wordIndex++;
        }
      }
      
      setWordPositions(words);
      setPageText(fullText);
      
      if (onTextExtracted) {
        onTextExtracted(fullText);
      }
    } catch (error) {
      console.error("Error rendering page:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pdfDoc, scale, onTextExtracted]);

  useEffect(() => {
    if (pdfDoc && currentPage > 0) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, renderPage]);

  const loadPDF = async (file: File) => {
    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setFileName(file.name);
    } catch (error) {
      console.error("Error loading PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      loadPDF(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      loadPDF(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const adjustZoom = (delta: number) => {
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const highlightedWord = wordPositions.find(w => w.index === currentWordIndex);

  return (
    <Card className="w-full h-full flex flex-col" data-testid="pdf-viewer">
      <div className="flex items-center justify-between p-2 border-b gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            data-testid="input-pdf-file"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-upload-pdf"
          >
            <Upload className="w-4 h-4 mr-1" />
            Load PDF
          </Button>
          {fileName && (
            <span className="text-sm text-muted-foreground truncate max-w-[150px]">
              {fileName}
            </span>
          )}
        </div>
        
        {pdfDoc && (
          <>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm min-w-[80px] text-center" data-testid="text-page-info">
                {currentPage} / {totalPages}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                data-testid="button-next-page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => adjustZoom(-0.2)}
                data-testid="button-zoom-out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm min-w-[50px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => adjustZoom(0.2)}
                data-testid="button-zoom-in"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
      
      {onReadSpeedChange && (
        <div className="flex items-center gap-3 px-3 py-2 border-b">
          <span className="text-sm text-muted-foreground">Read Speed:</span>
          <Slider
            value={[readSpeed]}
            onValueChange={([v]) => onReadSpeedChange(v)}
            min={0.5}
            max={2}
            step={0.1}
            className="w-32"
            data-testid="slider-read-speed"
          />
          <span className="text-sm min-w-[40px]" data-testid="text-read-speed">
            {readSpeed.toFixed(1)}x
          </span>
          
          {onReadingStateChange && (
            <div className="flex items-center gap-1 ml-auto">
              <Button
                size="sm"
                variant={isReading ? "secondary" : "default"}
                onClick={() => onReadingStateChange(!isReading)}
                disabled={!pageText}
                data-testid="button-toggle-reading"
              >
                {isReading ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {isReading ? "Pause" : "Read"}
              </Button>
              {isReading && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReadingStateChange(false)}
                  data-testid="button-stop-reading"
                >
                  <Square className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      
      <CardContent
        ref={containerRef}
        className="flex-1 overflow-auto p-4 relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {!pdfDoc ? (
          <div
            className="w-full h-full min-h-[300px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground"
            data-testid="pdf-dropzone"
          >
            <Upload className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg mb-2">Drop a PDF here</p>
            <p className="text-sm">or click "Load PDF" to select a file</p>
          </div>
        ) : (
          <div className="relative inline-block">
            <canvas
              ref={canvasRef}
              className="block shadow-lg"
              data-testid="canvas-pdf"
            />
            
            <div
              ref={highlightLayerRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{
                width: canvasRef.current?.width || 0,
                height: canvasRef.current?.height || 0,
              }}
            >
              {highlightedWord && (
                <div
                  className="absolute bg-yellow-400/50 rounded transition-all duration-100"
                  style={{
                    left: highlightedWord.x,
                    top: highlightedWord.y,
                    width: highlightedWord.width,
                    height: highlightedWord.height,
                  }}
                  data-testid="word-highlight"
                />
              )}
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
