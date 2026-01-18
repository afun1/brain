import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Play, Pause, Square, Upload, BookOpen, Info, Eye } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  globalIndex: number;
}

export function PDFReader() {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [pageText, setPageText] = useState<string>("");
  const [allPagesText, setAllPagesText] = useState<string[]>([]);
  const [wordPositions, setWordPositions] = useState<WordPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [readSpeed, setReadSpeed] = useState(1.0);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordsRef = useRef<string[]>([]);
  const wordTimingsRef = useRef<{ start: number; end: number }[]>([]);
  const animationFrameRef = useRef<number>(0);
  const pageWordStartRef = useRef<number>(0);

  const renderPage = useCallback(async (pageNum: number, pdf?: pdfjsLib.PDFDocumentProxy) => {
    const doc = pdf || pdfDoc;
    if (!doc || !canvasRef.current) return;
    
    setIsLoading(true);
    try {
      const page = await doc.getPage(pageNum);
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
      
      let wordsBeforePage = 0;
      for (let p = 0; p < pageNum - 1; p++) {
        wordsBeforePage += (allPagesText[p] || "").split(/\s+/).filter(w => w.length > 0).length;
      }
      pageWordStartRef.current = wordsBeforePage;
      
      for (const item of textContent.items) {
        const textItem = item as TextItem;
        if (!textItem.str.trim()) continue;
        
        const [scaleX, , , scaleY, x, y] = textItem.transform;
        const itemWords = textItem.str.split(/\s+/).filter(w => w.length > 0);
        
        let currentX = x * scale;
        const itemY = viewport.height - (y * scale);
        const charWidth = (textItem.width * scale) / Math.max(textItem.str.length, 1);
        
        for (const word of itemWords) {
          const wordWidth = Math.max(word.length * charWidth, 10);
          words.push({
            word,
            x: currentX,
            y: itemY - (Math.abs(scaleY) * scale),
            width: wordWidth,
            height: Math.abs(scaleY) * scale * 1.4,
            index: wordIndex,
            globalIndex: wordsBeforePage + wordIndex,
          });
          fullText += (fullText ? " " : "") + word;
          currentX += wordWidth + charWidth * 0.5;
          wordIndex++;
        }
      }
      
      setWordPositions(words);
      setPageText(fullText);
    } catch (error) {
      console.error("Error rendering page:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pdfDoc, scale, allPagesText]);

  useEffect(() => {
    if (pdfDoc && currentPage > 0) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, renderPage]);

  const extractAllText = async (pdf: pdfjsLib.PDFDocumentProxy): Promise<string[]> => {
    const texts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let pageText = "";
        for (const item of textContent.items) {
          const textItem = item as TextItem;
          if (textItem.str.trim()) {
            pageText += (pageText ? " " : "") + textItem.str.trim();
          }
        }
        texts.push(pageText);
      } catch (error) {
        texts.push("");
      }
    }
    return texts;
  };

  const loadPDF = async (file: File) => {
    setIsLoading(true);
    stopReading();
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const texts = await extractAllText(pdf);
      setAllPagesText(texts);
      
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setFileName(file.name);
      
      await renderPage(1, pdf);
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
    setScale(prev => Math.max(0.5, Math.min(2.5, prev + delta)));
  };

  const estimateWordTimings = useCallback((words: string[], audioDuration: number) => {
    const totalChars = words.reduce((sum, w) => sum + w.length + 1, 0);
    let currentTime = 0;
    const timings: { start: number; end: number }[] = [];
    
    for (const word of words) {
      const wordDuration = ((word.length + 1) / totalChars) * audioDuration;
      timings.push({
        start: currentTime,
        end: currentTime + wordDuration,
      });
      currentTime += wordDuration;
    }
    
    return timings;
  }, []);

  const updateHighlight = useCallback(() => {
    if (!audioRef.current || !isReading || isPaused) return;
    
    const currentTime = audioRef.current.currentTime;
    const timings = wordTimingsRef.current;
    
    let newIndex = -1;
    for (let i = 0; i < timings.length; i++) {
      if (currentTime >= timings[i].start && currentTime < timings[i].end) {
        newIndex = i;
        break;
      }
    }
    
    if (newIndex !== currentWordIndex && newIndex !== -1) {
      setCurrentWordIndex(newIndex);
      
      const words = wordsRef.current;
      let wordsBefore = 0;
      for (let p = 0; p < allPagesText.length; p++) {
        const pageWords = allPagesText[p].split(/\s+/).filter(w => w.length > 0);
        if (wordsBefore + pageWords.length > newIndex) {
          if (p + 1 !== currentPage) {
            setCurrentPage(p + 1);
          }
          break;
        }
        wordsBefore += pageWords.length;
      }
    }
    
    if (isReading && !isPaused) {
      animationFrameRef.current = requestAnimationFrame(updateHighlight);
    }
  }, [isReading, isPaused, currentWordIndex, allPagesText, currentPage]);

  const hasExtractableText = allPagesText.some(t => t.trim().length > 0);
  
  const startReading = useCallback(async () => {
    if (allPagesText.length === 0) return;
    
    const fullText = allPagesText.join(" ");
    if (!fullText.trim()) return;
    
    setIsTTSLoading(true);
    const words = fullText.split(/\s+/).filter(w => w.length > 0);
    wordsRef.current = words;
    
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullText, speed: readSpeed }),
      });
      
      if (!response.ok) {
        throw new Error("TTS generation failed");
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onloadedmetadata = () => {
        wordTimingsRef.current = estimateWordTimings(words, audio.duration);
        audio.playbackRate = readSpeed;
        audio.play();
        setIsReading(true);
        setIsPaused(false);
        setCurrentWordIndex(0);
        setCurrentPage(1);
        animationFrameRef.current = requestAnimationFrame(updateHighlight);
      };
      
      audio.onended = () => {
        setIsReading(false);
        setIsPaused(false);
        setCurrentWordIndex(-1);
        cancelAnimationFrame(animationFrameRef.current);
      };
      
      audio.onerror = () => {
        setIsReading(false);
        setIsTTSLoading(false);
      };
      
    } catch (error) {
      console.error("TTS error:", error);
    } finally {
      setIsTTSLoading(false);
    }
  }, [allPagesText, readSpeed, estimateWordTimings, updateHighlight]);

  const pauseReading = useCallback(() => {
    if (audioRef.current && isReading) {
      audioRef.current.pause();
      setIsPaused(true);
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isReading]);

  const resumeReading = useCallback(() => {
    if (audioRef.current && isPaused) {
      audioRef.current.play();
      setIsPaused(false);
      animationFrameRef.current = requestAnimationFrame(updateHighlight);
    }
  }, [isPaused, updateHighlight]);

  const stopReading = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsReading(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
    cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const toggleReading = useCallback(() => {
    if (isReading && !isPaused) {
      pauseReading();
    } else if (isPaused) {
      resumeReading();
    } else {
      startReading();
    }
  }, [isReading, isPaused, pauseReading, resumeReading, startReading]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current && isReading && !isPaused) {
      animationFrameRef.current = requestAnimationFrame(updateHighlight);
    }
  }, [isReading, isPaused, updateHighlight]);

  const localWordIndex = currentWordIndex - pageWordStartRef.current;
  const highlightedWord = wordPositions.find(w => w.index === localWordIndex);

  return (
    <Card className="w-full" data-testid="pdf-reader">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            PDF Reader
          </CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
                <Eye className="w-3 h-3" />
                <span>Alpha state ideal for reading</span>
                <Info className="w-3 h-3" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Research shows Alpha (10 Hz) is ideal for reading with eyes open. It enhances focus, comprehension, and retention while maintaining relaxed alertness.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
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
            <span className="text-xs text-muted-foreground truncate max-w-[120px]" data-testid="text-pdf-filename">
              {fileName}
            </span>
          )}
          
          {pdfDoc && (
            <>
              <div className="flex items-center gap-1 ml-auto">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs min-w-[50px] text-center" data-testid="text-page-info">
                  {currentPage}/{totalPages}
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
                <span className="text-xs min-w-[40px] text-center">
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
        
        {pdfDoc && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Speed:</span>
              <Slider
                value={[readSpeed]}
                onValueChange={([v]) => setReadSpeed(v)}
                min={0.5}
                max={2}
                step={0.1}
                className="flex-1"
                disabled={isReading}
                data-testid="slider-read-speed"
              />
              <span className="text-xs min-w-[35px]" data-testid="text-read-speed">
                {readSpeed.toFixed(1)}x
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={isReading && !isPaused ? "secondary" : "default"}
                onClick={toggleReading}
                disabled={isTTSLoading || !pageText}
                data-testid="button-toggle-reading"
              >
                {isTTSLoading ? (
                  "Loading..."
                ) : isReading && !isPaused ? (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    {isPaused ? "Resume" : "Read Aloud"}
                  </>
                )}
              </Button>
              {isReading && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={stopReading}
                  data-testid="button-stop-reading"
                >
                  <Square className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
        
        <div
          ref={containerRef}
          className="relative overflow-auto bg-zinc-900 rounded-lg max-h-[400px] min-h-[200px]"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {!pdfDoc ? (
            <div
              className="w-full h-[200px] border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center text-muted-foreground"
              data-testid="pdf-dropzone"
            >
              <Upload className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Drop a PDF here or click Load PDF</p>
            </div>
          ) : (
            <div className="relative inline-block mx-auto">
              <canvas
                ref={canvasRef}
                className="block mx-auto"
                data-testid="canvas-pdf"
              />
              
              <div
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: canvasRef.current?.width || 0,
                  height: canvasRef.current?.height || 0,
                }}
              >
                {highlightedWord && (
                  <div
                    className="absolute bg-yellow-400/60 rounded-sm transition-all duration-75"
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
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <div className="text-muted-foreground text-sm">Loading...</div>
            </div>
          )}
        </div>
        
        {isReading && (
          <div className="text-center text-xs text-muted-foreground" data-testid="text-reading-status">
            Reading word {currentWordIndex + 1} of {wordsRef.current.length}
          </div>
        )}
        
        {pdfDoc && !hasExtractableText && (
          <div className="text-center text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded" data-testid="text-no-text-warning">
            This PDF appears to be scanned or has no extractable text. TTS may not work.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
