# Phase 3 --- Retention

## Content Health Score & Analytics

> **Creator OS Phase 3:** RAI Content Virality Score Predictor ---
> Multi-Agent Persona Evaluation Pipeline

Phase 3 adds the **Retention layer** to Creator OS. It evaluates creator
content through a multi-agent audience simulation pipeline and produces
a **Content Health Score** with segment-level analytics and
persona-level drill-down.

The Phase 3 pipeline is designed as:

``` text
Video + Metadata
       ↓
   Orchestrator
       ↓
Multi-Agent Evaluation Panel
       ↓
Aggregation Engine
       ↓
Content Health Score
       ↓
Frontend Score + Analytics
```

The specification defines Phase 3 as the part of Creator OS where full
agentic judgment is appropriate because an incorrect prediction results
in a suggestion rather than financial or legal exposure.

------------------------------------------------------------------------

## 1. Objective

The objective of Phase 3 is to help creators understand **how their
content may perform across different audience perspectives before or
around publication**.

Instead of relying on a single AI opinion, the system evaluates content
through multiple seeded audience personas and combines their results
statistically.

The final system should provide:

-   An overall **Content Health Score**
-   Dimension-level content scores
-   Audience-segment scores
-   Statistical disagreement detection
-   Individual persona evaluations
-   Platform-pattern analysis
-   Actionable content insights
-   A drill-down view of individual persona results

------------------------------------------------------------------------

# 2. End-to-End Workflow

A complete Phase 3 evaluation follows five stages:

### Stage 1 --- Intake

The creator submits:

-   Video/content
-   Platform metadata
-   Content metadata
-   Relevant creator/content information

``` text
Creator
  ↓
Video + Metadata
```

### Stage 2 --- Dispatch

The **Orchestrator** creates and dispatches an evaluation run.

``` text
Video + Metadata
       ↓
  Orchestrator
       ↓
Evaluation Run
```

### Stage 3 --- Multi-Agent Evaluation

The orchestrator sends the content to:

1.  Multiple **PersonaEvaluatorAgents**
2.  One **Platform Pattern Agent**

Persona evaluators represent different audience perspectives.

``` text
                 Evaluation Run
                       ↓
              ┌────────┴────────┐
              ↓                 ↓
       Persona Agents     Platform Pattern
              ↓                 ↓
       Multiple Scores      One Analysis
```

### Stage 4 --- Aggregation

The individual persona results are stored and then aggregated.

The aggregation engine:

-   Computes percentiles
-   Groups results by segment
-   Detects disagreement
-   Produces aggregate metrics

``` text
Persona Results
      ↓
Percentiles
      ↓
Segment Clustering
      ↓
Disagreement Analysis
```

### Stage 5 --- Output

The system exposes the final results to the frontend:

``` text
Final Content Score
        +
Segment Breakdown
        +
Persona Drill-down
        +
Content Insights
```

------------------------------------------------------------------------

# 3. Architecture

``` text
┌───────────────────────────────┐
│       Creator / Frontend      │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│        Content Intake         │
│      Video + Metadata         │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│         Orchestrator          │
│       Evaluation Run          │
└───────────────┬───────────────┘
                │
                ▼
┌────────────────────────────────────────┐
│        Bounded Worker Pool             │
│        Default concurrency: 15         │
│                                        │
│ Persona #1   Persona #48   Persona #100│
│     │             │             │       │
│     └─────────────┼─────────────┘       │
│                   │                     │
│         Generic PersonaEvaluatorAgent   │
│                                        │
│        + Platform Pattern Agent         │
└────────────────────┬───────────────────┘
                     │
                     ▼
┌────────────────────────────────────────┐
│     content_score_persona_results      │
│       One row per persona/run          │
└────────────────────┬───────────────────┘
                     │
                     ▼
┌────────────────────────────────────────┐
│          Aggregation Engine             │
│                                        │
│ • Percentiles                          │
│ • Segment clustering                   │
│ • Disagreement analysis                │
└────────────────────┬───────────────────┘
                     │
                     ▼
┌────────────────────────────────────────┐
│             content_scores             │
│        Final aggregate score            │
└────────────────────┬───────────────────┘
                     │
                     ▼
┌────────────────────────────────────────┐
│             Frontend                    │
│                                        │
│ • Content Health Score                 │
│ • Dimensions                           │
│ • Segment breakdown                    │
│ • Persona drill-down                   │
└────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 4. Persona Evaluation System

## 4.1 Generic PersonaEvaluatorAgent

The system must use **one generic `PersonaEvaluatorAgent`**.

A separate agent implementation should NOT be written for every persona.

Instead, personas are represented as rows in the `evaluator_personas`
seed table.

``` text
evaluator_personas
        │
        ├── Persona #1
        ├── Persona #2
        ├── Persona #3
        ├── ...
        └── Persona #100
                │
                ▼
      PersonaEvaluatorAgent
