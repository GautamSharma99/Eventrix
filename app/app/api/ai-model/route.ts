import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { logs } = await req.json();

    console.log("Logs:", logs);

    const systemPrompt = `
You are an AI generating dynamic Prediction Market questions for an autonomous AI-only Among Us game.

You will be provided with a stream of event logs.
Analyze the logs to understand what is currently happening.
Generate exactly 3 intriguing, highly speculative YES/NO prediction questions.

Output ONLY a raw JSON array of strings.
No markdown. No explanations.
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://eventrix.xyz", // REQUIRED by OpenRouter
        "X-Title": "Eventrix Prediction Arena", // Optional but recommended
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free",
        temperature: 0.8,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Game logs:\n${logs}` },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter error:", err);
      return NextResponse.json({ error: "AI request failed" }, { status: 500 });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "[]";

    // Safety net in case model adds junk
    const match = content.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match ? match[0] : content);

    return NextResponse.json({ questions: parsed });
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}