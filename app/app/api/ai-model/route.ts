import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { logs } = await req.json();

    console.log("Logs: ", logs)

    const systemPrompt = `
You are an AI generating dynamic Prediction Market questions for an autonomous AI-only Among Us game.

You will be provided with a stream of event logs.
Analyze the logs to understand what is currently happening.
Generate exactly 3 intriguing, highly speculative YES/NO prediction questions.

Output ONLY a raw JSON array of strings.
No markdown. No explanations.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.8,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Game logs:\n${logs}` },
        ],
      }),
    });

    console.log("Response: ", response)

    if (!response.ok) {
      const err = await response.text();
      console.error("AI error:", err);
      return NextResponse.json({ error: "AI request failed" }, { status: 500 });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "[]";

    const match = content.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match ? match[0] : content);

    return NextResponse.json({ questions: parsed });
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}