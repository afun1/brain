import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";

const FEATURE_CATEGORIES = {
  "Audio Engines": [
    { id: "binaural-engine", label: "Binaural Beat Generation" },
    { id: "stereo-separation", label: "Stereo Channel Separation" },
    { id: "frequency-transitions", label: "Frequency Transitions" },
  ],
  "Custom Mode": [
    { id: "simple-mode", label: "Simple Mode (Carrier + Beat)" },
    { id: "progression-builder", label: "Progression Builder" },
    { id: "slot-controls", label: "Slot Enable/Disable/Duplicate" },
    { id: "save-load", label: "Save/Load Progressions" },
    { id: "import-export", label: "Import/Export JSON" },
  ],
  "Sleep Mode": [
    { id: "sleep-programs", label: "Pre-built Sleep Programs" },
    { id: "hypnogram", label: "Click-to-Seek Hypnogram" },
    { id: "duration-selection", label: "Duration Selection (5h-10h)" },
    { id: "carrier-slots", label: "Custom Carrier Frequency Slots" },
    { id: "wake-sequence", label: "Beta Wake-Up Sequence" },
  ],
  "Learning Mode": [
    { id: "alpha-theta-states", label: "Alpha/Theta State Selection" },
    { id: "pdf-reader", label: "PDF Reader" },
    { id: "tts-read-mode", label: "TTS Read Mode" },
    { id: "rsvp-mode", label: "RSVP Speed Reading" },
    { id: "page-flash", label: "Page Flash Mode" },
    { id: "tts-learning", label: "Text-to-Speech Learning" },
    { id: "language-learning", label: "Language Learning/Translation" },
  ],
  "Healing Mode": [
    { id: "healing-targets", label: "Healing Target Selection" },
    { id: "healing-carriers", label: "Carrier Frequency Slots" },
    { id: "healing-brainwaves", label: "Brainwave Frequency Slots" },
  ],
  "Daytime Mode": [
    { id: "focus-modes", label: "Focus Modes (Beta/Gamma)" },
    { id: "workout-modes", label: "Workout Modes" },
  ],
  "Audio Players": [
    { id: "background-player", label: "Background Music Player" },
    { id: "affirmations-player", label: "Affirmations Player" },
    { id: "stereo-confusion", label: "Stereo Confusion Player" },
    { id: "drag-drop-playlists", label: "Drag-and-Drop Playlists" },
    { id: "tuning-toggle", label: "A=440Hz/432Hz Tuning Toggle" },
  ],
};

const ISSUE_TYPES = [
  { value: "bug", label: "Bug - Something isn't working right" },
  { value: "suggestion", label: "Suggestion - I have an idea" },
  { value: "confusion", label: "Confusion - I don't understand something" },
  { value: "praise", label: "Praise - Something works great!" },
];

export default function BetaReportPage() {
  const { toast } = useToast();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [issueType, setIssueType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const featureLabel = selectedFeatures.length > 0 
        ? selectedFeatures.join(", ") 
        : "General";
      
      return apiRequest("POST", "/api/feedback", {
        feature: featureLabel,
        issueType: issueType,
        description: description,
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Feedback submitted",
        description: "Thank you for helping improve the app!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };

  const handleSubmit = () => {
    if (!issueType) {
      toast({
        title: "Please select an issue type",
        variant: "destructive",
      });
      return;
    }
    if (!description.trim()) {
      toast({
        title: "Please add a description",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate();
  };

  const resetForm = () => {
    setSelectedFeatures([]);
    setIssueType("");
    setDescription("");
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              Your feedback has been submitted. It helps make the app better for everyone.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={resetForm} data-testid="button-submit-another">
                Submit Another
              </Button>
              <Link href="/">
                <Button data-testid="button-back-to-app">Back to App</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Beta Feedback</h1>
            <p className="text-muted-foreground">Help improve the binaural sleep experience</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Which features are you reporting on?</CardTitle>
              <CardDescription>Select all that apply (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(FEATURE_CATEGORIES).map(([category, features]) => (
                <div key={category}>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {features.map((feature) => (
                      <div key={feature.id} className="flex items-center gap-2">
                        <Checkbox
                          id={feature.id}
                          checked={selectedFeatures.includes(feature.id)}
                          onCheckedChange={() => toggleFeature(feature.id)}
                          data-testid={`checkbox-feature-${feature.id}`}
                        />
                        <Label htmlFor={feature.id} className="text-sm cursor-pointer">
                          {feature.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What type of feedback is this?</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger className="w-full" data-testid="select-issue-type">
                  <SelectValue placeholder="Select a type..." />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} data-testid={`option-${type.value}`}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Describe your experience</CardTitle>
              <CardDescription>
                Tell us what happened, what you expected, or what you'd like to see
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Your feedback..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                data-testid="textarea-description"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Link href="/">
              <Button variant="outline" data-testid="button-cancel">Cancel</Button>
            </Link>
            <Button 
              onClick={handleSubmit} 
              disabled={submitMutation.isPending}
              data-testid="button-submit"
            >
              {submitMutation.isPending ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
