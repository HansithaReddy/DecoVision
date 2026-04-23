"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { saveAs } from "file-saver";
import { Download, Trash2, Images, ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { GalleryItem } from "@/app/(main)/page";

const GALLERY_KEY = "decovision_gallery";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(GALLERY_KEY) ?? "[]");
      setItems(stored);
    } catch {
      setItems([]);
    }
    setLoaded(true);
  }, []);

  const handleDownload = (item: GalleryItem) => {
    saveAs(item.outputImage, `decovision-${item.theme}-${item.room}-${item.id}.png`);
  };

  const handleDelete = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    localStorage.setItem(GALLERY_KEY, JSON.stringify(updated));
    toast.success("Design removed from gallery.");
  };

  const handleClearAll = () => {
    setItems([]);
    localStorage.removeItem(GALLERY_KEY);
    toast.success("Gallery cleared.");
  };

  if (!loaded) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-muted aspect-[4/3] animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Images className="text-primary h-5 w-5" />
          <h1 className="text-xl font-semibold">My Gallery</h1>
          {items.length > 0 && (
            <Badge variant="secondary">{items.length} design{items.length !== 1 ? "s" : ""}</Badge>
          )}
        </div>
        {items.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Clear all
          </Button>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <Card className="border-muted-foreground/25 border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
            <ImageIcon className="text-muted-foreground h-12 w-12" />
            <div className="text-center">
              <p className="font-semibold">No designs yet</p>
              <p className="text-muted-foreground text-sm">
                Generate a design on the Design page — it will automatically appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid */}
      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="group overflow-hidden">
              <CardContent className="relative p-0">
                {/* Image */}
                <div className="relative aspect-[4/3]">
                  <Image
                    src={item.outputImage}
                    alt={`${item.theme} ${item.room}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <div className="flex gap-1.5">
                      <Badge className="bg-black/70 text-xs text-white hover:bg-black/70">
                        {item.theme}
                      </Badge>
                      <Badge className="bg-black/70 text-xs text-white hover:bg-black/70">
                        {item.room}
                      </Badge>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7"
                        onClick={() => handleDownload(item)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-7 w-7"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="space-y-0.5 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {item.theme} {item.room}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {item.hasSourceImage ? "Redesign" : "Text-to-Design"}
                    </Badge>
                  </div>
                  {item.userPrompt && (
                    <p className="text-muted-foreground truncate text-xs">{item.userPrompt}</p>
                  )}
                  <p className="text-muted-foreground text-xs">{formatDate(item.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
