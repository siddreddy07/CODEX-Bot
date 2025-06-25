#!/usr/bin/env node

import { generatedocs } from './controllers/doc.controllers.js';
import dotenv from 'dotenv';
import fs from 'fs';
import readline from 'readline';
import { genAI } from './models/llamamodel.js';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'You: '
});

console.log('🤖 CodexBot is online!');
console.log('Type something like: "generate docs for ./src", "show status", "help", or "exit"\n');

rl.prompt();

rl.on('line', async (input) => {
  const { action, folder, command } = await genAI({ type: 'intent', message: input });

  switch (action) {
    case 'exit':
      console.log('AI: 👋 Bye! ...');
      break;

    case 'help':
      console.log(`AI: 🤖 I can help with:
  • generate docs for ./folder
  • show status
  • help
  • exit`);
      break;

    case 'showStatus':
      if (fs.existsSync('cache.json')) {
        const cache = JSON.parse(fs.readFileSync('cache.json', 'utf-8'));
        console.log('AI: 📂 Cached JS Files:');
        Object.keys(cache).forEach(f => {
          console.log(`   - ${f}`);
        });
      } else {
        console.log('AI: ℹ️ No cache file found.');
      }
      break;

    case 'generateDocs':
      if (!folder) {
        console.log("AI: ❗Please mention the folder. Like: generate docs for ./src");
        break;
      }
      console.log(`AI: 🔍 Looking inside "${folder}"...`);
      try {
        const res = await generatedocs(folder);
        console.log(res
          ? 'AI: ✅ Documentation generated!'
          : 'AI: ⚠️ Nothing new to document or an error occurred.');
      } catch (err) {
        console.log('AI: ❌ Something went wrong:', err.message);
      }
      break;

      case 'gitCommand':
        try{
          const {execSync} = await import ('child_process');
          const output = execSync(folder || command, { encoding: 'utf-8' })
          console.log(output)
          console.log("AI:\n" + output);
        }
        catch (err){
           console.log("AI: ⚠️ Git command failed:",command);
        }
        break;

      case 'chat':
    default:
      const reply = await genAI({ message: input }); // normal chat
      console.log(`AI: ${reply}`);
      break
  }

  rl.prompt();
});
