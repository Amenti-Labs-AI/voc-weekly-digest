# Contributing

- No secrets in commits (use n8n credentials + `.env`)
- No client PII or real retailer credentials in mocks
- Workflow exports must not embed API keys
- Extend WireMock mappings before adding new HTTP nodes; keep normalize logic in sync with `n8n/lib/normalize-voc.js`
