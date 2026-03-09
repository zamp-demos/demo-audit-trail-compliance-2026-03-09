const fs = require('fs');
const path = require('path');
const http = require('http');

const PROCESS_ID = 'ATC_001';
const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const PORT = process.env.PORT || 3001;

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function readJson(fp) { try { return JSON.parse(fs.readFileSync(fp, 'utf-8')); } catch { return null; } }
function writeJson(fp, d) { fs.writeFileSync(fp, JSON.stringify(d, null, 2)); }

function updateProcessLog(step) {
  const fp = path.join(DATA_DIR, `process_${PROCESS_ID}.json`);
  const data = readJson(fp) || { logs: [] };
  const existing = data.logs.findIndex(l => l.id === step.id);
  if (existing >= 0) data.logs[existing] = step;
  else data.logs.push(step);
  writeJson(fp, data);
}

function updateProcessListStatus(status, currentStatus) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ processId: PROCESS_ID, status, currentStatus });
    const req = http.request({ hostname: 'localhost', port: PORT, path: '/api/update-status', method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => { res.on('data', () => {}); res.on('end', resolve); });
    req.on('error', resolve);
    req.write(postData);
    req.end();
  });
}

async function waitForSignal(signalId, pollInterval = 1500) {
  while (true) {
    const signals = readJson(path.join(DATA_DIR, 'interaction-signals.json')) || {};
    if (signals[signalId]) return true;
    await delay(pollInterval);
  }
}

