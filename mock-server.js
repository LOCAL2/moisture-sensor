const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let currentValue = 2000;
let pumpState = false;
let autoMode = true;

// ฟังก์ชันเช็ค auto mode
function checkAutoMode() {
  if (autoMode) {
    if (currentValue <= 1500) {
      pumpState = true;
    } else {
      pumpState = false;
    }
  }
}

// สุ่มค่าใหม่ทุก ๆ 1000 ms
setInterval(() => {
  // ถ้าปั๊มทำงาน ค่าความชื้นจะเพิ่มขึ้น
  if (pumpState) {
    currentValue += Math.floor(Math.random() * 150) + 50; // เพิ่ม 50-200
  } else {
    currentValue += Math.floor(Math.random() * 100) - 70; // ลด -70 ถึง +30
  }
  
  currentValue = Math.max(100, Math.min(4095, currentValue));
  checkAutoMode();
}, 1000);

// GET /api/sensor
app.get('/api/sensor', (_req, res) => {
  checkAutoMode();
  res.json({
    value: currentValue,
    pumpState: pumpState,
    autoMode: autoMode,
  });
});

// GET /api/value
app.get('/api/value', (_req, res) => {
  checkAutoMode();
  res.json({
    value: currentValue,
    pumpState: pumpState,
    autoMode: autoMode,
  });
});

// POST /api/pump
app.post('/api/pump', (req, res) => {
  if (!autoMode) {
    pumpState = req.body.state;
  }
  res.json({ success: true, pumpState: pumpState });
});

// POST /api/auto
app.post('/api/auto', (req, res) => {
  autoMode = req.body.state;
  if (autoMode) {
    checkAutoMode();
  } else {
    pumpState = false;
  }
  res.json({ success: true, autoMode: autoMode, pumpState: pumpState });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API URL: http://localhost:${PORT}/api/sensor`);
});
