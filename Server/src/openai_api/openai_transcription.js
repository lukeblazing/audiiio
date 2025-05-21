import OpenAI, { toFile } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
      "The following audio input is a description of an upcoming scheduled event for a concrete pumping operator's calendar.",
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
                content: "You are an assistant that extracts event information from a user's message and returns it as a JSON object following the provided schema."
            },
            {
                role: "user",
                content: `Extract the event details from this text: "${transcription}". Assume all dates and times are in the "America/Chicago" timezone (U.S. Central Time) unless otherwise specified by the user. Always return full ISO8601 date-time strings including the timezone offset. The day, month, and year for this event match today's date: ${selectedDate}, unless otherwise specified by the user. Return only the JSON object as specified.`
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
                        "category_id",
                        "start",
                        "end_time"
                    ],
                    "properties": {
                        "start": {
                            "type": "string",
                            "example": "2023-03-25T14:00:00-06:00",
                            "description": "The start time of the event. Assume all dates and times are in the America/Chicago timezone (U.S. Central Time) unless otherwise specified by the user. Always return full ISO8601 date-time strings including the timezone offset."
                        },
                        "title": {
                            "type": "string",
                            "description": "The title of the event."
                        },
                        "end_time": {
                            "type": "string",
                            "example": "2023-03-25T16:00:00-06:00",
                            "description": "The end time of the event. Assume all dates and times are in the America/Chicago timezone (U.S. Central Time) unless otherwise specified by the user. Always return full ISO8601 date-time strings including the timezone offset."
                        },
                        "category_id": {
                            "type": "string",
                            "description": "A plain text color identifier for the event category used in calendar representation."
                        },
                        "description": {
                            "type": "string",
                            "description": "A description providing details about the event."
                        }
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
