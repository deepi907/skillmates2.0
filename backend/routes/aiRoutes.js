const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();


// ======================================================
// TEST
// ======================================================

router.get("/test", (req, res) => {
  res.json({
    message: "AI routes are working!",
    geminiKeyLoaded: Boolean(
      process.env.GEMINI_API_KEY
    ),
    openRouterKeyLoaded: Boolean(
      process.env.OPENROUTER_API_KEY
    ),
  });
});


// ======================================================
// GEMINI CLIENT
// ======================================================

function createGeminiClient() {
  const key =
    process.env.GEMINI_API_KEY?.trim();

  if (!key) {
    return null;
  }

  return new GoogleGenAI({
    apiKey: key,
  });
}


// ======================================================
// OPENROUTER REQUEST
// ======================================================

async function generateWithOpenRouter(
  prompt
) {
  const key =
    process.env.OPENROUTER_API_KEY?.trim();

  if (!key) {
    throw new Error(
      "OPENROUTER_API_KEY is not available."
    );
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },

      body: JSON.stringify({
        model: "openrouter/free",

        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        `OpenRouter error: ${response.status}`
    );
  }

  const text =
    data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error(
      "OpenRouter returned an empty response."
    );
  }

  return text;
}


// ======================================================
// GEMINI REQUEST
// ======================================================

async function generateWithGemini(
  ai,
  prompt,
  schema
) {
  if (!ai) {
    throw new Error(
      "Gemini API key is not available."
    );
  }

  const models = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
  ];

  let lastError = null;

  for (const model of models) {
    try {
      console.log(
        `Trying Gemini: ${model}`
      );

      const response =
        await ai.models.generateContent({
          model,

          contents: prompt,

          config: {
            responseMimeType:
              "application/json",

            responseSchema: schema,
          },
        });

      console.log(
        `Gemini success: ${model}`
      );

      return response.text;

    } catch (error) {
      lastError = error;

      const errorText = String(
        error?.message || error
      ).toLowerCase();

      console.error(
        `Gemini failed (${model}):`,
        error?.message || error
      );

      // Quota / capacity errors should move
      // to the next provider.
      const providerError =
        errorText.includes("429") ||
        errorText.includes("quota") ||
        errorText.includes("resource_exhausted") ||
        errorText.includes("503") ||
        errorText.includes("unavailable") ||
        errorText.includes("high demand") ||
        errorText.includes("overloaded");

      if (!providerError) {
        throw error;
      }
    }
  }

  throw lastError;
}


// ======================================================
// GEMINI → OPENROUTER FALLBACK
// ======================================================

async function generateAI(
  prompt,
  schema
) {
  // ------------------------------------------
  // TRY GEMINI FIRST
  // ------------------------------------------

  try {
    const gemini = createGeminiClient();

    if (gemini) {
      const result =
        await generateWithGemini(
          gemini,
          prompt,
          schema
        );

      return {
        provider: "gemini",
        text: result,
      };
    }

    console.log(
      "Gemini key not available. Using OpenRouter."
    );

  } catch (error) {
    console.log(
      "Gemini unavailable. Falling back to OpenRouter."
    );

    console.log(
      error?.message || error
    );
  }


  // ------------------------------------------
  // TRY OPENROUTER
  // ------------------------------------------

  const openRouterText =
    await generateWithOpenRouter(
      prompt
    );

  return {
    provider: "openrouter",
    text: openRouterText,
  };
}


// ======================================================
// PLAN SCHEMA
// ======================================================

const planSchema = {
  type: "object",

  properties: {
    title: {
      type: "string",
    },

    activity: {
      type: "string",
    },

    why: {
      type: "string",
    },

    steps: {
      type: "array",
      items: {
        type: "string",
      },
    },

    duration: {
      type: "string",
    },

    budget: {
      type: "string",
    },

    preferredTime: {
      type: "string",
    },

    safety: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },

  required: [
    "title",
    "activity",
    "why",
    "steps",
    "duration",
    "budget",
    "preferredTime",
    "safety",
  ],
};


// ======================================================
// PROFILE SUMMARY SCHEMA
// ======================================================

const profileSummarySchema = {
  type: "object",

  properties: {
    summary: {
      type: "string",
    },

    reasons: {
      type: "array",
      items: {
        type: "string",
      },
    },

    connectionIdea: {
      type: "string",
    },
  },

  required: [
    "summary",
    "reasons",
    "connectionIdea",
  ],
};


