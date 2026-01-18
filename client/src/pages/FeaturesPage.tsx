import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Headphones,
  Moon,
  Sun,
  Brain,
  Music,
  Mic,
  Shuffle,
  Repeat,
  Volume2,
  Sliders,
  Play,
  Download,
} from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container flex items-center gap-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back-home">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-foreground">Features & Instructions</h1>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-73px)]">
        <main className="container py-8 space-y-8 max-w-4xl">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Headphones className="h-6 w-6 text-primary" />
              What Are Binaural Beats?
            </h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">
                  Binaural beats are an auditory illusion created when you hear two slightly different frequencies in each ear. 
                  Your brain perceives a third tone - the "beat" - equal to the difference between the two frequencies.
                </p>
                <p className="text-muted-foreground">
                  For example, if your left ear hears 200 Hz and your right ear hears 204 Hz, your brain perceives a 4 Hz beat. 
                  This can help guide your brainwaves into specific states associated with relaxation, focus, or sleep.
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground">Important: Use stereo headphones for binaural beats to work properly!</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Brainwave States
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Delta (0.5-4 Hz)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Deep, dreamless sleep and healing. Used in sleep programs for restorative rest.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Theta (4-8 Hz)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Light sleep, deep relaxation, meditation, and creativity. Great for winding down.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Alpha (8-12 Hz)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Relaxed alertness, calm focus, and light meditation. Ideal for stress relief.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Beta (15-30 Hz)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Active thinking, focus, and concentration. Perfect for work and study sessions.</p>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Gamma (30+ Hz)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Peak performance, heightened perception, and cognitive processing. Used for flow states.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sliders className="h-6 w-6 text-primary" />
              Console Modes
            </h2>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="h-5 w-5" />
                  Custom Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">Create your own binaural beat experience with full control:</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                  <li><strong>Carrier Frequency (60-1000 Hz):</strong> The base tone you hear. Includes Solfeggio frequency presets (174, 285, 396, 417, 432, 528, 639, 741, 852, 963 Hz)</li>
                  <li><strong>Beat Frequency (0.5-40 Hz):</strong> The difference between ears that creates the binaural effect. Lower = more relaxed, higher = more alert</li>
                  <li><strong>Swap Carrier:</strong> Switch which ear receives the higher frequency</li>
                  <li><strong>Channel Controls:</strong> Mute left or right ear to hear just one tone (no binaural effect)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Learning Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">Designed for meditation and relaxation:</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                  <li><strong>Alpha (8-12 Hz):</strong> Relaxed focus, light meditation</li>
                  <li><strong>Theta (4-8 Hz):</strong> Deep meditation, creativity</li>
                  <li><strong>Wind-Down Option:</strong> Gradually transitions from alert beta (15 Hz) to your target state</li>
                  <li><strong>Duration Options:</strong> 10, 15, 20, 30, 45, or 60 minutes</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5" />
                  Daytime Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">Boost focus and alertness during work:</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                  <li><strong>Beta (20 Hz):</strong> Sustained concentration for focused work</li>
                  <li><strong>Gamma (40-42 Hz):</strong> Peak flow state for demanding tasks</li>
                  <li><strong>Ramp-Up Option:</strong> Gradually increases from low beta (12 Hz) to target</li>
                  <li><strong>Duration Options:</strong> 15, 25, 45, 60, 90, or 120 minutes</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5" />
                  Sleep Programs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">Pre-built journeys for sleep:</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                  <li><strong>90-Minute Sleep Cycle:</strong> One complete sleep cycle from awake to deep sleep and back</li>
                  <li><strong>8-Hour Full Night:</strong> Complete night's rest with all sleep stages</li>
                  <li><strong>8-Hour Solfeggio Journey:</strong> Full night using healing Solfeggio frequencies through each chakra</li>
                </ul>
                <p className="text-sm text-muted-foreground">Each program displays current stage, progress, and remaining time.</p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Music className="h-6 w-6 text-primary" />
              Audio Players
            </h2>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Background Music Player
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">Add ambient music to complement your binaural beats:</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                  <li>Drag and drop audio files or click to browse</li>
                  <li>Reorder tracks by dragging within the playlist</li>
                  <li><strong>A=440/432 Hz Toggle:</strong> Switch between standard tuning and "natural" 432 Hz tuning</li>
                  <li>Export playlist as .m3u or .pls files</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Affirmations Player
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">Record and play personal affirmations:</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                  <li>All features from Background Music player</li>
                  <li><strong>Record Button:</strong> Record your own voice affirmations</li>
                  <li><strong>Subliminal Mode:</strong> Convert recordings to barely-audible volume (1-20%, default 5%)</li>
                  <li>Recordings are saved as WAV files in your playlist</li>
                </ul>
                <div className="bg-muted/50 rounded-lg p-4 mt-2">
                  <p className="text-sm text-foreground">Note: Recordings exist only in your browser session and are lost on page refresh.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Stereo Confusion Player
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">Play different audio in each ear for enhanced effects:</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                  <li>Separate playlists for left and right ears</li>
                  <li>Independent per-channel volume controls plus master volume</li>
                  <li>Synchronized playback controls</li>
                  <li>Creates a "stereo confusion" effect that can deepen relaxation</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Volume2 className="h-6 w-6 text-primary" />
              Player Controls
            </h2>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <Shuffle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Shuffle</h3>
                    <p className="text-sm text-muted-foreground">
                      Randomizes playlist order. Activates after the current playlist cycle completes, 
                      so your current sequence finishes before shuffling begins.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <Repeat className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Loop Modes</h3>
                    <p className="text-sm text-muted-foreground">
                      Cycles through three states: Off (play once) → Playlist Loop (repeat all) → Track Loop (repeat current track).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <Play className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Playback</h3>
                    <p className="text-sm text-muted-foreground">
                      Standard play/pause, next/previous track, and seek controls. 
                      Previous button restarts current track if more than 3 seconds in.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Download className="h-6 w-6 text-primary" />
              Install as App
            </h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">
                  This is a Progressive Web App (PWA) that can be installed on your device for offline use:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                  <li><strong>Desktop:</strong> Look for the install icon in your browser's address bar, or use the browser menu</li>
                  <li><strong>iOS:</strong> Tap the Share button, then "Add to Home Screen"</li>
                  <li><strong>Android:</strong> Tap the menu button, then "Install App" or "Add to Home Screen"</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Once installed, the app works offline and launches like a native application.
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Solfeggio Frequencies Reference</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="font-medium">174 Hz</span>
                    <span className="text-sm text-muted-foreground">Foundation - Security & Stability</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="font-medium">285 Hz</span>
                    <span className="text-sm text-muted-foreground">Healing - Tissue Restoration</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="font-medium">396 Hz</span>
                    <span className="text-sm text-muted-foreground">Root Chakra - Release Fear</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="font-medium">417 Hz</span>
                    <span className="text-sm text-muted-foreground">Sacral - Break Negative Patterns</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="font-medium">432 Hz</span>
                    <span className="text-sm text-muted-foreground">Universal Harmony - Natural Tuning</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="font-medium">528 Hz</span>
                    <span className="text-sm text-muted-foreground">Love Frequency - DNA Repair</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="font-medium">639 Hz</span>
                    <span className="text-sm text-muted-foreground">Heart Chakra - Relationships</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="font-medium">741 Hz</span>
                    <span className="text-sm text-muted-foreground">Throat - Clarity & Awakening</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="font-medium">852 Hz</span>
                    <span className="text-sm text-muted-foreground">Third Eye - Intuition</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="font-medium">963 Hz</span>
                    <span className="text-sm text-muted-foreground">Crown Chakra - Cosmic Connection</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <div className="pt-4 pb-8">
            <Link href="/">
              <Button className="w-full" size="lg" data-testid="button-start-session">
                <Play className="h-5 w-5 mr-2" />
                Start Your Session
              </Button>
            </Link>
          </div>
        </main>
      </ScrollArea>
    </div>
  );
}