```

This means adding a future Persona #101 should be a **data insertion**,
not a new code implementation.

------------------------------------------------------------------------

## 4.2 Persona Segments

The Phase 3 specification identifies segment-level aggregation around:

-   **Niche**
-   **Cold Outsider**
-   **Platform-Native**

These segments are used to identify differences in how content is
perceived.

Example:

``` text
Niche Audience       → 87
Cold Outsider        → 64
Platform Native      → 81
```

This can reveal that content is strong within a niche but less
accessible to audiences unfamiliar with it.

------------------------------------------------------------------------

# 5. Persona Evaluation Output

Each persona evaluation should produce structured results that can be
persisted individually.

A conceptual result can contain:

``` json
{
  "persona_id": 48,
  "overall_score": 7.8,
  "hook_score": 8,
  "clarity_score": 7,
  "relevance_score": 9,
  "engagement_score": 8,
  "shareability_score": 6,
  "reason": "Strong opening but the middle becomes repetitive."
}
```

The exact evaluation dimensions should remain aligned with the
implemented scoring specification.

The important architectural requirement is that **each persona's score
is stored individually**.

------------------------------------------------------------------------

# 6. Bounded Worker Pool

The system should not dispatch approximately 100 persona calls without
concurrency control.

The specification defines:

-   Default concurrency: **15**
-   Per-call retries
-   Failure isolation

Conceptually:

``` text
100 Persona Evaluations
          ↓
   ┌───────────────┐
   │ Worker Pool   │
   │               │
   │ 15 concurrent │
   └───────┬───────┘
           ↓
       Results
```

If a persona repeatedly fails:

``` text
Persona Call
    ↓
 Retry
    ↓
 Retry
    ↓
 Still failing
    ↓
Record failure
    ↓
Exclude from aggregation
    ↓
Continue evaluation
```

A failed persona must not stall the entire evaluation run.

------------------------------------------------------------------------

# 7. Platform Pattern Agent

The **Platform Pattern Agent** is separate from the persona panel.

It:

-   Runs once per evaluation
-   Is not a persona
-   Operates alongside the persona evaluation panel
-   Performs benchmark comparison
-   Uses Phase 2's `rate_benchmarks` data extended with engagement
    patterns

``` text
                 Evaluation
                     │
        ┌────────────┴────────────┐
        ↓                         ↓
Persona Evaluation       Platform Pattern Agent
        │                         │
        │                  Benchmark Comparison
        │
        └────────────┬────────────┘
                     ↓
                 Aggregation
```

The Platform Pattern Agent should therefore **not be counted as another
persona**.

------------------------------------------------------------------------

# 8. Data Model

A minimal Phase 3 implementation should contain the following conceptual
tables.

## 8.1 `contents`

Stores the content being evaluated.

``` text
id
creator_id
video_url
platform
content_type
niche
caption
created_at
```

------------------------------------------------------------------------

## 8.2 `evaluator_personas`

Stores the configurable audience personas.

``` text
id
name
segment
description
evaluation_prompt
active
```

The persona table is the source of truth for which personas participate
in an evaluation.

------------------------------------------------------------------------

## 8.3 `content_score_runs`

Represents an individual evaluation execution.

``` text
id
content_id
status
started_at
completed_at
```

Possible statuses can include:

``` text
queued
running
completed
failed
```

------------------------------------------------------------------------

## 8.4 `content_score_persona_results`

Stores individual persona results.

``` text
id
run_id
persona_id
hook_score
clarity_score
engagement_score
relevance_score
shareability_score
overall_score
reason
```

Important:

> Store **one row per persona per evaluation run**.

This allows the frontend to drill down into individual audience
evaluations.

------------------------------------------------------------------------

## 8.5 `content_scores`

Stores the final aggregated score.

``` text
id
run_id
overall_score
niche_score
cold_outsider_score
platform_native_score
disagreement_score
recommendations
```

The exact fields can be extended according to the final scoring
implementation.

------------------------------------------------------------------------

# 9. Aggregation Engine

The aggregation engine should **not simply average all persona
responses**.

The specification requires aggregation using:

-   Percentiles
-   Segment clustering
-   Statistical disagreement

Conceptually:

``` text
Raw Persona Results
        ↓
   ┌───────────────┐
   │ Percentiles    │
   └───────┬───────┘
           ↓
   ┌───────────────┐
   │ Segment Groups │
   └───────┬───────┘
           ↓
   ┌───────────────┐
   │ Disagreement   │
   │ Detection       │
   └───────┬───────┘
           ↓
     Final Score
