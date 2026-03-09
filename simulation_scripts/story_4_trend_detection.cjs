const fs = require('fs');
const path = require('path');
const http = require('http');

const PROCESS_ID = 'ATC_004';
const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const PORT = process.env.PORT || 3001;

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function readJson(fp) { try { return JSON.parse(fs.readFileSync(fp, 'utf-8')); } catch { return null; } }
function writeJson(fp, d) { fs.writeFileSync(fp, JSON.stringify(d, null, 2)); }

function updateProcessLog(step) {
  const fp = path.join(DATA_DIR, `process_${PROCESS_ID}.json`);
  const data = readJson(fp) || { logs: [] };
  const i = data.logs.findIndex(l => l.id === step.id);
  if (i >= 0) data.logs[i] = step; else data.logs.push(step);
  writeJson(fp, data);
}

function updateProcessListStatus(status, currentStatus) {
  return new Promise(resolve => {
    const d = JSON.stringify({ processId: PROCESS_ID, status, currentStatus });
    const req = http.request({ hostname: 'localhost', port: PORT, path: '/api/update-status', method: 'POST', headers: { 'Content-Type': 'application/json' } }, res => { res.on('data', () => {}); res.on('end', resolve); });
    req.on('error', resolve); req.write(d); req.end();
  });
}

async function waitForSignal(signalId, poll = 1500) {
  while (true) {
    try {
      const body = await new Promise((resolve, reject) => {
        http.get(`http://localhost:${PORT}/signal-status?signal=${signalId}`, res => {
          let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d));
        }).on('error', reject);
      });
      if (JSON.parse(body).fired) return;
    } catch {}
    await delay(poll);
  }
}

