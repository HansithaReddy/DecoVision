"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ImageDropzone } from "@/components/image-dropzone";
import { UploadedImage } from "@/components/uploaded-image";
import { OutputImage } from "@/components/output-image";
import { DesignControls } from "@/components/design-controls";
import { ScorePanel } from "@/components/score-panel";
import { RoomDetailsForm } from "@/components/room-details-form";
import type { RoomDetails } from "@/components/room-details-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import type { RoomType, DesignTheme, GalleryItem } from "@/types";
import type { DesignScoreResult } from "@/lib/design-scorer";

const DEFAULT_ROOM_DETAILS: RoomDetails = {
  roomWidth: 4,
  roomLength: 5,
  furniture: [],
  lightingType: "natural",
  prompt: "",
};

export const GALLERY_KEY = "decovision_gallery";

// Resize a base64 image down to a small thumbnail for localStorage
function createThumbnail(base64: string, maxSize = 400): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // JPEG at 0.7 quality keeps thumbnails under 30KB each
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(base64); // fallback: use original
    img.src = base64;
  });
}

async function saveToGallery(item: GalleryItem) {
  try {
    // Store a small thumbnail — full images are too large for localStorage (5MB limit)
    const thumbnail = await createThumbnail(item.outputImage);
    const galleryItem: GalleryItem = { ...item, outputImage: thumbnail };

    const existing: GalleryItem[] = JSON.parse(
      localStorage.getItem(GALLERY_KEY) ?? "[]"
    );
    localStorage.setItem(
      GALLERY_KEY,
      JSON.stringify([galleryItem, ...existing].slice(0, 50))
    );
  } catch (err) {
    console.warn("Gallery save failed:", err);
  }
}

export default function HomePage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<DesignTheme>("Modern");
  const [selectedRoom, setSelectedRoom] = useState<RoomType>("Living Room");
  const [userPrompt, setUserPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomDetails, setRoomDetails] = useState<RoomDetails>(DEFAULT_ROOM_DETAILS);
  const [scores, setScores] = useState<DesignScoreResult | null>(null);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);

  const handleImageUpload = useCallback((base64: string) => {
    setUploadedImage(base64);
    setOutputImage(null);
    setError(null);
    setScores(null);
    setGenerationDone(false);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setUploadedImage(null);
    setOutputImage(null);
    setError(null);
    setScores(null);
    setGenerationDone(false);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    toast.error(errorMessage);
  }, []);

  const fetchScores = useCallback(
    async (theme: DesignTheme, room: RoomType, details: RoomDetails) => {
      setScoresLoading(true);
      try {
        const res = await fetch("/api/predict-scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomWidth: details.roomWidth,
            roomLength: details.roomLength,
            theme,
            room,
            furniture: details.furniture,
            lightingType: details.lightingType,
            prompt: details.prompt,
          }),
        });
        const data = await res.json();
        if (res.ok) setScores(data);
      } catch {
        // non-critical
      } finally {
        setScoresLoading(false);
      }
    },
    []
  );

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setOutputImage(null);
    setScores(null);
    setGenerationDone(false);

    try {
      const response = await fetch("/api/generate-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: uploadedImage ?? null,
          theme: selectedTheme,
          room: selectedRoom,
          userPrompt,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate design");

      if (data.output && data.output.length > 0) {
        const result = data.output[1] || data.output[0];
        setOutputImage(result);
        setGenerationDone(true);
        toast.success("Design generated successfully!");

        // Save to gallery (async thumbnail creation)
        await saveToGallery({
          id: Date.now().toString(),
          outputImage: result,
          theme: selectedTheme,
          room: selectedRoom,
          userPrompt,
          hasSourceImage: !!uploadedImage,
          createdAt: new Date().toISOString(),
        });

        fetchScores(selectedTheme, selectedRoom, roomDetails);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      handleError(message);
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImage, selectedTheme, selectedRoom, userPrompt, roomDetails, handleError, fetchScores]);

  const isTextOnlyMode = !uploadedImage;

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="leading-relaxed">
            {isTextOnlyMode
              ? "Describe your dream room and let AI bring it to life"
              : "Upload a photo of your room and let AI reimagine it with a new design style"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <DesignControls
            selectedTheme={selectedTheme}
            selectedRoom={selectedRoom}
            onThemeChange={setSelectedTheme}
            onRoomChange={setSelectedRoom}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            isTextOnlyMode={isTextOnlyMode}
          />

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              {isTextOnlyMode ? "Describe your room" : "Additional description (optional)"}
            </Label>
            <Textarea
              suppressHydrationWarning
              placeholder={
                isTextOnlyMode
                  ? "e.g. a cozy living room with a fireplace, large windows, and warm wooden tones..."
                  : "e.g. add more natural light, eco-friendly materials..."
              }
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              disabled={isLoading}
              className="min-h-[80px] resize-none text-sm"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Room Details for Design Analysis</h3>
            <p className="text-muted-foreground text-xs">
              Fill in your room info to get feasibility and sustainability scores after generating.
            </p>
            <RoomDetailsForm
              value={roomDetails}
              onChange={setRoomDetails}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-medium">
            {isTextOnlyMode ? "Room Photo (optional)" : "Original Photo"}
          </h2>
          {uploadedImage ? (
            <UploadedImage src={uploadedImage} onRemove={handleRemoveImage} />
          ) : (
            <ImageDropzone onImageUpload={handleImageUpload} onError={handleError} />
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium">AI Design</h2>
          <OutputImage src={outputImage} isLoading={isLoading} />
        </div>
      </div>

      {generationDone && (scores || scoresLoading) && (
        <ScorePanel scores={scores} isLoading={scoresLoading} />
      )}
    </div>
  );
}