```

------------------------------------------------------------------------

# 10. Why Segment-Level Aggregation Matters

Suppose the results are:

``` text
Niche Audience        91
Platform Native       82
Cold Outsider         53
```

A single overall average could hide this difference.

Segment-level aggregation makes it possible to communicate:

> Content performs strongly with an existing niche audience but is less
> effective for viewers who have no prior context.

The purpose of aggregation is therefore not just to generate a number,
but to identify **where audience perception differs**.

------------------------------------------------------------------------

# 11. Content Health Score

The frontend should expose a central **Content Health Score**.

Example:

``` text
┌─────────────────────────────────┐
│       CONTENT HEALTH SCORE      │
│                                 │
│              78                 │
│             /100                │
│                                 │
│          Good Potential         │
└─────────────────────────────────┘
```

The score screen should also expose the underlying dimensions and
audience segments.

Example:

``` text
Content Health Score       78

Hook                       84
Engagement                 79
Clarity                    72
Relevance                  86
Shareability               68
```

The exact dimensions and calculation must follow the implemented scoring
specification.

------------------------------------------------------------------------

# 12. Audience Segment Dashboard

The score screen should make segment differences visible.

``` text
AUDIENCE BREAKDOWN

Niche Audience       █████████░ 87
Platform Native      ████████░░ 81
Cold Outsider        ██████░░░░ 64
```

If a meaningful difference is detected, the UI should surface it as an
insight.

Example:

``` text
⚠ Audience disagreement detected

Your content performs strongly with niche audiences,
but significantly weaker with cold viewers.
```

------------------------------------------------------------------------

# 13. Persona Drill-Down

Every individual persona result must remain accessible.

The frontend should provide a dedicated drill-down experience.

Conceptually:

``` text
Audience Analysis

Niche Expert
Score: 91
"Strong subject relevance..."

Cold Viewer
Score: 53
"Context is unclear..."

Platform Native
Score: 82
"Hook fits platform conventions..."
```

The specification identifies:

``` text
/score
/score/personas
```

as the API surface for aggregate scoring and persona-level drill-down.

------------------------------------------------------------------------

# 14. API Surface

A minimal API structure can be:

## Start analysis

``` http
POST /content/analyze
```

Creates or starts a content evaluation run.

------------------------------------------------------------------------

## Get final score

``` http
GET /score
```

Returns the aggregate Content Health Score and summary analytics.

------------------------------------------------------------------------

## Get persona results

``` http
GET /score/personas
```

Returns individual persona evaluations for drill-down.

------------------------------------------------------------------------

# 15. Suggested Frontend Screens

## Screen 1 --- Analyze Content

``` text
ANALYZE NEW CONTENT

[ Upload Video ]

Platform
[ Instagram ▼ ]

Content Type
[ Reel ▼ ]

Niche
[ Fashion ]

Target Audience
[ Gen Z ]

[ ANALYZE CONTENT ]
```

------------------------------------------------------------------------

## Screen 2 --- Evaluation in Progress

``` text
ANALYZING CONTENT...

✓ Video received
✓ Metadata processed
✓ Evaluation started

AI Audience Panel

██████████████░░░░ 72%

Evaluating audience personas...

✓ Niche Audience
✓ Cold Outsider
✓ Platform Native
...
```

------------------------------------------------------------------------

## Screen 3 --- Content Health Score

``` text
CONTENT HEALTH SCORE

          78 / 100

Hook              84
Engagement        79
Clarity           72
Relevance         86
Shareability      68
```

------------------------------------------------------------------------

## Screen 4 --- Audience Analytics

``` text
AUDIENCE BREAKDOWN

Niche Audience       87
Platform Native      81
Cold Outsider        64

⚠ Audience disagreement detected
```

------------------------------------------------------------------------

## Screen 5 --- Persona Drill-Down

``` text
PERSONA ANALYSIS

Persona
    ↓
Segment
    ↓
Score
    ↓
Evaluation
    ↓
Reasoning / Feedback
```

------------------------------------------------------------------------

# 16. Failure Handling

A single persona failure should not fail the entire run.

Required behavior:

``` text
Persona failure
      ↓
Retry
      ↓
Retry exhausted
      ↓
Record failed persona
      ↓
Exclude from successful aggregation
      ↓
Continue remaining evaluation
```

The system should retain enough run-level information to identify failed
evaluations.

------------------------------------------------------------------------

# 17. Phase 3 Implementation Order

Build Phase 3 incrementally.

### Step 1 --- Database

Create:

``` text
contents
evaluator_personas
content_score_runs
content_score_persona_results
content_scores
```

### Step 2 --- Content Intake

Implement:

``` text
Upload content
       ↓
Store metadata
       ↓
Create evaluation run
```

### Step 3 --- Orchestrator

Implement the evaluation lifecycle:

``` text
queued
  ↓
running
  ↓
evaluation
  ↓
