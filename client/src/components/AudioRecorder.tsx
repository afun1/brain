import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Mic, Square, Play, Pause, Save, Wand2, Volume2, FileAudio } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import lamejs from "lamejs";

interface AudioRecorderProps {
  onSaveRecording: (file: File, name: string) => void;
  onSaveSubliminal: (file: File, name: string) => void;
  testIdPrefix: string;
}

export function AudioRecorder({ onSaveRecording, onSaveSubliminal, testIdPrefix }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [subliminalVolume, setSubliminalVolume] = useState(0.05);
  const [recordingName, setRecordingName] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }
        audioUrlRef.current = URL.createObjectURL(blob);
        setIsPlaying(false);
        
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        const timestamp = new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        setRecordingName(`Affirmation ${timestamp}`);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordedBlob(null);
    } catch (err) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record affirmations",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const togglePlayback = () => {
    if (!audioUrlRef.current) return;
    
    if (!audioRef.current || audioRef.current.src !== audioUrlRef.current) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrlRef.current);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const saveFileWithPicker = async (blob: Blob, suggestedName: string, extension: string, mimeType: string): Promise<string | null> => {
    try {
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `${suggestedName}.${extension}`,
          types: [{
            description: `${extension.toUpperCase()} Audio File`,
            accept: { [mimeType]: [`.${extension}`] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return handle.name;
      } else {
        // Fallback for browsers without File System Access API
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${suggestedName}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return `${suggestedName}.${extension}`;
      }
    } catch (err) {
      // User cancelled the save dialog
      return null;
    }
  };

  const convertToWav = async (blob: Blob): Promise<Blob> => {
    const audioContext = new AudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioContext.close();
    return audioBufferToWav(audioBuffer);
  };

  const convertToMp3 = async (blob: Blob): Promise<Blob> => {
    const audioContext = new AudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioContext.close();
    return audioBufferToMp3(audioBuffer);
  };

  const handleSaveRecording = async (format: 'webm' | 'wav' | 'mp3') => {
    if (!recordedBlob || !recordingName.trim()) return;
    
    try {
      let blobToSave: Blob;
      let mimeType: string;
      let extension: string;

      if (format === 'wav') {
        blobToSave = await convertToWav(recordedBlob);
        mimeType = 'audio/wav';
        extension = 'wav';
      } else if (format === 'mp3') {
        blobToSave = await convertToMp3(recordedBlob);
        mimeType = 'audio/mpeg';
        extension = 'mp3';
      } else {
        blobToSave = recordedBlob;
        mimeType = 'audio/webm';
        extension = 'webm';
      }

      const savedName = await saveFileWithPicker(blobToSave, recordingName, extension, mimeType);
      
      if (savedName) {
        const file = new File([blobToSave], savedName, { type: mimeType });
        onSaveRecording(file, recordingName);
        toast({ title: "Recording saved", description: `"${savedName}" saved and added to playlist` });
        discardRecording();
      }
    } catch (err) {
      toast({
        title: "Conversion failed",
        description: `Could not convert to ${format.toUpperCase()}`,
        variant: "destructive"
      });
    }
  };

  const handleCreateSubliminal = async () => {
    if (!recordedBlob || !recordingName.trim()) return;
    
    try {
      const audioContext = new AudioContext();
      const arrayBuffer = await recordedBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      
      const gainNode = offlineContext.createGain();
      gainNode.gain.value = subliminalVolume;
      
      source.connect(gainNode);
      gainNode.connect(offlineContext.destination);
      source.start();
      
      const renderedBuffer = await offlineContext.startRendering();
      
      const wavBlob = audioBufferToWav(renderedBuffer);
      const subliminalName = `${recordingName} (Subliminal)`;
      
      // Let user choose where to save the file
      const savedName = await saveFileWithPicker(wavBlob, subliminalName, 'wav', 'audio/wav');
      
      audioContext.close();
      
      if (savedName) {
        // Add to playlist
        const file = new File([wavBlob], savedName, { type: 'audio/wav' });
        onSaveSubliminal(file, subliminalName);
        toast({ 
          title: "Subliminal created", 
          description: `"${savedName}" saved at ${Math.round(subliminalVolume * 100)}% volume` 
        });
        
        // Reset to show record button again
        discardRecording();
      }
    } catch (err) {
      toast({
        title: "Conversion failed",
        description: "Could not create subliminal track",
        variant: "destructive"
      });
    }
  };

  const discardRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setRecordedBlob(null);
    setIsPlaying(false);
    setRecordingName("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Mic className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-white">Record Affirmation</span>
      </div>

      {!recordedBlob ? (
        <div className="flex justify-center">
          <Button
            variant={isRecording ? "destructive" : "default"}
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
            className="gap-2"
            data-testid={`${testIdPrefix}-record-btn`}
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Start Recording
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <input
            type="text"
            value={recordingName}
            onChange={(e) => setRecordingName(e.target.value)}
            placeholder="Name your affirmation..."
            className="w-full bg-transparent border-b border-white/20 pb-1 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            data-testid={`${testIdPrefix}-name-input`}
          />
          
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayback}
              data-testid={`${testIdPrefix}-preview-btn`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <span className="text-xs text-muted-foreground">Preview</span>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!recordingName.trim()}
                  className="gap-1"
                  data-testid={`${testIdPrefix}-save-btn`}
                >
                  <Save className="w-3.5 h-3.5" />
                  Save As
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleSaveRecording('mp3')} data-testid={`${testIdPrefix}-save-mp3`}>
                  <FileAudio className="w-4 h-4 mr-2" />
                  Save as MP3
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSaveRecording('wav')} data-testid={`${testIdPrefix}-save-wav`}>
                  <FileAudio className="w-4 h-4 mr-2" />
                  Save as WAV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSaveRecording('webm')} data-testid={`${testIdPrefix}-save-webm`}>
                  <FileAudio className="w-4 h-4 mr-2" />
                  Save as WebM
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="default"
              size="sm"
              onClick={handleCreateSubliminal}
              disabled={!recordingName.trim()}
              className="gap-1"
              data-testid={`${testIdPrefix}-subliminal-btn`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              Make Subliminal
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={discardRecording}
              className="text-muted-foreground"
              data-testid={`${testIdPrefix}-discard-btn`}
            >
              Discard
            </Button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Volume2 className="w-3 h-3" />
                <span>Subliminal Volume</span>
              </div>
              <span data-testid={`${testIdPrefix}-volume-display`}>{Math.round(subliminalVolume * 100)}%</span>
            </div>
            <Slider
              value={[subliminalVolume]}
              onValueChange={([val]) => setSubliminalVolume(val)}
              min={0.01}
              max={0.2}
              step={0.01}
              data-testid={`${testIdPrefix}-subliminal-volume`}
            />
            <p className="text-[10px] text-muted-foreground text-center">
              Lower = more subliminal (typically 3-10%)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  const samples = buffer.length;
  const dataSize = samples * blockAlign;
  const bufferSize = 44 + dataSize;
  
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);
  
  let offset = 0;
  
  const writeString = (str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
    offset += str.length;
  };
  
  writeString('RIFF');
  view.setUint32(offset, bufferSize - 8, true); offset += 4;
  writeString('WAVE');
  writeString('fmt ');
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, format, true); offset += 2;
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * blockAlign, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bitDepth, true); offset += 2;
  writeString('data');
  view.setUint32(offset, dataSize, true); offset += 4;
  
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  for (let i = 0; i < samples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function audioBufferToMp3(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const kbps = 128;
  
  // Get audio data - convert to mono if stereo for simpler encoding
  let samples: Int16Array;
  
  if (numChannels === 1) {
    const channelData = buffer.getChannelData(0);
    samples = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
  } else {
    // Mix stereo to mono
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    samples = new Int16Array(left.length);
    for (let i = 0; i < left.length; i++) {
      const s = Math.max(-1, Math.min(1, (left[i] + right[i]) / 2));
      samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
  }

  const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, kbps);
  const mp3Data: Int8Array[] = [];
  
  const sampleBlockSize = 1152;
  for (let i = 0; i < samples.length; i += sampleBlockSize) {
    const sampleChunk = samples.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(new Int8Array(mp3buf));
    }
  }
  
  const end = mp3encoder.flush();
  if (end.length > 0) {
    mp3Data.push(new Int8Array(end));
  }

  return new Blob(mp3Data, { type: 'audio/mpeg' });
}
