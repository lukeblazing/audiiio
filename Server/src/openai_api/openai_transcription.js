import OpenAI, { toFile } from "openai";
import crypto from 'crypto';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateDailyMorningPoem(opts = {}) {
    const { theme = "gentle focus and bright optimism", lines = 4, timezone = "America/Chicago" } = opts;

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

    const instructions = `
You are a poet. Write a fresh morning love poem specific to ${dateKey} with new imagery.
Tone: warm, vivid, avoiding clichés.
Lines: around ${lines}.
Use the internal seed poem_id=${poemId} to vary your metaphors.
Close with a crisp sensory image, mentioning Chelsy and her beauty.
`.trim();

    const userPrompt = `Morning theme: ${theme}. Write the poem now.`;

    const resp = await client.responses.create({
        model: "gpt-5",
        instructions,
        input: userPrompt,
    });


    return resp.output_text.trim();
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
