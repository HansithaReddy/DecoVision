"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface RoomDetails {
  roomWidth: number;
  roomLength: number;
  furniture: string[];
  lightingType: string;
  prompt: string;
}

interface RoomDetailsFormProps {
  value: RoomDetails;
  onChange: (details: RoomDetails) => void;
  disabled?: boolean;
}

const LIGHTING_OPTIONS = [
  { value: "natural", label: "Natural Light" },
  { value: "led", label: "LED" },
  { value: "mixed", label: "Mixed" },
  { value: "ambient", label: "Ambient" },
  { value: "fluorescent", label: "Fluorescent" },
  { value: "halogen", label: "Halogen" },
  { value: "incandescent", label: "Incandescent" },
];

const COMMON_FURNITURE = [
  "Sofa", "Armchair", "Coffee Table", "TV Unit", "Bookshelf",
  "Dining Table", "Dining Chair", "Desk", "Office Chair",
  "Bed", "Wardrobe", "Dresser", "Nightstand", "Plant", "Rug",
];

export function RoomDetailsForm({ value, onChange, disabled }: RoomDetailsFormProps) {
  const [furnitureInput, setFurnitureInput] = useState("");

  const update = (partial: Partial<RoomDetails>) =>
    onChange({ ...value, ...partial });

  const addFurniture = (item: string) => {
    const trimmed = item.trim();
    if (!trimmed || value.furniture.includes(trimmed)) return;
    update({ furniture: [...value.furniture, trimmed] });
    setFurnitureInput("");
  };

  const removeFurniture = (item: string) =>
    update({ furniture: value.furniture.filter((f) => f !== item) });

  return (
    <div className="space-y-4">
      {/* Room dimensions */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Width (m)</Label>
          <Input
            suppressHydrationWarning
            type="number"
            min={1}
            max={30}
            step={0.5}
            value={value.roomWidth}
            onChange={(e) => update({ roomWidth: parseFloat(e.target.value) || 1 })}
            disabled={disabled}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Length (m)</Label>
          <Input
            suppressHydrationWarning
            type="number"
            min={1}
            max={30}
            step={0.5}
            value={value.roomLength}
            onChange={(e) => update({ roomLength: parseFloat(e.target.value) || 1 })}
            disabled={disabled}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Lighting */}
      <div className="space-y-1.5">
        <Label className="text-xs">Lighting Type</Label>
        <Select
          value={value.lightingType}
          onValueChange={(v) => update({ lightingType: v })}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIGHTING_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-sm">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Furniture */}
      <div className="space-y-1.5">
        <Label className="text-xs">Furniture Items</Label>
        <div className="flex gap-2">
          <Input
            suppressHydrationWarning
            placeholder="Add item..."
            value={furnitureInput}
            onChange={(e) => setFurnitureInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFurniture(furnitureInput);
              }
            }}
            disabled={disabled}
            className="h-8 text-sm"
          />
          <Button
            suppressHydrationWarning
            type="button"
            size="sm"
            variant="outline"
            className="h-8 px-2"
            onClick={() => addFurniture(furnitureInput)}
            disabled={disabled || !furnitureInput.trim()}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Quick-add chips */}
        <div className="flex flex-wrap gap-1 pt-1">
          {COMMON_FURNITURE.filter((f) => !value.furniture.includes(f))
            .slice(0, 8)
            .map((f) => (
              <button
                suppressHydrationWarning
                key={f}
                onClick={() => addFurniture(f)}
                disabled={disabled}
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded border px-2 py-0.5 text-xs transition-colors disabled:opacity-50"
              >
                + {f}
              </button>
            ))}
        </div>

        {/* Selected furniture tags */}
        {value.furniture.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {value.furniture.map((item) => (
              <Badge key={item} variant="secondary" className="gap-1 pr-1 text-xs">
                {item}
                <button
                  suppressHydrationWarning
                  onClick={() => removeFurniture(item)}
                  disabled={disabled}
                  className="hover:text-destructive ml-0.5 transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Optional prompt */}
      <div className="space-y-1.5">
        <Label className="text-xs">Design Notes (optional)</Label>
        <Input
          suppressHydrationWarning
          placeholder="e.g. eco-friendly materials, open plan..."
          value={value.prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          disabled={disabled}
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}
