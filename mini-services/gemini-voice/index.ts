import WebSocket, { WebSocketServer } from "ws";

const PORT = 3004;
const GEMINI_MODEL = "models/gemini-2.5-flash-preview-native-audio-dialog";
const DEFAULT_VOICE = "Charon";
const DEFAULT_SYSTEM_PROMPT =
  "Tu es Maellis, l'assistant intelligent de Maison Consciente. Tu es poli, chaleureux et professionnel. Tu parles toujours en français. Tu aides les utilisateurs avec leur maison intelligente, leurs recettes, leurs courses, la santé, et le bien-être familial. Tu es concis mais chaleureux dans tes réponses.";

const AVAILABLE_VOICES = [
  "Aoede",
  "Breeze",
  "Charon",
  "Dan",
  "Fenrir",
  "Kore",
  "Leda",
  "Orus",
  "Puck",
  "Zephyr",
  "Sulafat",
  "Nitro",
];

// Internal API endpoint to fetch Gemini key from the database
const MAIN_APP_URL = process.env.MAIN_APP_URL || "http://127.0.0.1:3000";
const API_KEY_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // Refresh every 5 minutes

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientMessage {
  type: "setup" | "text" | "interrupt";
  voice?: string;
  systemPrompt?: string;
  text?: string;
}

interface SessionState {
  clientWs: WebSocket;
  geminiWs: WebSocket | null;
  setupComplete: boolean;
  voice: string;
  systemPrompt: string;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

// ---------------------------------------------------------------------------
// API Key Management
// ---------------------------------------------------------------------------

let cachedApiKey: string | null = null;
let lastKeyFetchTime = 0;

/**
 * Fetch the Gemini API key from the main app's internal API.
 * Falls back to GEMINI_API_KEY env var if the API is unreachable.
 */
async function fetchApiKey(): Promise<string | null> {
  try {
    const res = await fetch(`${MAIN_APP_URL}/api/internal/api-key/GEMINI`, {
      headers: { "X-Internal-Service": "true" },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.apiKey) {
        log("🔑 Gemini API key loaded from database (admin panel)");
        return data.apiKey as string;
      }
    } else {
      log(`⚠️ Internal API returned ${res.status} — falling back to env var`);
    }
  } catch (err) {
    log(`⚠️ Could not reach internal API (${err instanceof Error ? err.message : "unknown"}) — falling back to env var`);
  }

  // Fallback: environment variable
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey) {
    log("🔑 Using GEMINI_API_KEY from environment variable (fallback)");
    return envKey;
  }

  return null;
}

/**
 * Get the cached API key, refreshing from the DB if stale.
 */
async function getApiKey(): Promise<string | null> {
  const now = Date.now();
  if (!cachedApiKey || now - lastKeyFetchTime > API_KEY_REFRESH_INTERVAL_MS) {
    const key = await fetchApiKey();
    if (key) {
      cachedApiKey = key;
      lastKeyFetchTime = now;
    }
  }
  return cachedApiKey;
}

/**
 * Force refresh the API key from the database.
 */
async function refreshApiKey(): Promise<string | null> {
  cachedApiKey = await fetchApiKey();
  lastKeyFetchTime = Date.now();
  return cachedApiKey;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string) {
  console.log(`[Gemini Voice] ${msg}`);
}

function sendJson(ws: WebSocket, obj: Record<string, unknown>) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

/**
 * Convert WebSocket.Data to string (handles both string and Buffer).
 * Bun's ws sometimes delivers text frames as Buffer.
 */
function dataToString(data: WebSocket.Data): string {
  if (typeof data === "string") return data;
  if (Buffer.isBuffer(data)) return data.toString("utf8");
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  return String(data);
}

/**
 * Check if data looks like a JSON message (starts with '{').
 * Used to distinguish JSON control messages from PCM audio binary.
 */
function isJsonMessage(data: WebSocket.Data): boolean {
  if (typeof data === "string") {
    return data.trimStart().startsWith("{");
  }
  // For binary data, check first byte is '{' (0x7b)
  if (Buffer.isBuffer(data) && data.length > 0) {
    return data[0] === 0x7b;
  }
  if (data instanceof ArrayBuffer && data.byteLength > 0) {
    return new Uint8Array(data)[0] === 0x7b;
  }
  return false;
}

function buildGeminiSetup(voice: string, systemPrompt: string): string {
  const setupMsg = {
    setup: {
      model: GEMINI_MODEL,
      generation_config: {
        response_modalities: ["AUDIO"],
        speech_config: {
          voice_config: {
            prebuilt_voice_config: {
              voice_name: voice,
            },
          },
        },
      },
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      tools: [],
    },
  };
  return JSON.stringify(setupMsg);
}

