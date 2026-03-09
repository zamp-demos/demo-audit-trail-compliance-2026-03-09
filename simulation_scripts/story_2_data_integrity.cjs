const fs = require('fs');
const path = require('path');
const http = require('http');

const PROCESS_ID = 'ATC_002';
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
    const s = readJson(path.join(DATA_DIR, 'interaction-signals.json')) || {};
    if (s[signalId]) return true;
    await delay(poll);
  }
}

const steps = [
  {
    id: "step-1",
    title_p: "Connecting to DeltaV DCS — retrieving original process values...",
    title_s: "DeltaV DCS connected — 2,341 original weight check recordings retrieved",
    reasoning: [
      "Connected: DeltaV DCS at ARI site for Batch BX-2851 (Repatha 140mg)",
      "Retrieved: 2,341 raw process recordings including in-process weight checks",
      "Focus: Weight check events at Fill Station FS-03 on Mar 1, 2026",
      "Source values: 98.2g (22:31), 97.8g (22:36), 98.5g (22:39) — direct DCS recordings",
      "These are the ground-truth values recorded by the automated weighing system"
    ]
  },
  {
    id: "step-2",
    title_p: "Connecting to PI Historian — retrieving stored values...",
    title_s: "PI Historian connected — stored values retrieved for comparison",
    reasoning: [
      "Connected: OSIsoft PI System via PI Web API",
      "Retrieved: Corresponding weight check values from PI archive",
      "Stored values: 100.1g (22:47), 100.0g (22:49), 100.3g (22:53)",
      "Observation: PI values recorded 16-14 minutes AFTER DeltaV originals",
      "Timestamp pattern: All three modifications occurred within a 6-minute window"
    ]
  },
  {
    id: "step-3",
    title_p: "Running automated value comparison algorithm...",
    title_s: "Comparison complete — 3 discrepancies detected between DCS and Historian",
    reasoning: [
      "Algorithm: Paired DeltaV source values with PI Historian stored values by tag ID",
      "Discrepancy 1: Tag WT-FS03-001 — DeltaV: 98.2g → PI: 100.1g (delta: +1.9g, 1.93%)",
      "Discrepancy 2: Tag WT-FS03-002 — DeltaV: 97.8g → PI: 100.0g (delta: +2.2g, 2.25%)",
      "Discrepancy 3: Tag WT-FS03-003 — DeltaV: 98.5g → PI: 100.3g (delta: +1.8g, 1.83%)",
      "Pattern: All modifications increase values toward 100g specification target",
      "Statistical: Probability of 3 random errors trending in same direction < 0.1%"
    ],
    artifacts: [
      { id: "art-comparison", type: "json", label: "Value Comparison Detail", data: { "Tag WT-FS03-001": { "DeltaV Original": "98.2g at 22:31", "PI Stored": "100.1g at 22:47", "Delta": "+1.9g (+1.93%)" }, "Tag WT-FS03-002": { "DeltaV Original": "97.8g at 22:36", "PI Stored": "100.0g at 22:49", "Delta": "+2.2g (+2.25%)" }, "Tag WT-FS03-003": { "DeltaV Original": "98.5g at 22:39", "PI Stored": "100.3g at 22:53", "Delta": "+1.8g (+1.83%)" }, "Pattern": "All values increased toward 100g specification target" } }
    ]
  },
  {
    id: "step-4",
    title_p: "Identifying user who made modifications...",
    title_s: "Modifier identified: OP-312, all changes made between 22:41-22:53",
    reasoning: [
      "PI Audit trail: All 3 modifications attributed to user ID OP-312",
      "Session: Single login session from workstation WS-ARI-047",
      "Timeline: Modifications at 22:47, 22:49, 22:53 — all within 6 minutes",
      "Context: Second shift ended at 22:00, OP-312 not on third shift roster",
      "Access: OP-312 has Level 3 PI access (read/write) — authorized but unusual timing"
    ]
  },
  {
    id: "step-5",
    title_p: "Searching for supporting documentation in Veeva Vault...",
    title_s: "Documentation search complete — NO deviation or change control found",
    reasoning: [
      "Searched: Veeva Vault QMS for deviations linked to Batch BX-2851",
      "Result: No deviation record filed for weight check discrepancies",
      "Searched: Change control records for PI Historian data corrections",
      "Result: No change control request found for Mar 1 modifications",
      "Searched: Supervisor notes and shift handover documentation",
      "Result: No documented justification for data modification by OP-312",
      "ALCOA+ violation: Modifications are not Attributable (no justification) or Contemporaneous"
    ]
  },
  {
    id: "step-6",
    title_p: "Classifying severity per 21 CFR Part 11 framework...",
    title_s: "Classification: HIGH severity — 21 CFR Part 11 Section 11.10(e) violation",
    reasoning: [
      "Violation: Section 11.10(e) — audit trails not adequate (modification without documentation)",
      "Aggravating: All values adjusted upward toward specification, suggesting intentional manipulation",
      "Aggravating: Modifications made outside scheduled shift hours",
      "Aggravating: No contemporaneous documentation of reason for changes",
      "Severity: HIGH — potential deliberate data falsification per FDA guidance",
      "Reference: FDA Data Integrity Guidance (2018) classifies undocumented modifications as HIGH risk"
    ],
    artifacts: [
      { id: "art-integrity-report", type: "file", label: "Data Integrity Comparison Report", pdfPath: "/data/data_integrity_comparison.pdf" }
    ]
  },
  {
    id: "step-7",
    title_p: "Preparing batch hold recommendation for QA Head...",
    title_s: "⚠️ Critical: Data integrity violation detected — QA Head approval required for batch hold",
    reasoning: [
      "Recommendation: IMMEDIATE BATCH HOLD for BX-2851",
      "Basis: Three unauthorized data modifications with no documented justification",
      "Regulatory: 21 CFR Part 11 violation requiring formal investigation",
      "Impact: Batch cannot be released until investigation concludes",
      "Required actions: Formal deviation, root cause investigation, OP-312 interview",
      "Escalation: QA Head must approve batch hold and initiate investigation"
    ],
    signal: "APPROVE_HOLD_ATC002"
  },
  {
    id: "step-8",
    title_p: "Executing batch hold and notifying stakeholders...",
    title_s: "Batch BX-2851 placed on hold — investigation initiated",
    reasoning: [
      "Hold executed: Batch BX-2851 status changed to HOLD in MES",
      "Deviation created: DEV-2026-0923 — Data Integrity Investigation",
      "Notifications sent: QA Head, Site Director, Regulatory Affairs",
      "OP-312: Account temporarily suspended pending investigation",
      "Timeline: Investigation must complete within 30 business days per SOP-QA-0045"
    ]
  },
  {
    id: "step-9",
    title_p: "Generating user activity log for investigation...",
    title_s: "Complete activity log generated for OP-312 across all systems",
    reasoning: [
      "Scope: All OP-312 system access from Feb 15 — Mar 5, 2026",
      "DeltaV: 47 sessions, 12 during off-hours (pattern of late-night access)",
      "PI Historian: 23 data modifications in past 30 days (3x site average)",
      "MES: Normal activity pattern, no anomalies detected",
      "Cross-batch: Checking if similar modifications exist on other recent batches",
      "Finding: 2 additional batches (BX-2843, BX-2846) show similar PI edit patterns"
    ],
    artifacts: [
      { id: "art-activity-log", type: "file", label: "OP-312 Activity Log", pdfPath: "/data/user_activity_log.pdf" }
    ]
  },
  {
    id: "step-10",
    title_p: "Finalizing investigation package...",
    title_s: "Investigation package complete — data integrity violation documented",
    reasoning: [
      "Package includes: Value comparison, user activity log, system access history",
      "Scope expanded: 2 additional batches flagged for retrospective review",
      "Regulatory impact: Potential 483 observation if found during FDA inspection",
      "Corrective actions recommended: Access control review, enhanced monitoring",
      "Estimated investigation timeline: 15-20 business days",
      "Status: Batch on hold, investigation in progress, QA Head notified"
    ],
    artifacts: [
      { id: "art-video", type: "video", label: "PI Historian Analysis Recording", videoPath: "/data/atc_002_data_integrity.webm" }
    ]
  }
];

async function main() {
  console.log(`Starting ${PROCESS_ID} simulation...`);
  await updateProcessListStatus('In Progress', 'Initiating data integrity verification...');

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    updateProcessLog({ ...step, status: 'processing', title: step.title_p });
    await updateProcessListStatus(step.signal ? 'Needs Attention' : 'In Progress', step.title_p);
    await delay(2000);

    if (step.signal) {
      updateProcessLog({ ...step, status: 'warning', title: step.title_s });
      await updateProcessListStatus('Needs Attention', 'Awaiting QA Head approval for batch hold...');
      console.log(`Waiting for signal: ${step.signal}`);
      await waitForSignal(step.signal);
      console.log(`Signal received: ${step.signal}`);
      await updateProcessListStatus('In Progress', 'Batch hold approved — executing...');
      await delay(1000);
    }

    updateProcessLog({ ...step, status: 'success', title: step.title_s });
    await delay(1500);
  }

  await updateProcessListStatus('Needs Attention', 'Data integrity violation confirmed — batch on hold pending investigation');
  console.log(`${PROCESS_ID} simulation complete`);
}

main().catch(console.error);
