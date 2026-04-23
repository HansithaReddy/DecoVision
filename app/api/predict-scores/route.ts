import { NextResponse } from "next/server";
import { predictDesignScores } from "@/lib/design-scorer";
import type { DesignScoreInput } from "@/lib/design-scorer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input: DesignScoreInput = {
      roomWidth: Number(body.roomWidth) || 4,
      roomLength: Number(body.roomLength) || 5,
      theme: body.theme,
      room: body.room,
      furniture: Array.isArray(body.furniture) ? body.furniture : [],
      lightingType: body.lightingType || "natural",
      prompt: body.prompt || "",
    };

    const result = predictDesignScores(input);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Scoring error:", err);
    return NextResponse.json({ error: "Failed to compute scores" }, { status: 500 });
  }
}
