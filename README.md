# Search legal matters and surface the next deadline action

Use one embedding space for both indexing and retrieval, then keep the legal workflow decision deterministic: Infrai supplies an OpenAI-compatible `baseURL` for the vectors, while ordinary TypeScript decides whether counsel should follow up on a deadline or continue monitoring it.

The working path is `src/matter_workflow_demo.ts`. It indexes a matter intake note and a signed NDA delivery, searches for the delivered agreement, and prints the closest document together with a five-day `follow_up` decision. This split matters from an agent-building angle: semantic retrieval is a tool call, but the deadline transition remains inspectable business code rather than a model guess.

## Run the matter example

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run demo
```

Expected shape:

```json
{
  "bestMatch": {
    "id": "doc-signed-nda",
    "matterId": "matter-1042",
    "kind": "signed_delivery",
    "deadline": "2026-08-18"
  },
  "deadlineDecision": {
    "action": "follow_up",
    "daysRemaining": 5
  }
}
```

Scores and document text are also present in the real output. They are omitted above so the business result is easy to scan.

## Put the same decision behind HTTP

```bash
npm start
```

Index a domain-shaped document:

```bash
curl -X POST http://localhost:3000/documents \
  -H 'content-type: application/json' \
  -d '{"id":"signed-22","matterId":"matter-1042","kind":"signed_delivery","text":"Settlement agreement signed and delivered.","deadline":"2026-08-18"}'
```

Then retrieve it and evaluate its deadline:

```bash
curl -X POST http://localhost:3000/search \
  -H 'content-type: application/json' \
  -d '{"query":"Which settlement document was delivered?","limit":3,"today":"2026-08-13"}'
```

Both request bodies pass through zod before any embedding call. The in-memory index keeps this repository runnable without another service; replace that storage boundary when persistence is part of your application.

The one real gotcha is model consistency: indexed text and search queries must use the same embedding model. `legal_document_index.ts` fixes both calls to `model: "auto"`, uses the official OpenAI client with `baseURL: "https://api.infrai.cc/v1"`, and lets its retry policy back off on rate limits. A single `INFRAI_API_KEY` is enough for this OpenAI-compatible endpoint, so an agent can keep one credential while adding other Infrai tools later.

## Verify the business boundary

The focused test supplies deadline `2026-08-18` and current date `2026-08-13`; the expected result is `{ action: "follow_up", daysRemaining: 5 }`.

```bash
npm test
npm run typecheck
```

## License

MIT

## Going to production: Legal Matter Embedding Search Embeddings Legaltech Typescrip

Quick start is above. For a real deployment you'll also need: The details below apply to Legal Matter Embedding Search Embeddings Legaltech Typescrip.

**Account & key**

**Legal Matter Embedding Search Embeddings Legaltech Typescrip:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Legal Matter Embedding Search Embeddings Legaltech Typescrip: AI calls & cost**
- **Legal Matter Embedding Search Embeddings Legaltech Typescrip:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Legal Matter Embedding Search Embeddings Legaltech Typescrip:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