// ======================================================
// POST /api/ai/plan
// ======================================================

router.post("/plan", async (req, res) => {
  try {
    const {
      mode,
      myProfile,
      matchedProfile,
      preferences,
      commonInterests,
    } = req.body;

    if (!mode || !myProfile ||
        !matchedProfile || !preferences) {
      return res.status(400).json({
        message:
          "Missing AI planning data.",
      });
    }

    const prompt = `
You are the AI recommendation assistant
for SkillMates.

Create one highly personalized
${mode} connection plan.

PERSON 1:
${JSON.stringify(
  myProfile,
  null,
  2
)}

PERSON 2:
${JSON.stringify(
  matchedProfile,
  null,
  2
)}

COMMON INTERESTS:
${JSON.stringify(
  commonInterests || [],
  null,
  2
)}

PREFERENCES:
${JSON.stringify(
  preferences,
  null,
  2
)}

Requirements:

- Make the activity relevant to BOTH people.
- Use their shared interests.
- Consider complementary skills.
- Consider learning goals.
- Respect the ${mode} mode.
- Respect duration.
- Respect budget.
- Respect preferred time.
- Explain why the activity fits them.
- Give 3 to 5 concrete steps.
- Do not invent personal information.
- For offline mode, include practical safety suggestions.
- For virtual mode, return an empty safety array.

Return ONLY valid JSON with:

{
  "title": "string",
  "activity": "string",
  "why": "string",
  "steps": ["string"],
  "duration": "string",
  "budget": "string",
  "preferredTime": "string",
  "safety": ["string"]
}
`;

    const result = await generateAI(
      prompt,
      planSchema
    );

    console.log(
      `AI provider used: ${result.provider}`
    );

    let plan;

    try {
      plan = JSON.parse(result.text);
    } catch (error) {
      console.error(
        "Invalid AI JSON:",
        result.text
      );

      return res.status(500).json({
        message:
          "AI returned an invalid plan.",
      });
    }

    res.json({
      success: true,
      provider: result.provider,
      plan,
    });

  } catch (error) {
    console.error(
      "AI plan error:",
      error
    );

    res.status(500).json({
      message:
        error?.message ||
        "Failed to generate AI plan.",
    });
  }
});


// ======================================================
// POST /api/ai/profile-summary
// ======================================================

router.post(
  "/profile-summary",
  async (req, res) => {
    try {
      const {
        myProfile,
        matchedProfile,
        commonInterests,
      } = req.body;

      if (!myProfile || !matchedProfile) {
        return res.status(400).json({
          message:
            "Profile information is required.",
        });
      }

      const prompt = `
You are the AI compatibility assistant
for SkillMates.

Analyze these two profiles.

PERSON 1:
${JSON.stringify(
  myProfile,
  null,
  2
)}

PERSON 2:
${JSON.stringify(
  matchedProfile,
  null,
  2
)}

COMMON INTERESTS:
${JSON.stringify(
  commonInterests || [],
  null,
  2
)}

Explain why they may be a good SkillMate
connection.

Rules:

- Use only supplied information.
- Do not invent facts.
- Mention meaningful shared interests.
- Mention complementary skills or learning goals.
- Mention an interesting difference when useful.
- Keep the summary natural and specific.
- Suggest one realistic first interaction.

Return ONLY:

{
  "summary": "string",
  "reasons": [
    "string",
    "string",
    "string"
  ],
  "connectionIdea": "string"
}
`;

      const result = await generateAI(
        prompt,
        profileSummarySchema
      );

      console.log(
        `AI provider used for profile summary: ${result.provider}`
      );

      let summary;

      try {
        summary = JSON.parse(
          result.text
        );
      } catch (error) {
        console.error(
          "Invalid summary JSON:",
          result.text
        );

        return res.status(500).json({
          message:
            "AI returned an invalid summary.",
        });
      }

      res.json({
        success: true,
        provider: result.provider,
        summary,
      });

    } catch (error) {
      console.error(
        "AI profile summary error:",
        error
      );

      res.status(500).json({
        message:
          error?.message ||
          "Failed to generate AI summary.",
      });
    }
  }
);


module.exports = router;