import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Download, Clock, User, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { LibraryProgression } from "@shared/schema";
import type { ProgressionSlot, SavedProgression } from "./ProgressionBuilder";

const CATEGORIES = ["All", "Sleep", "Power Nap", "Focus", "Meditation", "Healing", "Workout"];

interface CommunityLibraryProps {
  onLoadProgression: (progression: SavedProgression) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommunityLibrary({ onLoadProgression, isOpen, onOpenChange }: CommunityLibraryProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [category, setCategory] = useState("All");
  const [ratingProgression, setRatingProgression] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const { data: progressions = [], isLoading } = useQuery<LibraryProgression[]>({
    queryKey: ['/api/library', category === "All" ? undefined : category],
    queryFn: async () => {
      const url = category === "All" ? "/api/library" : `/api/library?category=${category}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch library");
      return res.json();
    },
    enabled: isOpen,
  });

  const handleDownload = async (progression: LibraryProgression) => {
    try {
      const res = await fetch(`/api/library/${progression.id}`);
      if (!res.ok) throw new Error("Failed to download");
      const data = await res.json();
      
      const slots = data.slots as ProgressionSlot[];
      const savedProgression: SavedProgression = {
        name: data.title,
        slots,
        createdAt: new Date().toISOString(),
        carrierChannel: data.carrierChannel || 'L',
        variance: data.variance || 'higher',
      };
      
      onLoadProgression(savedProgression);
      queryClient.invalidateQueries({ queryKey: ['/api/library'] });
      toast({ title: "Downloaded!", description: `"${data.title}" loaded into Progression Builder.` });
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Download failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const handleRate = async (progressionId: number) => {
    if (!isAuthenticated) {
      toast({ title: "Login required", description: "Please log in to rate progressions." });
      window.location.href = "/api/login";
      return;
    }

    if (selectedRating < 1) return;

    setIsSubmittingRating(true);
    try {
      await apiRequest("POST", `/api/library/${progressionId}/rate`, { rating: selectedRating });
      queryClient.invalidateQueries({ queryKey: ['/api/library'] });
      setRatingProgression(null);
      setSelectedRating(0);
      toast({ title: "Rated!", description: "Thank you for your feedback." });
    } catch (error) {
      toast({ title: "Rating failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const getAverageRating = (progression: LibraryProgression): number => {
    if (!progression.ratingCount || progression.ratingCount === 0) return 0;
    return (progression.ratingSum || 0) / progression.ratingCount;
  };

  const renderStars = (rating: number, interactive = false, onClick?: (r: number) => void) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? "text-yellow-500 fill-yellow-500" 
                : "text-muted-foreground"
            } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            onClick={() => interactive && onClick?.(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Community Library</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Category:</span>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-40" data-testid="select-library-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : progressions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No progressions found. Be the first to share one!
            </div>
          ) : (
            <div className="space-y-3">
              {progressions.map((progression) => (
                <Card key={progression.id} className="border-white/10" data-testid={`library-item-${progression.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{progression.title}</h3>
                        {progression.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {progression.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {progression.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {progression.totalMinutes} min
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {progression.authorName || "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {progression.downloadCount || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {renderStars(Math.round(getAverageRating(progression)))}
                          <span className="text-xs text-muted-foreground">
                            ({progression.ratingCount || 0} ratings)
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleDownload(progression)}
                          data-testid={`button-download-${progression.id}`}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Use
                        </Button>
                        {ratingProgression === progression.id ? (
                          <div className="space-y-2">
                            {renderStars(selectedRating, true, setSelectedRating)}
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setRatingProgression(null);
                                  setSelectedRating(0);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleRate(progression.id)}
                                disabled={selectedRating < 1 || isSubmittingRating}
                              >
                                Rate
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (!isAuthenticated) {
                                toast({ title: "Login required", description: "Please log in to rate progressions." });
                                window.location.href = "/api/login";
                                return;
                              }
                              setRatingProgression(progression.id);
                            }}
                            data-testid={`button-rate-${progression.id}`}
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Rate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