aggregation
  ↓
completed
```

### Step 4 --- Persona Agent

Implement **one generic `PersonaEvaluatorAgent`**.

Start with a small number of personas for development/testing.

For example:

``` text
5 personas
    ↓
10
    ↓
25
    ↓
50
    ↓
100
```

### Step 5 --- Worker Pool

Introduce bounded concurrency:

``` text
Default: 15 concurrent evaluations
```

Add retries and failure isolation.

### Step 6 --- Platform Pattern Agent

Add the separate platform-pattern evaluation using the Phase 2 benchmark
foundation.

### Step 7 --- Aggregation

Implement:

``` text
Persona Results
     ↓
Percentiles
     ↓
Segment Clustering
     ↓
Disagreement
     ↓
Final Score
```

### Step 8 --- API

Expose:

``` text
POST /content/analyze
GET  /score
GET  /score/personas
```

### Step 9 --- Frontend

Build:

1.  Upload screen
2.  Evaluation progress screen
3.  Content Health Score screen
4.  Segment analytics
5.  Persona drill-down

### Step 10 --- Integration

Connect Phase 3 with the existing Creator OS foundation.

``` text
Phase 1
Agency Operations
       ↓
Phase 2
Trust + Benchmarking
       ↓
Phase 3
Retention + Content Intelligence
```

------------------------------------------------------------------------

# 18. Phase 3 Success Criteria

Phase 3 can be considered functionally complete when:

-   [ ] Creator can submit content for analysis
-   [ ] An evaluation run is created
-   [ ] Personas are loaded dynamically from `evaluator_personas`
-   [ ] One generic PersonaEvaluatorAgent evaluates each persona
-   [ ] Persona calls run through bounded concurrency
-   [ ] Failed persona calls are retried
-   [ ] Failed personas do not stall the entire run
-   [ ] Every successful persona result is persisted
-   [ ] Platform Pattern Agent runs once per evaluation
-   [ ] Persona results are aggregated by segment
-   [ ] Percentile-based aggregation is implemented
-   [ ] Audience disagreement can be surfaced
-   [ ] Final Content Health Score is generated
-   [ ] `/score` returns aggregate results
-   [ ] `/score/personas` exposes persona-level results
-   [ ] Frontend displays the score and segment breakdown
-   [ ] Frontend supports persona drill-down

------------------------------------------------------------------------

# 19. Key Design Principles

### 1. One generic agent, many personas

Do not create separate code for every persona.

### 2. Data-driven personas

Adding a new persona should require a database/seed-data change rather
than new application code.

### 3. Bounded concurrency

Use a worker pool with a default concurrency of 15.

### 4. Failure isolation

One failed persona must not stop the complete evaluation.

### 5. Persist raw results

Keep every individual persona result so the frontend can drill down
later.

### 6. Aggregate by segment

Do not hide audience disagreement behind one simple average.

### 7. Platform agent ≠ persona

The Platform Pattern Agent runs once and remains separate from the
persona panel.

### 8. Reuse Phase 2 data

The Platform Pattern Agent should use the existing Phase 2 benchmark
foundation extended with engagement patterns.

### 9. Agentic judgment is limited to content intelligence

Phase 3 is the appropriate place for full agentic judgment because the
output is a recommendation rather than a financial or legal decision.

------------------------------------------------------------------------

# 20. Final Architecture Summary

``` text
                    CREATOR OS
                        │
        ┌───────────────┼────────────────┐
        │               │                │
     PHASE 1         PHASE 2          PHASE 3
   Operations        Trust Layer      Retention
        │               │                │
        │          Benchmarks            │
        │               │                │
        │               └────────┐       │
        │                        │       │
        └────────────────────────┼───────┘
                                 │
                                 ▼
                         Content Evaluation
                                 │
                                 ▼
                           Orchestrator
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
              Persona Panel           Platform Pattern
                    │                     Agent
                    │
             Worker Pool
             Concurrency 15
                    │
                    ▼
           Persona Results
                    │
                    ▼
              Aggregation
                    │
          ┌─────────┼──────────┐
          ▼         ▼          ▼
      Percentiles Segments  Disagreement
          │         │          │
          └─────────┼──────────┘
                    ▼
          CONTENT HEALTH SCORE
                    │
          ┌─────────┼──────────┐
          ▼         ▼          ▼
       Overall   Audience   Persona
        Score    Analytics  Drill-down
                    │
                    ▼
              Creator Insights
```

------------------------------------------------------------------------

## Reference

This README follows the Phase 3 architecture and terminology defined in
the **Creator OS --- Phase-by-phase build wireframes** specification,
particularly the Phase 3 sections covering the pipeline overview,
persona fan-out, aggregation, worker pool, segment clustering, persona
persistence, and score endpoints.
