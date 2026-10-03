import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data', 'submissions.json');

app.use(cors());
app.use(express.json());

// データディレクトリの作成
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// 初期サンプルデータ
const INITIAL_SAMPLES = [
  {
    id: 'sample_1',
    nickname: 'タクミ',
    timestamp: Date.now() - 3600000 * 5,
    params: { topRadius: 2.8, depth: 0.6, bottomRadius: 1.2, wallCurve: 0.2, rimStyle: 0.4, materialColor: 'white_porcelain' },
    boundaryType: 'plate_to_bowl',
    comment: '浅く広く、フチが少し上がっているのが私の皿の境界。'
  },
  {
    id: 'sample_2',
    nickname: 'ユウキ',
    timestamp: Date.now() - 3600000 * 3,
    params: { topRadius: 1.8, depth: 1.5, bottomRadius: 0.7, wallCurve: 0.7, rimStyle: 0.2, materialColor: 'black_stoneware' },
    boundaryType: 'plate_to_bowl',
    comment: '手で包み込める丸みと深さが出たら完全に器です。'
  },
  {
    id: 'sample_3',
    nickname: 'アオイ',
    timestamp: Date.now() - 3600000 * 2,
    params: { topRadius: 2.4, depth: 0.9, bottomRadius: 1.0, wallCurve: 0.4, rimStyle: 0.3, materialColor: 'celadon_blue' },
    boundaryType: 'plate_to_bowl',
    comment: 'スープを張れるかどうかが私の境目！'
  }
];

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_SAMPLES, null, 2));
      return INITIAL_SAMPLES;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return INITIAL_SAMPLES;
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error writing data:', e);
  }
}

// REST API
app.get('/api/submissions', (req, res) => {
  res.json(readData());
});

app.post('/api/submissions', (req, res) => {
  const newSubmission = {
    id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    timestamp: Date.now(),
    ...req.body
  };
  const current = readData();
  const updated = [newSubmission, ...current];
  writeData(updated);
  
  // WebSocket 全端末へ配信
  broadcastMessage({
    type: 'NEW_SUBMISSION',
    submission: newSubmission
  });

  console.log(`[API] Saved & Broadcasted submission: ${newSubmission.nickname}`);
  res.json(newSubmission);
});

app.delete('/api/submissions', (req, res) => {
  writeData(INITIAL_SAMPLES);
  broadcastMessage({ type: 'CLEAR_SUBMISSIONS' });
  res.json({ success: true });
});

// HTTP & WebSocket 統合サーバー作成
const server = createServer(app);
const wss = new WebSocketServer({ server });

function broadcastMessage(data, senderClient = null) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== senderClient) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('⚡ WebSocket client connected (e.g. iPad or Display)');

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      // スライダー操作の超高速リアルタイムブロードキャスト (ミリ秒単位連動)
      if (parsed.type === 'SLIDER_LIVE_CHANGE') {
        broadcastMessage(parsed, ws);
      }
    } catch (e) {
      console.error('WS parse error:', e);
    }
  });

  ws.on('close', () => {
    console.log('⚡ WebSocket client disconnected');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 Boundary HTTP & WebSocket Server running on http://0.0.0.0:${PORT}`);
});
