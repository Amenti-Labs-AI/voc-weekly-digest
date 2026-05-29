# VOC weekly digest

Executive **voice-of-customer** digest for consumer products manufacturers: normalize reviews and returns from multiple channels, rank by **corroboration** (not raw sentiment), and push an exception-only brief to Slack/email.

**Differentiator vs Amazon Seller Central:** Seller Central is Amazon-only and operator-focused. This layer adds cross-retailer + DTC + **returns corroboration**, portfolio-level ranking, and role-ready actions.

## Stack

| Service | Port | Purpose |
|---------|------|---------|
| [n8n](https://n8n.io) | 5678 | Weekly workflow orchestration |
| [WireMock](https://wiremock.org) | 8080 | MVP mock APIs (swap URLs for production) |

## Quick start

```bash
cp .env.example .env
docker compose up -d
```

| URL | Use |
|-----|-----|
| http://localhost:5678 | n8n UI (create owner account on first visit) |
| http://localhost:8080/__admin | WireMock admin |
| http://localhost:8080/mock/amazon/feedback/topics?asin=B000000001 | Sample Amazon-style topics |

### Import workflow

1. Open n8n → **Workflows** → **Import from file**
2. Choose `n8n/workflows/voc-weekly-digest.json`
3. **Execute workflow** (manual) to test before enabling schedule

MVP digest is built in a **Code** node (no OpenAI required). Add an OpenAI node after normalize for richer prose (V2).

## Mock API contract

| Source | GET path | Simulates |
|--------|----------|-----------|
| Amazon | `/mock/amazon/feedback/topics?asin=` | SP-API Customer Feedback–style topics |
| DTC | `/mock/dtc/reviews?sku=&since=7d` | Review app (Shopify/Judge.me shape) |
| Marketplace | `/mock/marketplace/reviews?retailer=walmart&itemId=` | Retailer PDP reviews |
| ERP | `/mock/erp/returns?period=current` | Weekly return reason rollup |

From n8n containers use `http://wiremock:8080` (set in compose as `VOC_MOCK_BASE_URL`).

## Configuration

Copy and edit:

```bash
cp config/client-profile.example.json config/client-profile.json
```

`client-profile.json` is gitignored. It defines SKU/ASIN mapping, **theme taxonomy**, and corroboration thresholds.

## Product logic (secret sauce)

1. **Normalize** all sources to a shared VOC schema
2. **Corroboration score** per theme: count agreeing sources + returns weight
3. **Exception-only**: skip digest output when no theme meets `minCorroborationScore`
4. **Role-ready sections** in brief: Act now · Watch list · Sources

See `docs/architecture.md` and `docs/differentiation.md`.

## Production swap

Replace mock base URL with real connectors (SP-API, review app, ERP). Keep the normalize + corroboration nodes unchanged.

## License

MIT — see [LICENSE](LICENSE).

## Related

- Planning skill: `amenti-labs-admin` → `/n8n-automation-plan`
- Sanitized public recipe (optional): `Amenti-Labs-AI/n8n-automation-playbook` when published
