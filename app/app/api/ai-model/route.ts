import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { logs } = await req.json();
    console.log("Logs:", logs);

    const systemPrompt = `You are an AI generating dynamic Prediction Market questions for an autonomous AI-only Among Us game. 
You will be provided with a stream of event logs. 
Analyze the logs to understand what is currently happening (e.g. who is dying, who is suspected, etc.). 
Generate exactly 3 intriguing, highly speculative YES/NO prediction questions based on the characters and situations present in the logs. 
Output ONLY a raw JSON array of strings containing your questions. No markdown framing, no backticks, no introductions.

Example output:
[
  "Will Red survive this round?",
  "Will the Imposter kill Blue next?",
  "Is Green going to be ejected in the next meeting?"
]`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
      model: 'z-ai/glm-4.5-air:free',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Game logs:\n${logs}`,
        },
      ],
    }),
  });

  console.log("OpenRouter API response:", response);

    if (!response.ok) {
        const err = await response.text();
        console.error("OpenRouter API error:", err);
        return NextResponse.json({ error: "Failed fetching from AI" }, { status: 500 });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim() || "[]";
    
    // Attempt to extract the JSON array in case the LLM wrapped it in markdown
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
    const cleanedContent = jsonMatch ? jsonMatch[0] : rawContent;
    
    let questions = [];
    try {
        questions = JSON.parse(cleanedContent);
    } catch (parseErr) {
        console.error("Failed to parse AI output:", cleanedContent);
        return NextResponse.json({ error: "Invalid AI format" }, { status: 500 });
    }

    console.log("AI Generated Questions:", questions);
    return NextResponse.json({ questions });

  } catch (err: any) {
    console.error("API Route Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}