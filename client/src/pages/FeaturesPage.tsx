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
  BookOpen,
  Languages,
  Zap,
  FastForward,
  Heart,
  BookMarked,
  FileText,
  Clock,
  Dumbbell,
  Sparkles,
  MousePointerClick,
  Share2,
  Library,
  MessageSquarePlus,
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
                
                <div className="mt-4 space-y-3 border-t pt-3">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Sliders className="h-4 w-4" />
                    Progression Builder (30 Slots)
                  </h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li><strong>30 Frequency Slots:</strong> Build complex progressions that transition through different frequencies over time</li>
                    <li><strong>Carrier & Beat Per Slot:</strong> Set unique carrier frequency and beat for each slot with custom duration</li>
                    <li><strong>Save/Load:</strong> Save your progressions locally and load them anytime</li>
                    <li><strong>Import/Export:</strong> Export progressions as JSON files to share or backup</li>
                    <li><strong>Community Library:</strong> Share your progressions with others or download community-created ones</li>
                  </ul>
                </div>
                
                <div className="mt-4 space-y-3 border-t pt-3">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Community Library
                  </h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li><strong>Browse Library:</strong> Discover progressions shared by other users</li>
                    <li><strong>Filter by Category:</strong> Sleep, Power Nap, Focus, Meditation, Healing, Workout</li>
                    <li><strong>Ratings & Downloads:</strong> See community ratings (1-5 stars) and download counts</li>
                    <li><strong>Share Your Work:</strong> Share your custom progressions with the community (login required)</li>
                    <li><strong>Anonymous Sharing:</strong> Option to share without displaying your name (great for professionals)</li>
                    <li><strong>One-Click Download:</strong> Load any shared progression directly into your Progression Builder</li>
                  </ul>
                </div>
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
                <p className="text-muted-foreground">Comprehensive learning enhancement with multiple tools:</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                  <li><strong>Alpha (8-12 Hz):</strong> Relaxed focus, ideal for reading with eyes open (research-backed)</li>
                  <li><strong>Theta (4-8 Hz):</strong> Deep meditation, creativity, subconscious learning</li>
                  <li><strong>Wind-Down Option:</strong> Gradually transitions from alert beta (15 Hz) to your target state</li>
                  <li><strong>Duration Options:</strong> 10, 15, 20, 30, 45, or 60 minutes</li>
                </ul>
                
                <div className="mt-4 space-y-3 border-t pt-3">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    PDF Reader with Multiple Reading Modes
                  </h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li><strong>Load PDFs:</strong> Drag-and-drop or click to browse for PDF documents</li>
                    <li><strong>Word Lookup:</strong> Click any word to see its definition, phonetics, pronunciation audio, examples, and synonyms</li>
                    <li><strong>TTS Read Mode:</strong> Text-to-speech with synchronized word highlighting (flash effect), adjustable speed 0.5x-5x for dyslexia support</li>
                    <li><strong>RSVP Mode:</strong> Rapid Serial Visual Presentation - words flash center-screen at 100-3000 WPM with chunk options (1-5 words)</li>
                    <li><strong>Page Flash Mode:</strong> PhotoReading-style subliminal absorption - pages auto-flip at 0.1-3 seconds per page for peripheral vision learning</li>
                  </ul>
                </div>
                
                <div className="mt-4 space-y-3 border-t pt-3">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Text-to-Speech Learning
                  </h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li>Paste text from books or articles</li>
                    <li>Convert to audio via OpenAI TTS with 6 voice options</li>
                    <li>Play at accelerated speeds (0.5x-10x) for enhanced learning in Alpha/Theta states</li>
                  </ul>
                </div>
                
                <div className="mt-4 space-y-3 border-t pt-3">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    Language Learning
                  </h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li><strong>Translation:</strong> Enter English text, translate to 24+ languages (Spanish, French, German, Japanese, Chinese, etc.)</li>
                    <li><strong>Bilingual Audio:</strong> Hear foreign language sentence first, then English translation</li>
                    <li><strong>Configurable Pauses:</strong> 0.5-5 seconds between sentences for repetition practice</li>
                    <li><strong>Speed Control:</strong> Adjust playback 0.5x-3x for pronunciation learning</li>
                    <li><strong>Visual Highlighting:</strong> See which sentence is currently playing (original vs translation)</li>
                    <li><strong>6 Voice Options:</strong> Alloy, Echo, Fable, Onyx, Nova, Shimmer</li>
                  </ul>
                </div>
                
                <div className="mt-4 space-y-3 border-t pt-3">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Headphones className="h-4 w-4" />
                    Audiobook Player
                  </h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li>Load audiobook files for listening while in Alpha/Theta states</li>
                    <li>Adjustable playback speed and volume</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Healing Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">Deep delta frequencies for cellular repair and recovery:</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                  <li><strong>Restoration (3 Hz):</strong> General recovery and immune support</li>
                  <li><strong>Deep Healing (1.5 Hz):</strong> Maximum tissue repair and regeneration</li>
                  <li><strong>Pain Relief (2 Hz):</strong> Cortisol reduction and pain management</li>
                  <li><strong>Wind-Down Option:</strong> Alpha (10 Hz) → Theta (6 Hz) → Target delta</li>
                  <li><strong>Duration Options:</strong> 30, 45, 60, 90, or 120 minutes</li>
                </ul>
                
                <div className="mt-4 space-y-3 border-t pt-3">
                  <h4 className="font-medium text-foreground">Customizable Frequency Systems</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li><strong>10-Slot Carrier System:</strong> Define Solfeggio frequencies (60-1000 Hz) with per-slot durations</li>
                    <li><strong>10-Slot Brainwave System:</strong> Define delta frequencies (0.5-4 Hz) with per-slot durations</li>
                    <li><strong>"Fill Solfeggio" Preset:</strong> Loads all 10 healing frequencies automatically</li>
                    <li><strong>"Fill Delta" Preset:</strong> Cycles through therapeutic delta range</li>
                    <li><strong>Visual Time Coverage:</strong> See how your frequencies map to the session duration</li>
                  </ul>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 mt-2">
                  <p className="text-sm text-foreground">Based on 2024 research: minimum 20-30 minute sessions, 7+ days for measurable healing benefits.</p>
                </div>
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
                <p className="text-muted-foreground">Boost focus and alertness during work or workouts:</p>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Focus Modes</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li><strong>Beta (20 Hz):</strong> Sustained concentration for focused work</li>
                    <li><strong>Gamma (40-42 Hz):</strong> Peak flow state for demanding tasks</li>
                  </ul>
                </div>
                
                <div className="mt-4 space-y-3 border-t pt-3">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Dumbbell className="h-4 w-4" />
                    Workout Modes
                  </h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li><strong>Pre-Workout (15-25 Hz):</strong> Progressive energy build-up before exercise</li>
                    <li><strong>Cardio (22 Hz):</strong> Sustained beta for endurance activities</li>
                    <li><strong>HIIT/Strength (38-40 Hz):</strong> Alternating high/low intensity intervals</li>
                    <li><strong>Recovery (10 Hz):</strong> Alpha waves for between sets or cooldown</li>
                  </ul>
                </div>
                
                <div className="mt-4 space-y-3 border-t pt-3">
                  <h4 className="font-medium text-foreground">Options</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li><strong>Ramp-Up Option:</strong> Gradually increases from low beta (12 Hz) to target</li>
                    <li><strong>Duration Options:</strong> 15, 25, 45, 60, 90, or 120 minutes</li>
                  </ul>
                </div>
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
                <p className="text-muted-foreground">Pre-built journeys for sleep based on circadian rhythm research:</p>
                
                <div className="mt-4 space-y-3 border-t pt-3">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Dynamic Sleep Duration
                  </h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li><strong>5-10 Hour Options:</strong> Choose duration based on your needs (maps to 3-6 optimal sleep cycles)</li>
                    <li><strong>True REM Wake-Up:</strong> All durations end in REM state (9 Hz) for refreshed wake-up from dreams</li>
                    <li><strong>Final Dreams Stage:</strong> 10-minute final REM ensures you wake from dream state, not theta</li>
                    <li><strong>Proportional Scaling:</strong> Stage durations automatically scaled to selected duration</li>
                  </ul>
                </div>
                
                <div className="mt-4 space-y-3 border-t pt-3">
                  <h4 className="font-medium text-foreground">Available Programs</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li><strong>8-Hour Full Night Rest:</strong> Complete night with customizable 10-slot carrier frequency system</li>
                    <li><strong>8-Hour Solfeggio Healing Cycles:</strong> All 10 Solfeggio frequencies mapped to 5 sleep cycles</li>
                  </ul>
                </div>
                
                <div className="mt-4 space-y-3 border-t pt-3">
                  <h4 className="font-medium text-foreground">Customizable Carrier Frequencies</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li><strong>10 Frequency Slots:</strong> Define your own carrier frequencies (60-1000 Hz)</li>
                    <li><strong>Per-Slot Duration:</strong> Set how long each frequency plays</li>
                    <li><strong>Visual Time Coverage:</strong> Colored meter shows frequency distribution</li>
                    <li><strong>"Fill Solfeggio" Preset:</strong> Auto-load all 10 Solfeggio frequencies</li>
                    <li><strong>Settings Persistence:</strong> Your preferences saved to localStorage</li>
                  </ul>
                </div>
                
                <div className="mt-4 space-y-3 border-t pt-3">
                  <h4 className="font-medium text-foreground">Optional Wake-Up Sequence (+17 min)</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li><strong>Dream Fade:</strong> Gentle REM→Alpha transition (2 min, 9→10 Hz)</li>
                    <li><strong>Progressive Beta:</strong> Low Beta (10→14), Mid Beta (14→18), Alert (18→20 Hz)</li>
                  </ul>
                </div>
                
                <div className="mt-4 space-y-3 border-t pt-3">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <MousePointerClick className="h-4 w-4" />
                    Interactive Hypnogram (All Modes)
                  </h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li><strong>Click-to-Seek:</strong> Click anywhere on the hypnogram chart to jump to that time position</li>
                    <li><strong>Hover Preview:</strong> Hover over the chart to see time and stage at that position</li>
                    <li><strong>Real-time Indicator:</strong> Vertical line shows current playback position</li>
                    <li><strong>Available in All Modes:</strong> Learning, Daytime, Healing, and Sleep Programs all have interactive hypnograms</li>
                  </ul>
                </div>
                
                <p className="text-sm text-muted-foreground mt-4">Hypnogram chart displays current stage, progress, and remaining time with real-time indicator.</p>
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
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-primary" />
              Exercise & Workout Frequencies
            </h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">
                  Research-backed binaural beat frequencies for enhancing athletic performance:
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="font-medium text-foreground">High-Intensity Training</div>
                    <div className="text-sm text-primary font-semibold">15-30 Hz (Beta)</div>
                    <div className="text-xs text-muted-foreground">Use 15-20 min before workout for energy and focus</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="font-medium text-foreground">Peak Focus & Flow</div>
                    <div className="text-sm text-primary font-semibold">30-40 Hz (Low Gamma)</div>
                    <div className="text-xs text-muted-foreground">Before agility drills, sprints, or skill work</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="font-medium text-foreground">Inter-Set Recovery</div>
                    <div className="text-sm text-primary font-semibold">8-15 Hz (Alpha/Low Beta)</div>
                    <div className="text-xs text-muted-foreground">During rest periods between sets</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="font-medium text-foreground">Pre-Competition Calm</div>
                    <div className="text-sm text-primary font-semibold">6-10 Hz (Alpha/Low Theta)</div>
                    <div className="text-xs text-muted-foreground">10-15 min before high-pressure events</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="font-medium text-foreground">Post-Workout Recovery</div>
                    <div className="text-sm text-primary font-semibold">4-8 Hz (Theta)</div>
                    <div className="text-xs text-muted-foreground">After training to reduce mental fatigue</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="font-medium text-foreground">Deep Sleep Recovery</div>
                    <div className="text-sm text-primary font-semibold">2-4 Hz (Delta)</div>
                    <div className="text-xs text-muted-foreground">Nighttime for muscle repair and growth</div>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 mt-2">
                  <p className="text-sm text-foreground">
                    <strong>Pro Tip:</strong> A 15-minute Beta (15-30 Hz) session before cardio has been shown to improve maximal aerobic performance. Use Daytime Mode for workout sessions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Optimal Affirmation & Subliminal Frequencies
            </h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">
                  Best frequencies for subconscious reprogramming with affirmations:
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="p-3 rounded-lg bg-muted/50 border-l-4 border-primary">
                    <div className="font-medium text-foreground">Alpha-Theta Border (OPTIMAL)</div>
                    <div className="text-sm text-primary font-semibold">7-8 Hz</div>
                    <div className="text-xs text-muted-foreground">Best for visualization & mind programming while awake</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border-l-4 border-primary">
                    <div className="font-medium text-foreground">Theta (Deep Programming)</div>
                    <div className="text-sm text-primary font-semibold">4-7 Hz</div>
                    <div className="text-xs text-muted-foreground">Ideal for subconscious reprogramming & emotional healing</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="font-medium text-foreground">Alpha (Relaxed Learning)</div>
                    <div className="text-sm text-primary font-semibold">8-14 Hz</div>
                    <div className="text-xs text-muted-foreground">General affirmations, stress reduction, light meditation</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="font-medium text-foreground">Delta (Sleep Programming)</div>
                    <div className="text-sm text-primary font-semibold">2-3 Hz</div>
                    <div className="text-xs text-muted-foreground">Deep unconscious reprogramming during sleep</div>
                  </div>
                </div>
                
                <div className="mt-4 space-y-3 border-t pt-3">
                  <h4 className="font-medium text-foreground">Recommended Carrier Frequencies for Affirmations</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li><strong>432 Hz:</strong> Universal harmony, relaxation (most popular for affirmations)</li>
                    <li><strong>528 Hz:</strong> Transformation, DNA repair, increased energy</li>
                    <li><strong>396 Hz:</strong> Release emotional blockages, guilt, and fear</li>
                    <li><strong>417 Hz:</strong> Facilitate change, clear trauma</li>
                  </ul>
                </div>
                
                <div className="mt-4 space-y-3 border-t pt-3">
                  <h4 className="font-medium text-foreground">Recommended Setups</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Manifestation/Visualization:</strong> 7-8 Hz beat + 528 Hz carrier (use Learning Mode with Theta)</p>
                    <p><strong>Sleep Programming:</strong> 2-3 Hz beat + 432 Hz carrier (use Healing Mode or Sleep Programs)</p>
                    <p><strong>Confidence/Performance:</strong> 10-12 Hz beat + 528 Hz carrier (use Learning Mode with Alpha)</p>
                    <p><strong>General Reprogramming:</strong> 6-7 Hz beat + 432 Hz carrier (use Healing Mode or Custom)</p>
                  </div>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 mt-2">
                  <p className="text-sm text-foreground">
                    <strong>Best Practice:</strong> Listen for 90+ minutes daily for 30-90 days for lasting results. Use the Affirmations Player to record your own at 1-5% subliminal volume.
                  </p>
                </div>
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

          <Separator />

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <MessageSquarePlus className="h-6 w-6 text-primary" />
              Feedback & Feature Requests
            </h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">
                  Your feedback helps shape the future of this app! Visit the Beta Feedback page to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                  <li><strong>Report Bugs:</strong> Let us know if something isn't working correctly</li>
                  <li><strong>Share Suggestions:</strong> Tell us what could be improved</li>
                  <li><strong>Request Features:</strong> Describe new features you'd like to see</li>
                  <li><strong>Give Praise:</strong> Let us know what's working great!</li>
                </ul>
                <div className="pt-2">
                  <Link href="/feedback">
                    <Button variant="outline" data-testid="button-go-to-feedback">
                      <MessageSquarePlus className="h-4 w-4 mr-2" />
                      Submit Feedback
                    </Button>
                  </Link>
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
