"use client";

import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { ROOM_TYPES, DESIGN_THEMES } from "@/lib/constants";
import type { RoomType, DesignTheme } from "@/types";
import { Badge } from "@/components/ui/badge";

interface DesignControlsProps {
  selectedTheme: DesignTheme;
  selectedRoom: RoomType;
  onThemeChange: (theme: DesignTheme) => void;
  onRoomChange: (room: RoomType) => void;
  onGenerate: () => void;
  isLoading: boolean;
  isTextOnlyMode: boolean;
}

export function DesignControls({
  selectedTheme,
  selectedRoom,
  onThemeChange,
  onRoomChange,
  onGenerate,
  isLoading,
  isTextOnlyMode,
}: DesignControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
        <div className="flex flex-1 flex-col gap-3">
          <label className="text-sm font-medium">Design Theme</label>
          <Combobox
            options={DESIGN_THEMES}
            value={selectedTheme}
            onValueChange={onThemeChange}
            placeholder="Select theme..."
            searchPlaceholder="Search themes..."
            emptyText="No theme found."
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <label className="text-sm font-medium">Room Type</label>
          <Combobox
            options={ROOM_TYPES}
            value={selectedRoom}
            onValueChange={onRoomChange}
            placeholder="Select room..."
            searchPlaceholder="Search rooms..."
            emptyText="No room found."
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          suppressHydrationWarning
          size="lg"
          onClick={onGenerate}
          disabled={isLoading}
          className="w-full md:w-fit"
        >
          {isLoading ? (
            <>
              <Wand2 className="animate-pulse" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 />
              Generate Design
            </>
          )}
        </Button>

        <Badge variant={isTextOnlyMode ? "secondary" : "default"} className="text-xs">
          {isTextOnlyMode ? "✦ Text-to-Design mode" : "✦ Room Redesign mode"}
        </Badge>
      </div>
    </div>
  );
}
