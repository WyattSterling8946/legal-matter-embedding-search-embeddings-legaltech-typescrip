import express from "express";
import { z } from "zod";
import { LegalDocumentIndex, createInfraiClient, decideDeadline } from "./legal_document_index.js";

const documentSchema = z.object({
  id: z.string().min(1),
  matterId: z.string().min(1),
  kind: z.enum(["matter_intake", "signed_delivery", "deadline_follow_up"]),
  text: z.string().min(1),
  deadline: z.string().date().optional()
});

const searchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(10).default(3),
  today: z.string().date()
});

export function createLegalSearchService(index: LegalDocumentIndex) {
  const app = express();
  app.use(express.json());

  app.post("/documents", async (request, response) => {
    const parsed = documentSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    await index.add(parsed.data as Parameters<LegalDocumentIndex["add"]>[0]);
    response.status(201).json({ id: parsed.data.id, state: "indexed" });
  });

  app.post("/search", async (request, response) => {
    const parsed = searchSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const hits = await index.search(parsed.data.query, parsed.data.limit);
    response.json({
      hits: hits.map((hit) => ({
        ...hit,
        deadlineDecision: hit.deadline ? decideDeadline(hit.deadline, parsed.data.today) : null
      }))
    });
  });

  return app;
}

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT ?? 3000);
  const index = new LegalDocumentIndex(createInfraiClient());
  createLegalSearchService(index).listen(port, () => {
    console.log(`Legal search service listening on http://localhost:${port}`);
  });
}