function createGeminiUrl(apiKey: string): string {
  return `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
}

function parseGeminiMessage(data: WebSocket.Data, session: SessionState) {
  // Binary from Gemini = audio PCM → forward to client
  if (!isJsonMessage(data)) {
    if (session.clientWs.readyState === WebSocket.OPEN) {
      session.clientWs.send(data);
    }
    return;
  }

  const str = dataToString(data);

  let msg: Record<string, unknown>;
  try {
    msg = JSON.parse(str);
  } catch {
    log("⚠️ Could not parse Gemini text message");
    return;
  }

  // --- Setup complete ---
  if (msg.setupComplete) {
    log("✅ Gemini setup complete");
    session.setupComplete = true;
    sendJson(session.clientWs, { type: "setup_complete" });
    return;
  }

  // --- Turn complete ---
  if (msg.turnComplete) {
    sendJson(session.clientWs, { type: "turn_complete" });
    return;
  }

  // --- Server content (model response) ---
  const serverContent = msg.serverContent as
    | Record<string, unknown>
    | undefined;
  if (serverContent) {
    const modelTurn = serverContent.modelTurn as
      | Record<string, unknown>
      | undefined;
    if (modelTurn) {
      const parts = modelTurn.parts as Array<Record<string, unknown>> | undefined;
      if (parts) {
        for (const part of parts) {
          if (typeof part.text === "string" && part.text.length > 0) {
            sendJson(session.clientWs, {
              type: "response",
              text: part.text,
            });
          }
        }
      }
    }

    // --- Input transcription (what Gemini heard from user mic) ---
    const inputTranscription = serverContent.inputTranscription as
      | Record<string, unknown>
      | undefined;
    if (inputTranscription && typeof inputTranscription.text === "string") {
      const transcriptText = inputTranscription.text as string;
      if (transcriptText.length > 0) {
        sendJson(session.clientWs, {
          type: "transcript",
          text: transcriptText,
        });
      }
    }

    // --- Audio activity (voice activity detection) ---
    if (serverContent.interruptionFeedback) {
      sendJson(session.clientWs, {
        type: "audio_activity",
        speaking: false,
      });
    }
  }

  // --- Error from Gemini ---
  if (msg.error) {
    const errMsg =
      typeof msg.error === "string"
        ? msg.error
        : (msg.error as Record<string, unknown>).message?.toString() ??
          JSON.stringify(msg.error);
    log(`❌ Gemini error: ${errMsg}`);
    sendJson(session.clientWs, { type: "error", message: errMsg });
  }
}

// ---------------------------------------------------------------------------
// Gemini connection lifecycle
// ---------------------------------------------------------------------------

function connectToGemini(session: SessionState, apiKey: string) {
  const url = createGeminiUrl(apiKey);
  log(`Connecting to Gemini Live API (attempt ${session.reconnectAttempts + 1})...`);

  try {
    const geminiWs = new WebSocket(url);

    geminiWs.on("open", () => {
      log("✅ Connected to Gemini Live API");
      session.reconnectAttempts = 0;
      session.geminiWs = geminiWs;

      // Send setup message
      const setupMsg = buildGeminiSetup(session.voice, session.systemPrompt);
      geminiWs.send(setupMsg);
      log(`🔧 Sent setup (voice=${session.voice})`);
    });

    geminiWs.on("message", (data) => {
      parseGeminiMessage(data, session);
    });

    geminiWs.on("close", (code, reason) => {
      log(`Gemini connection closed (code=${code}, reason=${reason.toString()})`);
      session.geminiWs = null;
      session.setupComplete = false;

      if (session.clientWs.readyState === WebSocket.OPEN) {
        if (session.reconnectAttempts < session.maxReconnectAttempts) {
          session.reconnectAttempts++;
          const delay = Math.min(1000 * session.reconnectAttempts, 5000);
          log(`Reconnecting in ${delay}ms...`);
          setTimeout(() => {
            if (session.clientWs.readyState === WebSocket.OPEN) {
              connectToGemini(session, apiKey);
            }
          }, delay);
        } else {
          log("❌ Max reconnect attempts reached");
          sendJson(session.clientWs, {
            type: "error",
            message:
              "Gemini connection lost. Max reconnection attempts reached.",
          });
        }
      }
    });

    geminiWs.on("error", (err) => {
      log(`❌ Gemini WebSocket error: ${err.message}`);
      if (session.clientWs.readyState === WebSocket.OPEN) {
        sendJson(session.clientWs, {
          type: "error",
          message: `Gemini connection error: ${err.message}`,
        });
      }
    });
  } catch (err) {
    log(`❌ Failed to create Gemini connection: ${err instanceof Error ? err.message : String(err)}`);
    sendJson(session.clientWs, {
      type: "error",
      message: "Failed to connect to Gemini. Check your API key in the admin panel.",
    });
  }
}

// ---------------------------------------------------------------------------
// Client message handler
// ---------------------------------------------------------------------------

async function handleClientMessage(
  data: WebSocket.Data,
  session: SessionState,
) {
  // If data looks like JSON, parse it as a control message.
  // Otherwise treat as PCM audio binary and forward to Gemini.
  if (isJsonMessage(data)) {
    const str = dataToString(data);

    let msg: ClientMessage;
    try {
      msg = JSON.parse(str);
    } catch {
      log("⚠️ Invalid JSON from client");
      sendJson(session.clientWs, { type: "error", message: "Invalid JSON message" });
      return;
    }

    switch (msg.type) {
      case "setup": {
        session.voice =
          msg.voice && AVAILABLE_VOICES.includes(msg.voice)
            ? msg.voice
            : DEFAULT_VOICE;
        session.systemPrompt = msg.systemPrompt || DEFAULT_SYSTEM_PROMPT;
        session.reconnectAttempts = 0;

        log(`Setup requested (voice=${session.voice})`);

        // Fetch fresh API key from DB
        const apiKey = await refreshApiKey();

        if (!apiKey) {
          log("❌ No Gemini API key available");
          sendJson(session.clientWs, {
            type: "error",
            message:
              "Aucune clé API Gemini configurée. Veuillez la définir dans le panneau admin (section APIs).",
          });
          return;
        }

        // Disconnect existing Gemini connection if any
        if (session.geminiWs) {
          log("Closing existing Gemini connection...");
          session.geminiWs.removeAllListeners();
          session.geminiWs.close();
          session.geminiWs = null;
        }

        // Connect to Gemini
        connectToGemini(session, apiKey);
        break;
      }

      case "text": {
        if (!session.geminiWs || session.geminiWs.readyState !== WebSocket.OPEN) {
          sendJson(session.clientWs, {
            type: "error",
            message: "Not connected to Gemini. Send a setup message first.",
          });
          return;
        }

        const geminiTextMsg = {
          client_content: {
            turns: [
              {
                role: "user",
                parts: [{ text: msg.text ?? "" }],
              },
            ],
          },
        };
        session.geminiWs.send(JSON.stringify(geminiTextMsg));
        log(`📝 Sent text to Gemini: "${(msg.text ?? "").substring(0, 50)}..."`);
        break;
      }

      case "interrupt": {
        if (!session.geminiWs || session.geminiWs.readyState !== WebSocket.OPEN) {
          return;
        }

        const geminiInterruptMsg = {
          client_content: {
            turns: [
              {
                role: "user",
                parts: [{ interrupt: true }],
              },
            ],
          },
        };
        session.geminiWs.send(JSON.stringify(geminiInterruptMsg));
        log("⛔ Sent interrupt to Gemini");
        break;
      }

      default:
        log(`⚠️ Unknown message type: ${(msg as Record<string, unknown>).type}`);
        sendJson(session.clientWs, {
          type: "error",
          message: `Unknown message type: ${(msg as Record<string, unknown>).type}`,
        });
    }
  } else {
    // Binary PCM audio → forward to Gemini
    if (session.geminiWs && session.geminiWs.readyState === WebSocket.OPEN) {
      session.geminiWs.send(data);
    }
  }
}

// ---------------------------------------------------------------------------
// WebSocket server
// ---------------------------------------------------------------------------

async function startServer() {
  // Pre-fetch API key on startup
  log("🔄 Pre-fetching Gemini API key...");
  const initialKey = await fetchApiKey();
  if (initialKey) {
    log("✅ Gemini API key loaded successfully");
  } else {
    log("❌ WARNING: No Gemini API key found (env var or database)");
    log("   The server will start, but voice setup requests will fail.");
    log("   Configure the key in the superadmin panel → APIs → Google Gemini");
  }

  const wss = new WebSocketServer({ port: PORT });

  wss.on("listening", () => {
    log(`🚀 WebSocket server listening on ws://localhost:${PORT}`);
  });

  wss.on("connection", (ws, req) => {
    const clientIp = req.socket.remoteAddress ?? "unknown";
    log(`📞 Client connected from ${clientIp}`);

    const session: SessionState = {
      clientWs: ws,
      geminiWs: null,
      setupComplete: false,
      voice: DEFAULT_VOICE,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
    };

    // Send connected confirmation
    sendJson(ws, { type: "connected" });

    // Handle client messages — wrap async handler to catch errors
    ws.on("message", (data) => {
      handleClientMessage(data, session).catch((err) => {
        log(`❌ Error handling client message: ${err instanceof Error ? err.message : String(err)}`);
        sendJson(ws, { type: "error", message: "Internal server error" });
      });
    });

    // Handle client disconnection
    ws.on("close", (code) => {
      log(`👋 Client disconnected (code=${code})`);
      if (session.geminiWs) {
        log("Cleaning up Gemini connection...");
        session.geminiWs.removeAllListeners();
        session.geminiWs.close();
        session.geminiWs = null;
      }
    });

    ws.on("error", (err) => {
      log(`❌ Client WebSocket error: ${err.message}`);
      if (session.geminiWs) {
        session.geminiWs.removeAllListeners();
        session.geminiWs.close();
        session.geminiWs = null;
      }
    });
  });

  wss.on("error", (err) => {
    log(`❌ Server error: ${err.message}`);
  });

  // Periodically refresh the API key from the database
  setInterval(async () => {
    const key = await getApiKey();
    if (key) {
      log("🔄 Gemini API key refreshed from database");
    }
  }, API_KEY_REFRESH_INTERVAL_MS);
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

startServer();
