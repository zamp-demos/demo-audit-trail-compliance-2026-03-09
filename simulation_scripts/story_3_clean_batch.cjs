const fs = require('fs');
const path = require('path');
const http = require('http');

const PROCESS_ID = 'ATC_003';
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

const steps = [
  {
    id: 'step-1',
    title_p: 'Pulling audit trails from 5 source systems for Batch BX-2849...',
    title_s: 'Collected 9,847 audit entries from DeltaV, PI Historian, Syncade MES, Veeva QMS, and EMS',
    reasoning: [
      'Connecting to DeltaV DCS — extracted 3,412 process parameter change records',
      'Querying PI Historian — pulled 2,891 continuous data points with timestamps',
      'Accessing Syncade MES — retrieved 1,847 electronic batch record entries',
      'Scanning Veeva Vault QMS — found 1,204 quality event and deviation logs',
      'Pulling EMS data — collected 493 environmental monitoring readings',
      'Total: 9,847 audit trail entries across all systems for Batch BX-2849 (Prolia 60mg, ATO facility)'
    ]
  },
  {
    id: 'step-2',
    title_p: 'Consolidating entries into unified chronological timeline...',
    title_s: 'Unified timeline created — 9,847 entries mapped to common timestamp format',
    reasoning: [
      'Normalizing DeltaV timestamps from UTC to facility local time (EST)',
      'Converting PI Historian epoch timestamps to ISO 8601 format',
      'Mapping Syncade batch step IDs to manufacturing phase labels',
      'Resolving 14 operator ID discrepancies between MES and DCS (badge vs. login)',
      'All 9,847 entries now in single chronological sequence with standardized fields'
    ]
  },
  {
    id: 'step-3',
    title_p: 'Checking timeline continuity for gaps in audit coverage...',
    title_s: 'Timeline continuity verified — no gaps exceeding 5-minute threshold detected',
    reasoning: [
      'Scanning for temporal gaps between consecutive entries across all systems',
      'Largest gap found: 3 min 42 sec during shift handover at 06:58 EST (within tolerance)',
      'All 47 critical process steps have continuous audit coverage',
      'Environmental monitoring maintained unbroken 60-second intervals throughout batch',
      'Assessment: PASS — no audit trail continuity concerns'
    ]
  },
  {
    id: 'step-4',
    title_p: 'Comparing DeltaV process values against PI Historian records...',
    title_s: 'Data integrity confirmed — all DeltaV values match PI Historian within tolerance',
    reasoning: [
      'Cross-referencing 2,891 PI Historian data points against corresponding DeltaV records',
      'Temperature readings: 100% match within ±0.01°C instrument precision',
      'Pressure values: 100% match within ±0.1 mbar calibration tolerance',
      'pH measurements: 100% match within ±0.005 unit sensor accuracy',
      'Flow rates: 100% match — no unexplained modifications detected',
      'Assessment: PASS — zero data integrity discrepancies found'
    ]
  },
  {
    id: 'step-5',
    title_p: 'Reviewing operator access authorization for all batch actions...',
    title_s: 'Access authorization verified — all 11 operators properly credentialed for their actions',
    reasoning: [
      'Extracted unique operator IDs: 11 personnel involved in batch manufacturing',
      'Cross-referencing each action against operator training matrix in Veeva QMS',
      'Verifying electronic signature compliance per 21 CFR Part 11 requirements',
      'All operators had valid GMP training certificates at time of batch execution',
      'No unauthorized access attempts or privilege escalation events detected',
      'Assessment: PASS — full access authorization compliance confirmed'
    ]
  },
  {
    id: 'step-6',
    title_p: 'Validating manufacturing step sequence against master batch record...',
    title_s: 'Sequence validation passed — all steps executed in correct manufacturing order',
    reasoning: [
      'Comparing actual execution sequence against approved Master Batch Record (MBR-PRO-2849)',
      'Weighing → Compounding → Filling → Lyophilization → Stoppering → Capping: correct order verified',
      'All in-process checks (IPC) executed at prescribed hold points',
      'No out-of-sequence operations or unauthorized step repetitions detected',
      'Hold times between steps within validated ranges (max 4hr actual vs 8hr limit)',
      'Assessment: PASS — manufacturing sequence fully compliant with MBR'
    ]
  },
  {
    id: 'step-7',
    title_p: 'Generating clean batch audit trail summary report...',
    title_s: 'Clean batch summary generated — all 6 review categories passed',
    reasoning: [
      'Compiling results from timeline continuity, data integrity, access control, and sequence checks',
      'All 6 audit categories scored GREEN: continuity, integrity, authorization, sequence, signatures, environmental',
      'Zero deviations, zero unauthorized changes, zero data integrity failures',
      'Batch BX-2849 audit trail review meets all ICH Q7 and 21 CFR Part 11 requirements',
      'Report generated: clean_batch_review.pdf — ready for QA reviewer signature'
    ],
    artifacts: [{ name: 'clean_batch_review.pdf', type: 'pdf' }]
  },
  {
    id: 'step-8',
    title_p: 'Generating compliance scorecard for batch disposition...',
    title_s: 'Compliance scorecard complete — 100% pass rate across all checkpoints',
    reasoning: [
      'Scoring 47 critical compliance checkpoints against FDA/EMA requirements',
      'Electronic signatures: 47/47 compliant with 21 CFR Part 11 (meaning, manifestation, linking)',
      'Audit trail integrity: 9,847/9,847 entries verified — no tampering indicators',
      'Data governance: all original values preserved, change reasons documented',
      'Environmental monitoring: 493 readings all within validated limits',
      'Overall compliance score: 100% — batch eligible for disposition without exceptions'
    ],
    artifacts: [{ name: 'compliance_scorecard.pdf', type: 'pdf' }]
  },
  {
    id: 'step-9',
    title_p: 'Submitting batch for auto-approval disposition pathway...',
    title_s: 'Batch BX-2849 approved for disposition — clean audit trail, no exceptions required',
    reasoning: [
      'All 6 audit review categories passed without exceptions',
      'Compliance scorecard: 100% — meets auto-approval threshold (>98%)',
      'Batch BX-2849 (Prolia 60mg) cleared for release to packaging and distribution',
      'Audit trail review completed in 4 minutes 12 seconds (vs. estimated 18 hours manual review)',
      'Full audit record archived to Veeva Vault for regulatory retention (minimum 7 years)',
      'QA notification sent — batch disposition paperwork ready for final signature'
    ]
  }
];

async function main() {
  console.log(`Starting ${PROCESS_ID} simulation...`);
  await updateProcessListStatus('In Progress', 'Initiating clean batch audit trail review...');

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    updateProcessLog({ ...step, status: 'processing', title: step.title_p });
    await updateProcessListStatus('In Progress', step.title_p);
    await delay(2000);

    updateProcessLog({ ...step, status: 'success', title: step.title_s });
    await delay(1500);
  }

  await updateProcessListStatus('Done', 'Clean review complete — batch approved for disposition');
  console.log(`${PROCESS_ID} simulation complete`);
}

main().catch(console.error);
