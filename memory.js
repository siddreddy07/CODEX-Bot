// memory.js
import fs from 'fs';

const memoryFile = './memory.json';

export function saveToMemory(userMessage, aiReply) {
  const history = getMemory();
  history.push({ role: 'user', content: userMessage });
  history.push({ role: 'assistant', content: aiReply });
  fs.writeFileSync(memoryFile, JSON.stringify(history, null, 2), 'utf-8');
}

export function getMemory() {
  if (!fs.existsSync(memoryFile)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(memoryFile, 'utf-8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function clearMemory() {
  fs.writeFileSync(memoryFile, '[]', 'utf-8');
}
