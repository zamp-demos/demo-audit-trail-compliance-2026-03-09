try { require('dotenv').config(); } catch(e) {}

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'public', 'data');

// ── Helpers ──────────────────────────────────────────────────────────────
function readJson(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch { return null; }
}
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ── Gemini setup ─────────────────────────────────────────────────────────
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}
const modelName = process.env.VITE_MODEL || 'gemini-2.5-flash';

// ── Process data endpoints ───────────────────────────────────────────────
app.get('/api/processes', (req, res) => {
  const data = readJson(path.join(DATA_DIR, 'processes.json'));
  res.json(data || []);
});

app.get('/api/process/:id', (req, res) => {
  const data = readJson(path.join(DATA_DIR, `process_${req.params.id}.json`));
  res.json(data || { logs: [] });
});

app.post('/api/update-status', (req, res) => {
  const { processId, status, currentStatus } = req.body;
  const filePath = path.join(DATA_DIR, 'processes.json');
  const processes = readJson(filePath) || [];
  const proc = processes.find(p => p.id === processId);
  if (proc) {
    if (status) proc.status = status;
    if (currentStatus) proc.currentStatus = currentStatus;
    writeJson(filePath, processes);
  }
  res.json({ success: true });
});

// ── HITL Signal endpoints ────────────────────────────────────────────────
app.post('/signal', (req, res) => {
  const { signal } = req.body;
  const filePath = path.join(DATA_DIR, 'interaction-signals.json');
  const signals = readJson(filePath) || {};
  signals[signal] = true;
  writeJson(filePath, signals);
  res.json({ success: true });
});

app.get('/signal-status', (req, res) => {
  const filePath = path.join(DATA_DIR, 'interaction-signals.json');
  const signals = readJson(filePath) || {};
  res.json(signals);
});

// ── Email HITL endpoints ─────────────────────────────────────────────────
app.post('/email-status', (req, res) => {
  const filePath = path.join(DATA_DIR, 'email-status.json');
  writeJson(filePath, { sent: req.body.sent || false });
  res.json({ success: true });
});

app.get('/email-status', (req, res) => {
  const filePath = path.join(DATA_DIR, 'email-status.json');
  const data = readJson(filePath) || { sent: false };
  res.json(data);
});

// ── Chat endpoints ───────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  if (!genAI) return res.json({ response: 'Gemini API key not configured. Please set GEMINI_API_KEY environment variable.' });

  try {
    const model = genAI.getGenerativeModel({ model: modelName });

    // KB chat contract: { message, knowledgeBase, history }
    if (req.body.message && req.body.knowledgeBase) {
      const { message, knowledgeBase, history } = req.body;
      const systemPrompt = `You are Pace, an AI assistant for Amgen's Audit Trail & Compliance Monitoring process. Use this knowledge base to answer questions:\n\n${knowledgeBase}\n\nBe specific, cite relevant regulations (21 CFR Part 11, EU Annex 11), and reference Amgen's actual systems when applicable. Keep answers concise but thorough.`;

      const chatHistory = (history || []).map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      }));

      const chat = model.startChat({
        history: [{ role: 'user', parts: [{ text: systemPrompt }] }, { role: 'model', parts: [{ text: 'Understood. I\'m ready to help with audit trail and compliance questions.' }] }, ...chatHistory]
      });

      const result = await chat.sendMessage(message);
      return res.json({ response: result.response.text() });
    }

    // Work-with-Pace contract: { messages, systemPrompt }
    if (req.body.messages) {
      const { messages, systemPrompt } = req.body;
      const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const chat = model.startChat({
        history: [{ role: 'user', parts: [{ text: systemPrompt || 'You are Pace, an AI assistant helping with audit trail compliance review.' }] }, { role: 'model', parts: [{ text: 'Ready to help.' }] }, ...history]
      });

      const lastMessage = messages[messages.length - 1];
      const result = await chat.sendMessage(lastMessage.content);
      return res.json({ response: result.response.text() });
    }

    res.json({ response: 'Invalid request format.' });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.json({ response: 'Error processing your request. Please try again.' });
  }
});

