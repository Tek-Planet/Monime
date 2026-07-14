import { useState } from "react";
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  Square,
  Hand,
  BookOpen,
  Minus,
  Plus,
  X,
  Accessibility,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AccessibilityToolbar() {
  const {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    supported,
    isReadAloudMode,
    setIsReadAloudMode,
    readPageContent,
    rate,
    setRate,
  } = useTextToSpeech();
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!supported) return null;

  const toggleReadAloud = () => {
    if (isReadAloudMode) {
      setIsReadAloudMode(false);
      stop();
    } else {
      setIsReadAloudMode(true);
      speak(t("accessibility.readAloudEnabled") || "Read aloud mode enabled. Click on any element to hear it.");
    }
  };

  const handleReadPage = () => {
    readPageContent();
  };

  const adjustRate = (delta: number) => {
    const newRate = Math.max(0.5, Math.min(2, rate + delta));
    setRate(newRate);
  };

  return (
    <div
      data-accessibility-toolbar
      className={cn(
        "fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2",
        "transition-all duration-300"
      )}
    >
      {/* Expanded Panel */}
      {isExpanded && (
        <div className="bg-card border border-border rounded-xl shadow-lg p-3 flex flex-col gap-2 min-w-[200px] animate-in slide-in-from-bottom-2 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-1 border-b border-border">
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Accessibility className="h-4 w-4 text-primary" />
              {t("accessibility.title") || "Accessibility"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Read Aloud Mode Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isReadAloudMode ? "default" : "outline"}
                size="sm"
                className="w-full justify-start gap-2"
                onClick={toggleReadAloud}
              >
                <Hand className="h-4 w-4" />
                <span className="text-xs">
                  {t("accessibility.tapToRead") || "Tap to Read"}
                </span>
                {isReadAloudMode && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-success animate-pulse" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {t("accessibility.tapToReadDesc") || "Click any element to hear it read aloud"}
            </TooltipContent>
          </Tooltip>

          {/* Read Entire Page */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={handleReadPage}
              >
                <BookOpen className="h-4 w-4" />
                <span className="text-xs">
                  {t("accessibility.readPage") || "Read Page"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {t("accessibility.readPageDesc") || "Read all content on this page"}
            </TooltipContent>
          </Tooltip>

          {/* Playback Controls */}
          {isSpeaking && (
            <div className="flex items-center gap-1 pt-1 border-t border-border">
              {isPaused ? (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resume}>
                  <Play className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={pause}>
                  <Pause className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={stop}>
                <Square className="h-4 w-4" />
              </Button>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {isPaused
                  ? t("accessibility.paused") || "Paused"
                  : t("accessibility.playing") || "Playing..."}
              </span>
            </div>
          )}

          {/* Speed Control */}
          <div className="flex items-center gap-1 pt-1 border-t border-border">
            <span className="text-[10px] text-muted-foreground">
              {t("accessibility.speed") || "Speed"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => adjustRate(-0.1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-xs font-medium min-w-[2rem] text-center">
              {rate.toFixed(1)}x
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => adjustRate(0.1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "h-12 w-12 rounded-full shadow-lg transition-all duration-200",
              isReadAloudMode || isSpeaking
                ? "bg-primary hover:bg-primary-hover"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
            size="icon"
          >
            {isSpeaking && !isPaused ? (
              <Volume2 className={cn("h-5 w-5", isReadAloudMode || isSpeaking ? "text-primary-foreground" : "")} />
            ) : isReadAloudMode ? (
              <Hand className="h-5 w-5 text-primary-foreground" />
            ) : (
              <Accessibility className="h-5 w-5" />
            )}
            {(isReadAloudMode || isSpeaking) && (
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card animate-pulse" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          {t("accessibility.title") || "Accessibility"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
