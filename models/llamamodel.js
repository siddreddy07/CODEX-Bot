import Groq from "groq-sdk";
import dotenv from "dotenv";
import { saveToMemory, getMemory } from "../memory.js";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

import { execSync } from 'child_process';

function extractFileAndLine(errorMessage) {
  const match = errorMessage.match(/at\s+\w+\s+\(([^:]+):(\d+):\d+\)/);
  if (!match) return null;
  return { file: match[1], line: Number(match[2]) };
}


export async function genAI({ type, code, message }) {
  const now = new Date();
  const timestamp = `${now.toLocaleDateString()} - ${now.toLocaleTimeString()}`;

  let systemPrompt = "You are a helpful AI CLI assistant.";
  let userPrompt = "";

  if (type === 'doc') {
    userPrompt = `
Generate clean Markdown documentation for this JavaScript code.

📌 Rules:
- Add a heading with function name
- Include code block
- Explain the function's role
- Mention where it’s used (if visible)
- Short, clear, dev-friendly
- Add: **Generated on: ${timestamp}**

Code:
\`\`\`js
${code}
\`\`\`
    `.trim();
  }

  else if (type === 'intent') {
userPrompt = `
You are CodexBot — a smart CLI assistant for developers.

🎯 Your job: Read the user's message and respond with a VALID JSON object only.

🧠 Available actions:
- { "action": "gitCommand", "command": "..." }     ← For Git insights (recent changes, PRs, authors)
- { "action": "generateDocs", "folder": "..." }    ← For generating markdown docs
- { "action": "showStatus" }                        ← For cache or memory info
- { "action": "exit" }                              ← For quit, bye, etc.
- { "action": "help" }                              ← For “what can you do?”
- { "action": "chat" }                              ← For normal chat - but don't forget wht u actually are wht are u designed for based on this entire content 
- { "action": "analyzeError", "error": "..." } ← for runtime errors


📌 Rules:
- Use "gitCommand" if the user asks:
  - what changed / recent commits / who modified / what’s new
  - in any file or folder (you must extract the path if given)
  - Only use **read-only** Git commands like git log, git diff, etc.

- Use "generateDocs" for:
  - generate documentation / markdown / explain code in folder

- Use "showStatus" for:
  - cache, what changed last, memory, etc.

- Use "chat" if it sounds like casual talk (e.g., what’s your name, how are you)

🧪 Examples:
User: what changed in utils folder?  
{ "action": "gitCommand", "command": "git diff origin/main..HEAD -- src/utils" }

User: who changed logger.js?  
{ "action": "gitCommand", "command": "git log -- src/logger.js" }

User: generate docs for ./src  
{ "action": "generateDocs", "folder": "./src" }

User: show memory  
{ "action": "showStatus" }

User: what can you do?  
{ "action": "help" }

User: error occured / bug occured
{"action": "analyzeError", "error": "..."}

User: ${message}
`.trim();


}

else if (type === 'analyzeError') {
  const { file, line } = extractFileAndLine(message) || {};
  if (!file || !line) {
    userPrompt = `A user reported this error:\n\n${message}\n\n👉 Please explain:
- What does this error mean?
- What might be the cause?
- Suggest a possible fix.`;
  } else {
    let blame = '', diff = '';
    try {
      blame = execSync(`git blame -L ${line},${line} ${file}`, { encoding: 'utf-8' });
      diff = execSync(`git diff origin/main..HEAD -- ${file}`, { encoding: 'utf-8' });
    } catch (err) {
      blame = "❌ Could not retrieve blame.";
      diff = "❌ Could not retrieve diff.";
    }

    userPrompt = `
A user reported a runtime error. Help debug it step-by-step.

📄 File: ${file}
📍 Line: ${line}

🧠 Git Blame (who wrote it):
${blame}

🔍 Git Diff (recent changes in this file):
${diff}

🧪 Error:
${message}

👉 Please explain:
1. What the error means
2. Who might have caused it
3. What changed recently in this area
4. Suggest a fix in clear JS code
`.trim();
  }
}



  else {
    userPrompt = message;
  }

  const memory = getMemory().slice(-10);

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...memory,
        { role: "user", content: userPrompt }
      ]
    });

    const reply = response.choices[0]?.message?.content?.trim() || "";

    if (type !== 'intent') {
      saveToMemory(message || code, reply);
    }

    if (type === 'intent') {
      try {
        return JSON.parse(reply);
      } catch {
        return { action: 'chat' };
      }
    }

    return reply;

  } catch (err) {
    console.error("❌ AI Error:", err.message);
    return "⚠️ Something went wrong.";
  }
}
