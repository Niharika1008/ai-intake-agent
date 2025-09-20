import Fastify from "fastify";
import dotenv from "dotenv";
import fastifyFormBody from "@fastify/formbody";
import fastifyWs from "@fastify/websocket";
import { registerInboundRoutes } from './inbound-calls.js';
import { registerOutboundRoutes } from './outbound-calls.js';

dotenv.config();

const fastify = Fastify({ logger: true });

fastify.register(fastifyFormBody);
fastify.register(fastifyWs);

const PORT = process.env.PORT || 8000;

// ----------------------
// Dashboard Data
// ----------------------
let bots = [
  { uid: "bot001", name: "Medical Intake Agent" },
  { uid: "bot002", name: "Receptionist Bot" }
];

let callLogs = [];

// ----------------------
// Dashboard Route
// ----------------------
fastify.get("/", async (_, reply) => {
  let html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>AI Intake Agent Dashboard</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
      body {
        font-family: 'Roboto', sans-serif;
        margin: 0;
        padding: 0;
        /* pastel background image */
        background-image: url('data:image/jpeg;base64,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');
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
        color: #333;
      }
      header {
        background: rgba(255, 214, 224, 0.8);
        color: #5b2c6f;
        padding: 1rem;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        backdrop-filter: blur(5px);
      }
      h1 { margin: 0; font-size: 2rem; }
      .container {
        padding: 2rem;
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
        justify-content: center;
      }
      .card {
        background: rgba(255, 240, 245, 0.9);
        padding: 1.5rem;
        border-radius: 12px;
        min-width: 280px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        backdrop-filter: blur(5px);
      }
      h2 { margin-top: 0; color: #5b2c6f; }
      button {
        background: #ff9ede;
        color: #5b2c6f;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
      }
      button:hover {
        background: #ff76c1;
        transform: scale(1.05);
      }
      ul { list-style: none; padding: 0; max-height: 300px; overflow-y: auto;}
      li { padding: 0.5rem 0; border-bottom: 1px solid #ffe0f0; }
    </style>
  </head>
  <body>
    <header>
      <h1>AI Intake Agent Dashboard</h1>
    </header>

    <div class="container">
      <div class="card">
        <h2>Bots</h2>
        <ul id="bots-list">
          ${bots.map(bot => `<li>${bot.name} (ID: ${bot.uid})</li>`).join("")}
        </ul>
      </div>

      <div class="card">
        <h2>Call Logs</h2>
        <ul id="logs-list">
          ${callLogs.map(log => `<li>ID: ${log.id} → ${log.transcript}</li>`).join("")}
        </ul>
      </div>

      <div class="card">
        <h2>Actions</h2>
        <button id="simulate-btn">Simulate Call</button>
      </div>
    </div>

    <script>
      const simulateBtn = document.getElementById("simulate-btn");
      const logsList = document.getElementById("logs-list");

      simulateBtn.addEventListener("click", async () => {
        // Pre-call
        await fetch("/precall", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callId: "demo" })
        });
        // In-call
        await fetch("/incall", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callId: "demo" })
        });
        // Post-call
        const postRes = await fetch("/postcall", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: "Demo transcript from simulated call" })
        });
        const data = await postRes.json();

        // Update logs
        const li = document.createElement("li");
        li.textContent = "ID: " + Date.now() + " → " + data.transcript;
        logsList.prepend(li);
      });
    </script>
  </body>
  </html>
  `;
  reply.type("text/html").send(html);
});

// ----------------------
//  Pre/In/Post Endpoints
// ----------------------
fastify.post("/precall", async (req) => {
  const dummyPatient = { id: "p001", name: "John Doe", allergies: "None" };
  console.log("Pre-call hit:", req.body);
  return { message: "Pre-call working", patient: dummyPatient };
});

fastify.post("/incall", async (req) => {
  console.log("In-call hit:", req.body);
  return { message: "In-call working", action: "Fetched dummy info" };
});

fastify.post("/postcall", async (req) => {
  const transcript = req.body.transcript || "Sample transcript";
  callLogs.unshift({ id: Date.now(), transcript });
  console.log("Post-call hit:", req.body);
  return { message: "Post-call working", transcript };
});

// ----------------------
// Bot CRUD Endpoints
// ----------------------

// Add Bot
fastify.post("/bots/add", async (req) => {
  const { uid, name } = req.body;
  if (!uid || !name) return { error: "Provide UID & Name" };
  bots.push({ uid, name });
  return { message: "Bot added", bots };
});

// Update Bot
fastify.post("/bots/update", async (req) => {
  const { uid, name } = req.body;
  const bot = bots.find(b => b.uid === uid);
  if (!bot) return { error: "Bot not found" };
  bot.name = name;
  return { message: "Bot updated", bots };
});

// Delete Bot
fastify.post("/bots/delete", async (req) => {
  const { uid } = req.body;
  bots = bots.filter(b => b.uid !== uid);
  return { message: "Bot deleted", bots };
});


// ----------------------
// Start server
// ----------------------
const start = async () => {
  try {
    await registerInboundRoutes(fastify);
    await registerOutboundRoutes(fastify);
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`[Server] Listening on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

start();