const steps = [
  {
    id: "step-1",
    title_p: "Connecting to DeltaV DCS audit trail export...",
    title_s: "Connected to DeltaV DCS — 3,847 audit entries retrieved",
    reasoning: [
      "Connected: DeltaV DCS at ATO site via OPC-UA interface",
      "Retrieved: 3,847 entries for Batch BX-2847 (Feb 28 - Mar 2, 2026)",
      "Entries include: setpoint changes, alarm acknowledgments, operator actions, auto-sequences",
      "Data quality: All entries have valid timestamps and user attribution"
    ]
  },
  {
    id: "step-2",
    title_p: "Pulling OSIsoft PI Historian audit trail...",
    title_s: "PI Historian data collected — 2,156 entries with modification tracking",
    reasoning: [
      "Connected: OSIsoft PI System via PI Web API",
      "Retrieved: 2,156 audit entries covering process data modifications and access events",
      "Flagged: 12 manual data entries requiring justification verification",
      "Compression: Standard compression settings confirmed — no suspicious configuration changes"
    ]
  },
  {
    id: "step-3",
    title_p: "Extracting MES batch execution records...",
    title_s: "MES records consolidated — 2,891 entries from electronic batch record",
    reasoning: [
      "Connected: MES batch execution system",
      "Retrieved: 2,891 entries covering material additions, equipment usage, operator sign-offs",
      "Batch phases: Preparation → Compounding → Filtration → Fill → Lyophilization",
      "All phase transitions have corresponding electronic signatures"
    ]
  },
  {
    id: "step-4",
    title_p: "Collecting LIMS sample and test audit trails...",
    title_s: "LIMS audit trail retrieved — 1,847 entries across 23 test methods",
    reasoning: [
      "Connected: LIMS via REST API integration",
      "Retrieved: 1,847 entries covering 23 test methods for Batch BX-2847",
      "Sample chain: 47 samples tracked from collection through final disposition",
      "Result modifications: 3 instances of result re-entry flagged for review"
    ]
  },
  {
    id: "step-5",
    title_p: "Pulling Veeva Vault QMS document audit trail...",
    title_s: "Veeva Vault QMS — 1,506 document lifecycle entries collected",
    reasoning: [
      "Connected: Veeva Vault Quality via REST API",
      "Retrieved: 1,506 entries covering SOPs, deviations, and batch disposition documents",
      "Active deviations: 1 minor deviation (DEV-2026-0847) linked to this batch",
      "Document status: All referenced SOPs are current effective versions"
    ]
  },
  {
    id: "step-6",
    title_p: "Consolidating 12,247 entries into unified timeline...",
    title_s: "Unified timeline created — 12,247 entries normalized across 5 systems",
    reasoning: [
      "Normalized: All timestamps converted to UTC with source system attribution",
      "Deduplicated: 847 overlapping entries between MES and DeltaV consolidated",
      "Timeline: Feb 28 06:00 through Mar 2 18:30 — 84.5 hours of batch activity",
      "Sequencing: All entries ordered chronologically with cross-system linkage IDs",
      "Gaps detected: 4 timing anomalies flagged for detailed analysis"
    ],
    artifacts: [
      { id: "art-timeline", type: "json", label: "Timeline Summary", data: { "Total Entries": "12,247", "Systems": "DeltaV, PI, MES, LIMS, Veeva Vault", "Time Span": "Feb 28 06:00 - Mar 2 18:30 UTC", "Unique Operators": 14, "Timing Anomalies": 4, "Data Modifications": 12 } }
    ]
  },
  {
    id: "step-7",
    title_p: "Running cross-system correlation analysis...",
    title_s: "Cross-system analysis complete — 4 exceptions identified requiring review",
    reasoning: [
      "Correlation: Matched 11,893 entries (97.1%) across system boundaries",
      "Exception 1: 23-minute gap between MES batch step completion and LIMS sample login",
      "Exception 2: PI Historian value edit at 22:47 with no corresponding deviation record",
      "Exception 3: Off-hours DeltaV access by OP-189 at 03:12 without shift documentation",
      "Exception 4: LIMS chromatography data re-integration on sample S-2847-017",
      "Risk scoring: 1 HIGH (data edit), 2 MEDIUM (timing/access), 1 LOW (re-integration)"
    ]
  },
  {
    id: "step-8",
    title_p: "Analyzing Exception #1 — MES-to-LIMS timing gap...",
    title_s: "Exception #1 assessed: 23-min gap — MEDIUM risk, documented justification found",
    reasoning: [
      "Gap: MES records filtration step complete at 14:23, LIMS sample login at 14:46",
      "Expected: Sample should be logged within 5 minutes per SOP-MFG-0112 Section 4.3",
      "Investigation: Checked operator shift log — equipment cleaning documented between steps",
      "Cross-reference: Veeva Vault shows no deviation filed for this delay",
      "Assessment: MEDIUM risk — justification exists in shift log but no formal deviation",
      "Recommendation: Acceptable with documentation note, flag for SOP update consideration"
    ]
  },
  {
    id: "step-9",
    title_p: "Analyzing Exception #2 — PI Historian value modification...",
    title_s: "Exception #2 assessed: PI edit without justification — HIGH risk flagged",
    reasoning: [
      "Finding: Weight check value modified in PI Historian at 22:47 on Mar 1",
      "Original value: 98.2g (recorded by DeltaV at 22:31)",
      "Modified value: 99.1g (manual entry in PI at 22:47 by OP-312)",
      "Documentation check: No deviation, change control, or supervisor note found in Veeva Vault",
      "21 CFR Part 11: Data modification without contemporaneous documentation violates Section 11.10(e)",
      "Assessment: HIGH risk — potential data integrity violation requiring QA Head review"
    ]
  },
  {
    id: "step-10",
    title_p: "Analyzing Exception #3 — Off-hours system access...",
    title_s: "Exception #3 assessed: Off-hours access — MEDIUM risk, shift schedule mismatch",
    reasoning: [
      "Finding: OP-189 accessed DeltaV controls at 03:12 on Mar 1",
      "Shift records: OP-189 not scheduled for night shift (Feb 28-Mar 1)",
      "Action taken: Acknowledged 2 non-critical alarms and viewed batch parameters",
      "Cross-reference: No process modifications made — read-only access confirmed",
      "Assessment: MEDIUM risk — unauthorized access but no data changes made",
      "Recommendation: Investigate access control policy compliance with site security"
    ]
  },
  {
    id: "step-11",
    title_p: "Analyzing Exception #4 — Chromatography re-integration...",
    title_s: "⚠️ Review Required: 4 exceptions summarized — QA approval needed for batch disposition",
    reasoning: [
      "Finding: LIMS chromatography result for sample S-2847-017 re-integrated",
      "Original integration: Peak area 2,847,293 (auto-integration at 09:15)",
      "Re-integration: Peak area 2,891,107 (manual re-integration at 11:42 by analyst A-045)",
      "Justification: Analyst noted baseline noise correction — within SOP-LAB-0089 guidelines",
      "Assessment: LOW risk — re-integration is documented and within acceptable parameters",
      "Overall: 1 HIGH risk exception requires QA Head escalation before batch disposition"
    ],
    artifacts: [
      { id: "art-exception-summary", type: "file", label: "Exception Summary Report", pdfPath: "/data/exception_summary.pdf" }
    ],
    signal: "APPROVE_EXCEPTION_ATC001"
  },
  {
    id: "step-12",
    title_p: "Generating unified audit trail review report...",
    title_s: "Audit trail review complete — report generated for batch disposition file",
    reasoning: [
      "Report generated: Unified Audit Trail Review for Batch BX-2847",
      "Reviewed: 12,247 entries across 5 systems over 84.5 hours",
      "Exceptions: 4 found (1 HIGH, 2 MEDIUM, 1 LOW) — QA reviewer approved 3, escalated 1",
      "Escalated: PI Historian data modification (Exception #2) referred to QA Head",
      "Compliance: Review completed per 21 CFR Part 11 and EU Annex 11 requirements",
      "Time saved: Estimated 18 hours of manual review reduced to 12 minutes automated"
    ],
    artifacts: [
      { id: "art-full-report", type: "file", label: "Unified Audit Trail Report", pdfPath: "/data/unified_audit_trail_report.pdf" },
      { id: "art-video", type: "video", label: "Audit Dashboard Recording", videoPath: "/data/atc_001_audit_dashboard.webm" }
    ]
  }
];

async function main() {
  console.log(`Starting ${PROCESS_ID} simulation...`);
  await updateProcessListStatus('In Progress', 'Connecting to manufacturing systems...');

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    updateProcessLog({ ...step, status: 'processing', title: step.title_p });
    await updateProcessListStatus(
      step.signal ? 'Needs Attention' : 'In Progress',
      step.title_p
    );
    await delay(2000);

    if (step.signal) {
      updateProcessLog({ ...step, status: 'warning', title: step.title_s });
      await updateProcessListStatus('Needs Attention', 'Awaiting QA reviewer approval...');
      console.log(`Waiting for signal: ${step.signal}`);
      await waitForSignal(step.signal);
      console.log(`Signal received: ${step.signal}`);
      await updateProcessListStatus('In Progress', 'QA approval received — continuing...');
      await delay(1000);
    }

    updateProcessLog({ ...step, status: 'success', title: step.title_s });
    await delay(1500);
  }

  await updateProcessListStatus('Needs Attention', 'Review complete — 1 exception escalated to QA Head');
  console.log(`${PROCESS_ID} simulation complete`);
}

main().catch(console.error);
