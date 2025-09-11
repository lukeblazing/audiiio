import OpenAI, { toFile } from "openai";
import crypto from 'crypto';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateDailyMorningPoem(opts = {}) {
  const {
    theme = "gentle focus and bright optimism",
    lines = 4,
    timezone = "America/Chicago",
  } = opts;

  // Compute date key in given timezone
  const todayLocal = new Date().toLocaleString("en-US", { timeZone: timezone });
  const d = new Date(todayLocal);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const dateKey = `${yyyy}-${mm}-${dd}`;

  const salt = process.env.POEM_SALT ?? "default-salt";
  const poemId = crypto.createHash("sha256")
    .update(`${dateKey}:${salt}`)
    .digest("hex")
    .slice(0, 12);

  // iOS tends to truncate notification bodies after ~178 visible chars.
  // We'll target 170 as a safety buffer, then hard-cap at 178.
  const IOS_VISIBLE_SOFT_LIMIT = 170;
  const IOS_VISIBLE_HARD_LIMIT = 178;

  const instructions = `
You are a poet. For ${dateKey}, write a fresh morning love poem for Chelsy.
Tone: warm, vivid, no clichés. Close with a crisp sensory image mentioning Chelsy and her beauty.
Format: ${lines} very short lines. TOTAL ≤ ${IOS_VISIBLE_SOFT_LIMIT} characters (including line breaks).
Use internal seed poem_id=${poemId} to vary metaphors.
`.trim();

  const userPrompt = `Morning theme: ${theme}. Keep it within ${IOS_VISIBLE_SOFT_LIMIT} characters total.`;

  const resp = await client.responses.create({
    model: "gpt-5",
    instructions,
    input: userPrompt,
  });

  // Normalize whitespace and enforce hard limit without breaking mid-word/line if possible.
  const normalize = (s) =>
    s
      .replace(/\r/g, "")              // unify newlines
      .replace(/[ \t]+\n/g, "\n")      // trim line-end spaces
      .replace(/\n{3,}/g, "\n\n")      // collapse excessive blank lines
      .trim();

  const trimToLimit = (s, max) => {
    if (s.length <= max) return s;
    const cut = s.slice(0, max);
    const lastBreak = Math.max(cut.lastIndexOf("\n"), cut.lastIndexOf(" "));
    const candidate = lastBreak > 0 ? cut.slice(0, lastBreak) : cut;
    return candidate.trim();
  };

  let text = normalize(resp.output_text || "");
  text = trimToLimit(text, IOS_VISIBLE_HARD_LIMIT);

  // Final guard (in case the lastBreak logic produced something slightly longer due to surrogate pairs)
  if (text.length > IOS_VISIBLE_HARD_LIMIT) {
    text = text.slice(0, IOS_VISIBLE_HARD_LIMIT).trim();
  }

  return text;
}


export async function openai_transcription(
    buffer,
    model = "gpt-4o-transcribe"
) {
    if (!Buffer.isBuffer(buffer)) {
        throw new Error("Provided audio is not a Buffer");
    }

    const file = await toFile(buffer, "audio.webm", {
        contentType: "audio/webm",   // helps the SDK set the MIME header
    });

    const { text } = await openai.audio.transcriptions.create({
        file,
        model,
        language: "en",
        prompt:
            "The following audio input is a description of an upcoming scheduled event for a user's calendar. Here are spellings for some names the user MIGHT have mentioned, ONLY use these spellings if the user mentions these names: [\"Chelsy\", \"Cory\", \"Prada\"]",
    });

    return text;
}

export async function get_event_from_audio_input(transcription, selectedDate) {
    // You want to provide a clear prompt so the model knows what to do
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are a calendar scheduling assistant that extracts event information from a user's message and returns it as a JSON object following the provided schema."
            },
            {
                role: "user",
                content: `Extract the event details from the user transcript: "${transcription}". The user is scheduling an event on the following day with the following timezone offset: "${selectedDate}". Return only the JSON object as specified.`
            }
        ],
        response_format: {
            "type": "json_schema",
            "json_schema": {
                "name": "event",
                "schema": {
                    "type": "object",
                    "required": [
                        "title",
                        "description",
                        "start_time",
                        "end_time",
                        "category_id",
                    ],
                    "properties": {
                        "title": {
                            "type": "string",
                            "description": "The title of the event."
                        },
                        "description": {
                            "type": "string",
                            "description": "A description providing details about the event."
                        },
                        "start_time": {
                            "type": "string",
                            "example": selectedDate,
                            "description": `The start time of the event in ISO format, using the same timezone offset as ${selectedDate}.`
                        },
                        "end_time": {
                            "type": "string",
                            "example": selectedDate,
                            "description": `The end time of the event in ISO format, using the same timezone offset as ${selectedDate}.`
                        },
                        "category_id": {
                            "type": "string",
                            "description": "A plain text color identifier for the event color used in calendar representation. Only use HTML color names in lowercase (e.g. cornflowerblue)."
                        },
                    },
                    "additionalProperties": false
                },
                "strict": true
            }
        },
        temperature: 1,
        max_completion_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    });

    // Extract JSON result (depends on OpenAI response format)
    const content = response.choices[0]?.message?.content;
    let event = null;
    try {
        event = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (e) {
        throw new Error("Failed to parse event from OpenAI response");
    }
    return event;
}
