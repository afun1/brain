import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Play, Pause, Square, SkipForward, SkipBack, Languages, Volume2, Loader2, Info, RotateCcw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type PlayState = "original" | "pause" | "translated" | "idle";

interface Sentence {
  original: string;
  translated: string;
  originalAudio?: string;
  translatedAudio?: string;
}

const VOICES = [
  { id: "alloy", name: "Alloy", desc: "Neutral, balanced" },
  { id: "echo", name: "Echo", desc: "Warm, conversational" },
  { id: "fable", name: "Fable", desc: "Expressive, British" },
  { id: "onyx", name: "Onyx", desc: "Deep, authoritative" },
  { id: "nova", name: "Nova", desc: "Friendly, upbeat" },
  { id: "shimmer", name: "Shimmer", desc: "Clear, gentle" },
];

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese",
  "Russian", "Chinese", "Japanese", "Korean", "Arabic", "Hindi",
  "Dutch", "Polish", "Swedish", "Norwegian", "Danish", "Finnish",
  "Greek", "Turkish", "Hebrew", "Thai", "Vietnamese", "Indonesian",
];

export function LanguageLearner() {
  const [inputText, setInputText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [voice, setVoice] = useState("alloy");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [pauseBetween, setPauseBetween] = useState(1);
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const handleVoiceChange = (newVoice: string) => {
    setVoice(newVoice);
    setSentences(prev => prev.map(s => ({
      ...s,
      originalAudio: undefined,
      translatedAudio: undefined,
    })));
  };

  const splitIntoSentences = (text: string): string[] => {
    return text
      .split(/(?<=[.!?。！？])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    
    setIsTranslating(true);
    setError(null);
    try {
      const originalSentences = splitIntoSentences(inputText);
      
      if (originalSentences.length === 0) {
        toast({
          title: "No sentences found",
          description: "Please enter text with complete sentences (ending in . ! or ?)",
          variant: "destructive",
        });
        return;
      }
      
      const translatedSentences: Sentence[] = [];
      for (const original of originalSentences) {
        const response = await apiRequest("POST", "/api/translate", {
          text: original,
          targetLanguage,
        });
        const data = await response.json();
        translatedSentences.push({
          original,
          translated: data.translation,
        });
      }
      
      setSentences(translatedSentences);
      setCurrentIndex(0);
      toast({
        title: "Translation complete",
        description: `${translatedSentences.length} sentence${translatedSentences.length > 1 ? 's' : ''} ready for learning`,
      });
    } catch (error) {
      console.error("Translation error:", error);
      setError("Translation failed. Please try again.");
      toast({
        title: "Translation failed",
        description: "There was an error translating the text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const generateAudioForSentence = async (index: number): Promise<Sentence> => {
    const sentence = sentences[index];
    if (sentence.originalAudio && sentence.translatedAudio) {
      return sentence;
    }

    setIsGeneratingAudio(true);
    try {
      const response = await apiRequest("POST", "/api/tts/bilingual", {
        originalText: sentence.original,
        translatedText: sentence.translated,
        voice,
      });
      const data = await response.json();
      
      const updated = {
        ...sentence,
        originalAudio: data.originalAudio,
        translatedAudio: data.translatedAudio,
      };
      
      setSentences(prev => {
        const newSentences = [...prev];
        newSentences[index] = updated;
        return newSentences;
      });
      
      return updated;
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const playAudio = (base64Audio: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
      audio.playbackRate = playbackSpeed;
      audioRef.current = audio;
      
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Audio playback failed"));
      audio.play().catch(reject);
    });
  };

  const wait = (seconds: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  };

  const playSentence = async (index: number) => {
    if (index >= sentences.length) {
      setIsPlaying(false);
      setPlayState("idle");
      return;
    }

    setCurrentIndex(index);
    
    try {
      const sentence = await generateAudioForSentence(index);
      
      if (!isPlayingRef.current) return;
      
      setPlayState("original");
      if (sentence.originalAudio) {
        await playAudio(sentence.originalAudio);
      }
      
      if (!isPlayingRef.current) return;
      
      setPlayState("pause");
      await wait(pauseBetween);
      
      if (!isPlayingRef.current) return;
      
      setPlayState("translated");
      if (sentence.translatedAudio) {
        await playAudio(sentence.translatedAudio);
      }
      
      if (!isPlayingRef.current) return;
      
      await wait(0.5);
      
      if (isPlayingRef.current) {
        playSentence(index + 1);
      }
    } catch (error) {
      console.error("Playback error:", error);
      setIsPlaying(false);
      setPlayState("idle");
      toast({
        title: "Playback error",
        description: "There was an error playing the audio. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePlay = () => {
    if (sentences.length === 0) return;
    setIsPlaying(true);
    playSentence(currentIndex);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayState("idle");
  };

  const handleStop = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayState("idle");
    setCurrentIndex(0);
  };

  const handleNext = () => {
    if (currentIndex < sentences.length - 1) {
      const wasPlaying = isPlaying;
      handlePause();
      setCurrentIndex(prev => prev + 1);
      if (wasPlaying) {
        setTimeout(() => {
          setIsPlaying(true);
          playSentence(currentIndex + 1);
        }, 100);
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const wasPlaying = isPlaying;
      handlePause();
      setCurrentIndex(prev => prev - 1);
      if (wasPlaying) {
        setTimeout(() => {
          setIsPlaying(true);
          playSentence(currentIndex - 1);
        }, 100);
      }
    }
  };

  const handleReset = () => {
    handleStop();
    setSentences([]);
    setInputText("");
  };

  return (
    <Card className="bg-card/50 border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Languages className="w-4 h-4 text-primary" />
          Language Learning
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3 h-3 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Paste foreign language text to learn. It will be translated sentence by sentence, then read aloud in both languages for immersive learning.</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sentences.length === 0 ? (
          <>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Paste text in any language:</label>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste Spanish, French, German, or any language text here..."
                className="min-h-[120px] text-sm bg-background/50"
                data-testid="input-foreign-text"
              />
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Translate to:</span>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger className="w-[130px] h-8 text-xs" data-testid="select-target-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => (
                      <SelectItem key={lang} value={lang} data-testid={`option-lang-${lang.toLowerCase()}`}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Voice:</span>
                <Select value={voice} onValueChange={handleVoiceChange}>
                  <SelectTrigger className="w-[120px] h-8 text-xs" data-testid="select-voice">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICES.map(v => (
                      <SelectItem key={v.id} value={v.id} data-testid={`option-voice-${v.id}`}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button
              onClick={handleTranslate}
              disabled={!inputText.trim() || isTranslating}
              className="w-full"
              data-testid="button-translate"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="w-4 h-4 mr-2" />
                  Translate & Prepare
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="bg-background/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Sentence {currentIndex + 1} of {sentences.length}</span>
                <span className="flex items-center gap-1">
                  {isGeneratingAudio && <Loader2 className="w-3 h-3 animate-spin" />}
                  {playState === "original" && "Playing original..."}
                  {playState === "translated" && "Playing translation..."}
                  {playState === "pause" && "Pause..."}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className={`p-3 rounded-md transition-colors ${
                  playState === "original" ? "bg-primary/20 border border-primary/30" : "bg-background/50"
                }`}>
                  <p className="text-sm font-medium" data-testid="text-original-sentence">
                    {sentences[currentIndex]?.original}
                  </p>
                </div>
                
                <div className={`p-3 rounded-md transition-colors ${
                  playState === "translated" ? "bg-green-500/20 border border-green-500/30" : "bg-background/50"
                }`}>
                  <p className="text-sm text-muted-foreground" data-testid="text-translated-sentence">
                    {sentences[currentIndex]?.translated}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePrev}
                disabled={currentIndex === 0 || isGeneratingAudio}
                data-testid="button-prev-sentence"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
              {isPlaying ? (
                <Button
                  size="icon"
                  variant="default"
                  onClick={handlePause}
                  data-testid="button-pause"
                >
                  <Pause className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="default"
                  onClick={handlePlay}
                  disabled={isGeneratingAudio}
                  data-testid="button-play"
                >
                  <Play className="w-5 h-5" />
                </Button>
              )}
              
              <Button
                size="icon"
                variant="ghost"
                onClick={handleStop}
                data-testid="button-stop"
              >
                <Square className="w-4 h-4" />
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={handleNext}
                disabled={currentIndex === sentences.length - 1 || isGeneratingAudio}
                data-testid="button-next-sentence"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Speed</span>
                  <span className="text-xs font-mono">{playbackSpeed.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[playbackSpeed]}
                  onValueChange={([v]) => setPlaybackSpeed(v)}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="w-full"
                  data-testid="slider-speed"
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Pause</span>
                  <span className="text-xs font-mono">{pauseBetween}s</span>
                </div>
                <Slider
                  value={[pauseBetween]}
                  onValueChange={([v]) => setPauseBetween(v)}
                  min={0.5}
                  max={5}
                  step={0.5}
                  className="w-full"
                  data-testid="slider-pause"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Volume2 className="w-3 h-3 text-muted-foreground" />
                <Select value={voice} onValueChange={handleVoiceChange}>
                  <SelectTrigger className="w-[100px] h-7 text-xs" data-testid="select-voice-playback">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICES.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="ml-auto"
                data-testid="button-reset"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                New Text
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1 bg-background/30 rounded p-2">
              <p className="font-medium">Learning Tips:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Listen to the original language first, then hear the translation</li>
                <li>Adjust pause duration to give yourself time to repeat</li>
                <li>Use slower speeds (0.5x-1x) to catch pronunciation</li>
                <li>Increase speed as you become more familiar</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