// ── Feedback endpoints ───────────────────────────────────────────────────
app.post('/api/feedback/questions', async (req, res) => {
  if (!genAI) return res.json({ questions: ['What specific aspect needs improvement?', 'Can you provide an example?', 'What would the ideal outcome look like?'] });

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const { feedback, knowledgeBase } = req.body;
    const prompt = `Based on this knowledge base:\n\n${knowledgeBase}\n\nA user submitted this feedback: "${feedback}"\n\nGenerate exactly 3 clarifying questions to better understand what changes are needed. Return as JSON array of strings.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\[[\s\S]*\]/);
    const questions = match ? JSON.parse(match[0]) : ['What specific section needs updating?', 'Can you provide more detail?', 'What is the expected outcome?'];
    res.json({ questions });
  } catch (err) {
    console.error('Feedback questions error:', err.message);
    res.json({ questions: ['What specific aspect needs improvement?', 'Can you provide an example?', 'What would the ideal outcome look like?'] });
  }
});

app.post('/api/feedback/summarize', async (req, res) => {
  if (!genAI) return res.json({ summary: req.body.feedback });

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const { feedback, questions, answers, knowledgeBase } = req.body;
    const prompt = `Summarize this feedback into a clear, actionable proposal for updating the knowledge base.\n\nOriginal feedback: "${feedback}"\n\nClarifying Q&A:\n${questions.map((q, i) => `Q: ${q}\nA: ${answers[i]}`).join('\n\n')}\n\nProvide a concise summary of the proposed change.`;
    const result = await model.generateContent(prompt);
    res.json({ summary: result.response.text() });
  } catch (err) {
    console.error('Feedback summarize error:', err.message);
    res.json({ summary: req.body.feedback });
  }
});

app.get('/api/feedback/queue', (req, res) => {
  const filePath = path.join(DATA_DIR, 'feedback-queue.json');
  const queue = readJson(filePath) || [];
  res.json(queue);
});

app.post('/api/feedback/queue', (req, res) => {
  const filePath = path.join(DATA_DIR, 'feedback-queue.json');
  const queue = readJson(filePath) || [];
  const item = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
  queue.push(item);
  writeJson(filePath, queue);
  res.json({ success: true, item });
});

app.delete('/api/feedback/queue/:id', (req, res) => {
  const filePath = path.join(DATA_DIR, 'feedback-queue.json');
  let queue = readJson(filePath) || [];
  queue = queue.filter(item => item.id !== req.params.id);
  writeJson(filePath, queue);
  res.json({ success: true });
});

app.post('/api/feedback/apply', async (req, res) => {
  if (!genAI) return res.status(500).json({ error: 'Gemini not configured' });

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const { feedbackId, summary } = req.body;
    const kbPath = path.join(__dirname, 'src', 'data', 'knowledgeBase.md');
    const currentKB = fs.readFileSync(kbPath, 'utf-8');

    const prompt = `Update the following knowledge base markdown based on this feedback:\n\nFeedback: ${summary}\n\nCurrent Knowledge Base:\n${currentKB}\n\nReturn the COMPLETE updated markdown. Keep the same structure and formatting. Only modify what the feedback addresses.`;

    const result = await model.generateContent(prompt);
    const updatedKB = result.response.text().replace(/^```markdown\n?/, '').replace(/\n?```$/, '');

    // Save snapshot
    const versionsPath = path.join(DATA_DIR, 'kbVersions.json');
    const versions = readJson(versionsPath) || [];
    const versionId = `v${versions.length + 1}`;
    const snapshotFilename = `kb_${versionId}_${Date.now()}.md`;
    fs.writeFileSync(path.join(DATA_DIR, 'snapshots', snapshotFilename), currentKB);
    versions.push({ id: versionId, filename: snapshotFilename, timestamp: new Date().toISOString(), feedbackSummary: summary });
    writeJson(versionsPath, versions);

    fs.writeFileSync(kbPath, updatedKB);

    // Remove from queue
    const queuePath = path.join(DATA_DIR, 'feedback-queue.json');
    let queue = readJson(queuePath) || [];
    queue = queue.filter(item => item.id !== feedbackId);
    writeJson(queuePath, queue);

    res.json({ success: true, versionId, updatedContent: updatedKB });
  } catch (err) {
    console.error('Feedback apply error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── KB Version endpoints ─────────────────────────────────────────────────
app.get('/api/kb/versions', (req, res) => {
  const versions = readJson(path.join(DATA_DIR, 'kbVersions.json')) || [];
  res.json(versions);
});

app.get('/api/kb/content', (req, res) => {
  const { versionId } = req.query;
  if (versionId) {
    const versions = readJson(path.join(DATA_DIR, 'kbVersions.json')) || [];
    const version = versions.find(v => v.id === versionId);
    if (version) {
      const snapshotPath = path.join(DATA_DIR, 'snapshots', version.filename);
      if (fs.existsSync(snapshotPath)) {
        return res.json({ content: fs.readFileSync(snapshotPath, 'utf-8') });
      }
    }
    return res.status(404).json({ error: 'Version not found' });
  }
  const kbPath = path.join(__dirname, 'src', 'data', 'knowledgeBase.md');
  res.json({ content: fs.existsSync(kbPath) ? fs.readFileSync(kbPath, 'utf-8') : '' });
});

// ── Reset handler ────────────────────────────────────────────────────────
let runningProcesses = [];

function killAllProcesses() {
  runningProcesses.forEach(proc => {
    try { proc.kill('SIGTERM'); } catch(e) {}
  });
  runningProcesses = [];
}

function initializeData() {
  // Copy base_processes to processes.json
  const basePath = path.join(DATA_DIR, 'base_processes.json');
  const procPath = path.join(DATA_DIR, 'processes.json');
  if (fs.existsSync(basePath)) {
    fs.copyFileSync(basePath, procPath);
  }

  // Reset process logs
  ['ATC_001', 'ATC_002', 'ATC_003', 'ATC_004'].forEach(id => {
    writeJson(path.join(DATA_DIR, `process_${id}.json`), { logs: [] });
  });

  // Reset signals and state files
  writeJson(path.join(DATA_DIR, 'interaction-signals.json'), {});
  writeJson(path.join(DATA_DIR, 'email-status.json'), { sent: false });
  writeJson(path.join(DATA_DIR, 'feedback-queue.json'), []);
}

function launchSimulations() {
  const scripts = [
    'story_1_cross_system_review.cjs',
    'story_2_data_integrity.cjs',
    'story_3_clean_batch.cjs',
    'story_4_trend_detection.cjs'
  ];

  scripts.forEach((script, index) => {
    const scriptPath = path.join(__dirname, 'simulation_scripts', script);
    if (!fs.existsSync(scriptPath)) {
      console.log(`Script not found: ${script}`);
      return;
    }

    setTimeout(() => {
      console.log(`Launching: ${script}`);
      const proc = spawn('node', [scriptPath], {
        cwd: __dirname,
        stdio: 'inherit',
        env: { ...process.env, PORT: PORT.toString() }
      });
      runningProcesses.push(proc);
      proc.on('exit', (code) => {
        console.log(`${script} exited with code ${code}`);
        runningProcesses = runningProcesses.filter(p => p !== proc);
      });
    }, index * 2000);
  });
}

app.get('/reset', (req, res) => {
  console.log('Reset triggered');
  killAllProcesses();
  setTimeout(() => {
    initializeData();
    setTimeout(() => {
      launchSimulations();
      res.json({ success: true });
    }, 500);
  }, 500);
});

// ── Startup ──────────────────────────────────────────────────────────────
initializeData();

app.listen(PORT, () => {
  console.log(`Audit Trail Compliance server running on port ${PORT}`);
  launchSimulations();
});