const steps = [
  {
    id: 'step-1',
    title_p: 'Loading 30 batch audit trails for Q1 2026 periodic review...',
    title_s: 'Loaded 347,291 audit entries across 30 batches (Prolia 60mg, ATO facility)',
    reasoning: [
      'Querying all batches manufactured Jan 1 – Mar 31, 2026 at Amgen Thousand Oaks',
      'Product: Prolia 60mg prefilled syringe — 30 batches in review period',
      'Pulling audit trails from DeltaV, PI Historian, Syncade MES, Veeva QMS, and EMS',
      'Total collected: 347,291 audit entries (avg 11,576 per batch)',
      'All batches previously passed individual review — this is the quarterly trend analysis'
    ]
  },
  {
    id: 'step-2',
    title_p: 'Normalizing timestamps and operator identifiers across all 30 batches...',
    title_s: 'Normalization complete — 347,291 entries standardized, 42 unique operators mapped',
    reasoning: [
      'Converting all timestamps to UTC for cross-batch comparison',
      'Mapping operator IDs: resolved 42 unique personnel across badge, login, and e-signature identifiers',
      'Standardizing manufacturing phase labels across batch records',
      'Flagging 3 operator ID format changes (mid-quarter system migration) — resolved via HR cross-reference',
      'All entries now comparable across batches with consistent operator and phase identifiers'
    ]
  },
  {
    id: 'step-3',
    title_p: 'Running statistical analysis on step completion timing patterns...',
    title_s: 'Statistical analysis complete — 1 anomalous pattern detected in lyophilization phase',
    reasoning: [
      'Computing mean, median, and standard deviation for each manufacturing step across 30 batches',
      'Weighing step: μ=45min, σ=4.2min — normal distribution, no outliers',
      'Compounding step: μ=2.1hr, σ=11min — consistent across all operators',
      'Filling step: μ=3.4hr, σ=18min — within expected range',
      'Lyophilization hold step: ANOMALY DETECTED — bimodal distribution with significant outlier cluster',
      'Flagging lyophilization hold for detailed investigation in next step'
    ]
  },
  {
    id: 'step-4',
    title_p: 'Investigating lyophilization hold time anomaly in detail...',
    title_s: 'Anomaly isolated — Operator OP-247 averaging 2.7hr delay vs 12min norm at lyo hold point',
    reasoning: [
      'Drilling into lyophilization hold step timing across all 30 batches',
      'Normal operators (41 of 42): average hold-to-resume time = 12 minutes (σ=2.1min)',
      'Operator OP-247: average hold-to-resume time = 2 hours 42 minutes — 13.5x the norm',
      'OP-247 delay pattern is consistent: not a one-time event but a systematic behavior',
      'No corresponding equipment alarms or process deviations during these extended holds',
      'Extended holds are within validated limits (8hr max) but represent significant departure from norm'
    ]
  },
  {
    id: 'step-5',
    title_p: 'Correlating anomaly pattern with operator shift assignments...',
    title_s: 'Pattern confirmed in 28 of 30 batches — all during OP-247 assigned shifts',
    reasoning: [
      'Cross-referencing batch manufacturing dates with operator shift schedules',
      'OP-247 was assigned to lyophilization for 28 of 30 batches in Q1',
      'All 28 batches with OP-247 show the extended hold pattern (2.3hr – 3.1hr range)',
      'The 2 batches without OP-247 at lyo station show normal 12min hold times',
      'Pattern correlation: 100% match between OP-247 presence and extended hold times',
      'No other operator shows similar delay patterns at any manufacturing step'
    ]
  },
  {
    id: 'step-6',
    title_p: 'Cross-referencing OP-247 training records in Veeva QMS...',
    title_s: 'Training gap found — OP-247 last GMP training was 14 months ago (12-month cycle required)',
    reasoning: [
      'Querying Veeva Vault training management module for OP-247 training history',
      'Last GMP refresher training: January 8, 2025 — 14 months ago',
      'Company policy requires annual GMP refresher (12-month cycle)',
      'OP-247 training status: OVERDUE by 2 months as of March 2026',
      'Lyophilization-specific SOP training (SOP-LYO-042) last completed: November 2024',
      'Training gap may explain procedural uncertainty leading to extended hold times'
    ]
  },
  {
    id: 'step-7',
    title_p: 'Checking if anomaly is equipment-specific or operator-specific...',
    title_s: 'Confirmed operator-specific — anomaly follows OP-247 across all 3 lyophilizers',
    reasoning: [
      'OP-247 operated on Lyophilizer L-01 (12 batches), L-02 (9 batches), L-03 (7 batches)',
      'Extended hold pattern present on ALL three lyophilizers when OP-247 is assigned',
      'Other operators on same lyophilizers show normal 12min hold times',
      'Equipment maintenance logs: all 3 lyophilizers passed quarterly calibration',
      'Conclusion: anomaly is 100% operator-specific, not equipment-related',
      'Root cause hypothesis: OP-247 procedural uncertainty due to lapsed training'
    ]
  },
  {
    id: 'step-8',
    title_p: 'Generating trend analysis report with operator anomaly findings...',
    title_s: 'Trend analysis report generated — recommending immediate operator retraining',
    reasoning: [
      'Compiling statistical evidence: 28/30 batches affected, 13.5x timing deviation',
      'Documenting root cause analysis: operator-specific pattern, training gap correlation',
      'Risk assessment: no product quality impact (holds within validated limits)',
      'However: extended holds reduce throughput by ~2.5hr per batch (75hr total in Q1)',
      'Regulatory risk: overdue training represents GMP compliance gap',
      'Recommendation: immediate retraining for OP-247 + enhanced monitoring post-training'
    ],
    artifacts: [{ name: 'trend_analysis.pdf', type: 'pdf' }],
    signal: 'APPROVE_RETRAINING_ATC004'
  },
  {
    id: 'step-9',
    title_p: 'Generating operator performance comparison report...',
    title_s: 'Operator comparison report generated — OP-247 benchmarked against 41 peers',
    reasoning: [
      'Creating anonymized operator performance matrix for lyophilization step',
      'OP-247 hold time: 2.7hr avg — ranked 42nd of 42 operators (worst performer)',
      'Next slowest operator: 18min avg — still within 1σ of the 12min mean',
      'OP-247 is a clear statistical outlier: >60σ from the mean',
      'Report includes recommended retraining curriculum and post-training monitoring plan',
      'Comparison data will support QA Manager review and training department action'
    ],
    artifacts: [{ name: 'operator_comparison.pdf', type: 'pdf' }]
  },
  {
    id: 'step-10',
    title_p: 'Creating retraining action item and compliance tracking entry...',
    title_s: 'Action item created — OP-247 retraining scheduled, compliance tracking initiated',
    reasoning: [
      'CAPA-like action item generated: OP-247 GMP refresher + SOP-LYO-042 retraining',
      'Priority: HIGH — overdue training is a GMP compliance finding',
      'Due date: within 14 business days per company retraining policy',
      'Post-training monitoring: OP-247 lyophilization hold times tracked for next 10 batches',
      'Success criteria: hold times return to within 2σ of 12min mean',
      'Quarterly review flag set: re-evaluate in Q2 2026 periodic review'
    ]
  }
];

async function main() {
  console.log(`Starting ${PROCESS_ID} simulation...`);
  await updateProcessListStatus('In Progress', 'Initiating Q1 2026 periodic audit trail review...');

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    updateProcessLog({ ...step, status: 'processing', title: step.title_p });
    await updateProcessListStatus(step.signal ? 'Needs Attention' : 'In Progress', step.title_p);
    await delay(2000);

    if (step.signal) {
      updateProcessLog({ ...step, status: 'warning', title: step.title_s });
      await updateProcessListStatus('Needs Attention', 'Awaiting QA Manager approval for operator retraining...');
      console.log(`Waiting for signal: ${step.signal}`);
      await waitForSignal(step.signal);
      console.log(`Signal received: ${step.signal}`);
      await updateProcessListStatus('In Progress', 'Retraining approved — generating reports...');
      await delay(1000);
    }

    updateProcessLog({ ...step, status: 'success', title: step.title_s });
    await delay(1500);
  }

  await updateProcessListStatus('Needs Review', 'Trend detected — operator retraining recommended');
  console.log(`${PROCESS_ID} simulation complete`);
}

main().catch(console.error);
