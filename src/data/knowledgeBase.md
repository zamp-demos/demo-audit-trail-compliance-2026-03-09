# Audit Trail & Compliance Monitoring - Knowledge Base

## Overview

This process automates the review and analysis of audit trails across manufacturing systems for pharmaceutical batch disposition. Instead of manually collecting and reviewing thousands of audit trail entries from disparate systems (DeltaV DCS, OSIsoft PI Historian, MES, LIMS, Veeva Vault QMS), Pace consolidates entries into a unified timeline, detects anomalies, flags data integrity violations, and generates compliance-ready review reports.

## Why This Matters

- **Audit trail review is the #1 bottleneck in batch release** — taking 15-40+ hours per batch across multiple systems
- **Data integrity failures are the #1 FDA citation** in 2024-2025, with 65%+ of Warning Letters citing 21 CFR Part 11 gaps
- **Manual review misses patterns** that only emerge when correlating entries across systems and batches
- **FDA supports review-by-exception** when automated systems can reliably detect anomalies, reducing review burden by 70-80%

## Systems in Scope

### DeltaV DCS (Emerson)
The distributed control system that runs the manufacturing process. Generates audit trail entries for every setpoint change, alarm acknowledgment, operator action, and system event. Typical batch generates 2,000-4,000 DCS audit entries.

### OSIsoft PI Historian
Stores time-series process data (temperatures, pressures, weights, pH, dissolved oxygen). Audit trail tracks data modifications, manual entries, compression changes, and access events. Critical for detecting unauthorized data modifications.

### MES (Manufacturing Execution System)
Records batch execution steps, material additions, equipment usage, operator sign-offs, and deviations. The electronic batch record lives here. Generates 1,500-3,000 audit entries per batch.

### LIMS (Laboratory Information Management System)
Tracks sample collection, test execution, result entry, out-of-spec investigations, and result approvals. Audit trail covers data entry, modifications, and review workflows.

### Veeva Vault QMS
Quality management system housing SOPs, deviations, CAPAs, change controls, and batch disposition records. Audit trail tracks document lifecycle, electronic signatures, and workflow approvals.

## What Pace Reviews

### Cross-System Timeline Consolidation
Pace pulls audit trail exports from all five systems, normalizes timestamps, and creates a single chronological timeline. This alone saves 4-8 hours per batch (the manual data collection step).

### Exception Detection Categories

1. **Timing Gaps**: Unexplained gaps between expected sequential events across systems (e.g., MES records batch step completion but LIMS sample not logged for 23 minutes)
2. **Data Modifications Without Justification**: PI Historian entries showing value changes without corresponding deviation or change control in Veeva Vault
3. **Off-Hours Access**: System access outside normal operating hours without documented justification
4. **Sequence Violations**: Events occurring out of expected manufacturing sequence
5. **Failed Login Attempts**: Repeated authentication failures that could indicate unauthorized access attempts
6. **Re-processing Events**: Chromatography re-integrations, recalculations, or result deletions in LIMS
7. **Orphaned Entries**: Audit entries in one system with no corresponding entry in related systems

### Data Integrity Verification
Pace compares original values recorded at the DCS level against what's stored in the PI Historian. Any discrepancy between source data and historian data triggers a HIGH severity flag — this is the exact finding that leads to FDA Warning Letters.

### Periodic Trend Analysis
Beyond single-batch review, Pace analyzes patterns across 30+ batches to detect:
- Operator-specific timing anomalies (one operator consistently slower at certain steps)
- Equipment-correlated deviations
- Shift-based patterns in exception rates
- Gradual drift in process parameters

## Compliance Framework

### 21 CFR Part 11
FDA regulation governing electronic records and electronic signatures. Requires that audit trails be computer-generated, timestamped, and cannot be modified. Pace verifies these properties across all systems.

### EU Annex 11
European equivalent requiring audit trail review as part of batch release. Emphasizes risk-based approach to review — exactly what Pace enables through automated exception detection.

### ALCOA+ Principles
Data integrity framework: Attributable, Legible, Contemporaneous, Original, Accurate + Complete, Consistent, Enduring, Available. Pace checks each principle against audit trail entries.

### FDA Guidance on Data Integrity (2018)
Explicitly supports "review by exception" approach when validated computer systems can reliably flag anomalies. This is the regulatory basis for Pace's approach.

## Review Outcomes

- **Clean Batch**: All audit trails consistent, no exceptions found → auto-generate compliance summary for batch disposition
- **Exceptions Found**: Anomalies detected requiring QA review → flag specific entries with context and recommended actions
- **Data Integrity Violation**: Evidence of unauthorized data modification → immediate escalation to QA Head, potential batch hold
- **Trend Alert**: Cross-batch patterns detected → flag for periodic review with statistical analysis

## Amgen-Specific Context

Amgen operates manufacturing sites at Thousand Oaks (ATO), West Greenwich (ARI), Juncos (Puerto Rico), and Breda (Netherlands). Their RT-MSPM platform (SIMCA-online) handles real-time process parameter monitoring. Pace operates at the compliance layer above RT-MSPM — while SIMCA monitors whether the process is in control, Pace monitors whether the audit trail is complete, consistent, and compliant.
