import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  const req = await request.json();
  const image: string | null = req.image ?? null; // optional — null for text-only mode
  const theme: string = req.theme;
  const room: string = req.room;
  const userPrompt: string = req.userPrompt ?? "";

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not set." }, { status: 500 });
  }

  const client = new OpenAI({ apiKey });

  const basePrompt = `A beautifully designed ${room} in ${theme} style.
${userPrompt ? userPrompt + ". " : ""}Editorial interior photography, symmetrical composition,
natural light, ultra-detailed, photorealistic, award-winning, 4k quality.`;

  try {
    if (image) {
      // ── Image editing mode: transform the uploaded room photo ──
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
      const mimeType = (mimeMatch?.[1] ?? "image/jpeg") as "image/jpeg" | "image/png" | "image/webp";
      const buffer = Buffer.from(base64Data, "base64");
      const file = new File([buffer], "room.jpg", { type: mimeType });

      const editPrompt = `Redesign this ${room} in a ${theme} interior style.
${userPrompt ? userPrompt + ". " : ""}Keep the exact same room layout and perspective.
Professional editorial interior photography, natural light, ultra-detailed, photorealistic, 4k.`;

      const response = await client.images.edit({
        model: "gpt-image-1",
        image: file,
        prompt: editPrompt,
        size: "1024x1024",
      });

      const b64 = response.data?.[0]?.b64_json;
      if (!b64) return NextResponse.json({ error: "No image returned from OpenAI." }, { status: 500 });
      return NextResponse.json({ output: [`data:image/png;base64,${b64}`] }, { status: 201 });

    } else {
      // ── Text-only mode: generate a room from scratch ──
      const response = await client.images.generate({
        model: "gpt-image-1",
        prompt: basePrompt,
        size: "1024x1024",
        n: 1,
      });

      const b64 = response.data?.[0]?.b64_json;
      if (!b64) return NextResponse.json({ error: "No image returned from OpenAI." }, { status: 500 });
      return NextResponse.json({ output: [`data:image/png;base64,${b64}`] }, { status: 201 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("OpenAI error:", message);
    return NextResponse.json({ error: `Image generation failed: ${message}` }, { status: 500 });
  }
}
