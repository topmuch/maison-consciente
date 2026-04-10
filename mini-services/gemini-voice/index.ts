import WebSocket, { WebSocketServer } from "ws";

const PORT = 3004;
const GEMINI_MODEL = "models/gemini-2.0-flash-live-001";
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientSetupMessage {
  type: "setup";
  voice?: string;
  systemPrompt?: string;
}

interface ClientTextMessage {
  type: "text";
  text: string;
}

interface ClientInterruptMessage {
  type: "interrupt";
}

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
  if (typeof data !== "string") return; // binary — handled separately

  let msg: Record<string, unknown>;
  try {
    msg = JSON.parse(data);
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
      // Model detected an interruption from the user
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
      if (typeof data === "string") {
        parseGeminiMessage(data, session);
      } else {
        // Binary = audio from Gemini → forward to client
        if (session.clientWs.readyState === WebSocket.OPEN) {
          session.clientWs.send(data);
        }
      }
    });

    geminiWs.on("close", (code, reason) => {
      log(`Gemini connection closed (code=${code}, reason=${reason.toString()})`);
      session.geminiWs = null;
      session.setupComplete = false;

      if (session.clientWs.readyState === WebSocket.OPEN) {
        // Attempt reconnect unless client has disconnected
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
              "Gemini connection lost. Max reconnection attempts reached. Please send a new setup message.",
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
      message: "Failed to connect to Gemini. Check your API key.",
    });
  }
}

// ---------------------------------------------------------------------------
// Client message handler
// ---------------------------------------------------------------------------

function handleClientMessage(
  data: WebSocket.Data,
  session: SessionState,
  apiKey: string
) {
  // Binary from client = PCM audio → forward to Gemini
  if (typeof data !== "string") {
    if (session.geminiWs && session.geminiWs.readyState === WebSocket.OPEN) {
      session.geminiWs.send(data);
    }
    return;
  }

  // Parse JSON text frame
  let msg: ClientMessage;
  try {
    msg = JSON.parse(data);
  } catch {
    log("⚠️ Invalid JSON from client");
    sendJson(session.clientWs, { type: "error", message: "Invalid JSON message" });
    return;
  }

  switch (msg.type) {
    case "setup": {
      const setupMsg = msg as ClientSetupMessage;
      session.voice =
        setupMsg.voice && AVAILABLE_VOICES.includes(setupMsg.voice)
          ? setupMsg.voice
          : DEFAULT_VOICE;
      session.systemPrompt = setupMsg.systemPrompt || DEFAULT_SYSTEM_PROMPT;
      session.reconnectAttempts = 0;

      log(`Setup requested (voice=${session.voice})`);

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
      const textMsg = msg as ClientTextMessage;
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
              parts: [{ text: textMsg.text }],
            },
          ],
        },
      };
      session.geminiWs.send(JSON.stringify(geminiTextMsg));
      log(`📝 Sent text to Gemini: "${textMsg.text.substring(0, 50)}..."`);
      break;
    }

    case "interrupt": {
      if (!session.geminiWs || session.geminiWs.readyState !== WebSocket.OPEN) {
        return; // nothing to interrupt
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
      log(`⚠️ Unknown message type: ${msg.type}`);
      sendJson(session.clientWs, {
        type: "error",
        message: `Unknown message type: ${msg.type}`,
      });
  }
}

// ---------------------------------------------------------------------------
// WebSocket server
// ---------------------------------------------------------------------------

function startServer() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    log("⚠️ WARNING: GEMINI_API_KEY environment variable is not set.");
    log("   The server will start, but setup requests will fail.");
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

    // Handle client messages
    ws.on("message", (data) => {
      if (!apiKey) {
        sendJson(ws, {
          type: "error",
          message:
            "GEMINI_API_KEY not configured. Set it as an environment variable and restart the server.",
        });
        return;
      }
      handleClientMessage(data, session, apiKey);
    });

    // Handle client disconnection
    ws.on("close", (code, reason) => {
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

  // CORS: Allow all origins (WebSocket doesn't use HTTP headers the same way,
  // but the ws library handles this by default for ws:// connections).
  // For wss:// through a reverse proxy, configure CORS there.

  wss.on("error", (err) => {
    log(`❌ Server error: ${err.message}`);
  });
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

startServer();
