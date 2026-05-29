# Architecture

```mermaid
flowchart LR
  subgraph mocks [WireMock MVP]
    AMZ[Amazon topics]
    DTC[DTC reviews]
    MKT[Marketplace reviews]
    ERP[ERP returns]
  end
  subgraph n8n [n8n]
    CRON[Schedule weekly]
    FETCH[HTTP x4]
    MERGE[Merge]
    NORM[Normalize and corroborate]
    IF{Actionable?}
    BRIEF[Build digest]
    OUT[Slack / Email V2]
  end
  CRON --> FETCH
  mocks --> FETCH
  FETCH --> MERGE --> NORM --> IF
  IF -->|yes| BRIEF --> OUT
  IF -->|no| SKIP[No digest]
```

## Corroboration score

Per theme (from taxonomy in `client-profile.json`):

- +1 for each source that mentions the theme (max 3 from review-like sources)
- +2 if ERP returns include a matching reason bucket
- Themes with `score >= minCorroborationScore` appear under **Act now**
- Lower scores → **Watch list** or omitted

## Exception-only

If no theme meets threshold after normalize, workflow ends without sending (log "All clear" in execution).
