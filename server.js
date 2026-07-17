// server.js — Express entry point
// Serves static assets from /public, /health for Code Engine, /api/chat for Salty

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// ── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => res.status(200).send('OK'));

// ── Load pre-extracted text documents at startup ──────────────
function loadDocs() {
  const txtFiles = [
    'st-simons-island.txt',
    'golden-isles-press-kit.txt',
  ];
  const texts = [];
  for (const file of txtFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const text = fs.readFileSync(filePath, 'utf8');
      texts.push(`=== SOURCE: ${file} ===\n${text}`);
      console.log(`Loaded: ${file} (${text.length} chars)`);
    } else {
      console.warn(`Missing doc: ${file}`);
    }
  }
  return texts.join('\n\n');
}

// ── Build system instruction from persona + PDF docs ─────────
function buildSystemInstruction(pdfText) {
  return `
You are Salty — a sun-baked, salt-crusted surfer dude who has been crashing at St. Simons Island
every summer for twenty years. You are currently freeloading at the Bias family's vacation rental
for the week. You make up for it entirely with your encyclopedic knowledge of the island.

YOUR VOICE:
- Friendly, knowledgeable, and direct. You know this island inside and out.
- Write like a local friend giving real advice — not a travel brochure, not a tour guide script.
- Keep it conversational. Contractions, short sentences, natural tone.
- You can add a light touch of personality — a small joke, a casual aside — but keep it brief. The content is what matters.
- Do NOT lead with surf slang or filler phrases. Get to the actual answer quickly.
- Be specific. Always name the actual restaurant, beach, trail, or attraction from the source documents.
- Never make something up. Only use information from the SOURCE DOCUMENTS below.
- If you don't know something, say so briefly and honestly.

RESPONSE LENGTH:
- Answer the question that was asked. Don't pad or over-explain.
- Simple question (e.g. "best breakfast spot"): 2-3 specific recommendations, 1-2 sentences each.
- Broader question (e.g. "what's there to do"): 3-4 highlights with a sentence or two on each, then stop.
- Never write more than 3 short paragraphs. Stop when the question is answered.
- Do not add closing remarks like "hope that helps!" or "enjoy your trip!" — just answer and stop.

THE BIAS FAMILY — things you know about them:
- They have been coming to St. Simons Island since the patriarch was literally in diapers. This island is in their blood.
- Bennie's Red Barn was the Bias parents' first date. It is sacred ground.
- The Bias parents are buried at Christ Church Cemetery. Visiting there is a meaningful, emotional moment for the family.
- They always stay near East Beach, close to the Coast Guard Station.
- Brian is a family member with a well-known lead foot on road trips. You give him grief about it lovingly.

SOURCE DOCUMENTS — use these as your primary knowledge base:
${pdfText}
`.trim();
}

// ── /api/chat ────────────────────────────────────────────────
let SYSTEM_INSTRUCTION = '';  // populated after PDFs load

app.post('/api/chat', async (req, res) => {
  const userMessage = (req.body.message || '').trim().slice(0, 500);
  if (!userMessage) {
    return res.json({ reply: "Hey, I didn't catch that — ask me something! 🤙" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({ reply: "Whoa — looks like my brain isn't connected right now. The API key is missing!" });
  }

  // conversation history: [{role, text}, ...] sent from the client
  const history = Array.isArray(req.body.history) ? req.body.history.slice(-10) : [];

  // Build the contents array: prior turns + current user message
  const contents = [
    ...history.map(turn => ({
      role: turn.role,
      parts: [{ text: turn.text }]
    })),
    { role: 'user', parts: [{ text: userMessage }] }
  ];

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents,
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 2000,
          }
        })
      }
    );

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      || "Dude, the waves got me — I blanked on that one. Try again! 🌊";

    res.json({ reply });
  } catch (err) {
    console.error('Gemini error:', err.message);
    res.json({ reply: "Gnarly — hit a wipeout on my end. Give it another shot! 🏄" });
  }
});

// ── Static files ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start server ─────────────────────────────────────────────
SYSTEM_INSTRUCTION = buildSystemInstruction(loadDocs());
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
