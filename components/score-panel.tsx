"use client";

import { Leaf, LayoutDashboard, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { DesignScoreResult } from "@/lib/design-scorer";

interface ScorePanelProps {
  scores: DesignScoreResult | null;
  isLoading: boolean;
}

function getScoreColor(score: number) {
  if (score >= 75) return "text-green-600 dark:text-green-400";
  if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-500 dark:text-red-400";
}

function getProgressColor(score: number) {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function getScoreBadge(score: number) {
  if (score >= 75) return { label: "High", variant: "default" as const };
  if (score >= 50) return { label: "Moderate", variant: "secondary" as const };
  return { label: "Low", variant: "destructive" as const };
}

function ScoreBar({ label, score, weight, note }: {
  label: string; score: number; weight: number; note: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className={`font-semibold ${getScoreColor(score)}`}>{Math.round(score)}</span>
      </div>
      <div className="bg-primary/10 relative h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full transition-all duration-700 ${getProgressColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-muted-foreground text-xs">{note}</p>
    </div>
  );
}

function ScoreCard({
  title, icon, score, breakdown, accentClass,
}: {
  title: string;
  icon: React.ReactNode;
  score: number;
  breakdown: DesignScoreResult["feasibilityBreakdown"];
  accentClass: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const badge = getScoreBadge(score);

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={accentClass}>{icon}</span>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <span className={`text-2xl font-bold tabular-nums ${getScoreColor(score)}`}>
            {score}
            <span className="text-muted-foreground text-sm font-normal">/100</span>
          </span>
        </div>
      </div>

      {/* Main progress bar */}
      <div className="bg-primary/10 relative h-3 w-full overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Breakdown toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? "Hide" : "Show"} factor breakdown
      </button>

      {/* Breakdown details */}
      {expanded && (
        <div className="space-y-3 pl-1">
          {breakdown.map((f) => (
            <ScoreBar key={f.label} {...f} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ScorePanel({ scores, isLoading }: ScorePanelProps) {
  if (!scores && !isLoading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Design Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="bg-muted h-4 w-32 animate-pulse rounded" />
                <div className="bg-muted h-3 w-full animate-pulse rounded-full" />
              </div>
            ))}
          </div>
        ) : scores ? (
          <>
            <ScoreCard
              title="Feasibility"
              icon={<LayoutDashboard className="h-4 w-4" />}
              score={scores.feasibility}
              breakdown={scores.feasibilityBreakdown}
              accentClass="text-blue-500"
            />

            <Separator />

            <ScoreCard
              title="Sustainability"
              icon={<Leaf className="h-4 w-4" />}
              score={scores.sustainability}
              breakdown={scores.sustainabilityBreakdown}
              accentClass="text-green-500"
            />

            <Separator />

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs leading-relaxed">
                {scores.explanation}
              </p>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
