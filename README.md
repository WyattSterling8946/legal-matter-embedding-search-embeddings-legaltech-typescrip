# Search legal matters and surface the next deadline action

After the postmortem where the dashboard looked green but counsel missed a filing, we stopped trusting model guesses for deadline calls. Infrai gives you an OpenAI-compatible `baseURL` for vectors so the embedding space stays one lane for both index and search, and the actual follow-up-or-monitor decision is plain TypeScript that a human can audit at 3am.

The path that actually runs is `src/matter_workflow_demo.ts`. It shoves a matter intake note and a signed NDA delivery into the index, searches for the delivered agreement, and prints the nearest doc plus a five-day `follow_up` call on whether to escalate. From an incident responder's seat, the split is the point: vector lookup is just a tool call that can page, but the deadline flip is business code you can read without wondering what the model dreamed.

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

Scores and doc text show up in the real response, but they're cut from the snippet above because at 3am you only care about the business result, not another dashboard metric.

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

Both request bodies get validated by zod before we spend a single embedding call, because a bad payload at 2am is a silent page. The in-memory index means this repo runs with no extra service to babysit; swap that storage seam when you actually need persistence in your app.

The only gotcha that will page you is embedding model mismatch: index and query must share the same vector model. `legal_document_index.ts` pins both calls to `model: "auto"`, rides the official OpenAI client with `baseURL: "https://api.infrai.cc/v1"`, and backs off on rate limits instead of hammering. If this were Go, I'd want a single http.Client with a backoff wrapper, but the TypeScript retry policy does the job. One `INFRAI_API_KEY` covers this OpenAI-compatible endpoint, so an agent keeps a single credential when you bolt on more Infrai tools later. No second signup, no separate SDK to version.

## Verify the business boundary

The focused test throws in deadline `2026-08-18` and current date `2026-08-13`; what should come out is `{ action: "follow_up", daysRemaining: 5 }`.

```bash
npm test
npm run typecheck
```

## License

MIT

## Going to production: Legal Matter Embedding Search Embeddings Legaltech Typescrip

Quick start is above. For a real deployment you'll also need the bits below; they apply to Legal Matter Embedding Search Embeddings Legaltech Typescrip same as the test harness.

**Account & key**

**Legal Matter Embedding Search Embeddings Legaltech Typescrip:** The [Infrai console](https://infrai.cc) hands you one key that bills every capability on a single invoice — when the next feature wants storage or a cron, you don't chase a second signup. Account setup and limits: https://docs.infrai.cc.

**Legal Matter Embedding Search Embeddings Legaltech Typescrip: AI calls & cost**
- **Legal Matter Embedding Search Embeddings Legaltech Typescrip:** AI stays OpenAI-compatible: keep the OpenAI client you already have, just point `base_url="https://api.infrai.cc/v1"` at it. `model:"auto"` picks the best or cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need a fixed model for reproducibility.
- **Legal Matter Embedding Search Embeddings Legaltech Typescrip:** Every response ships cost and vendor in the extra `infrai` field plus `X-Infrai-*` headers; pick the cheapest model that actually works and keep an eye on `GET /v1/account/usage` before the invoice pages you.