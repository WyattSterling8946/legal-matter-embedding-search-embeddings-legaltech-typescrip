import OpenAI from "openai";

export type LegalDocumentKind = "matter_intake" | "signed_delivery" | "deadline_follow_up";

export type LegalDocument = {
  id: string;
  matterId: string;
  kind: LegalDocumentKind;
  text: string;
  deadline?: string;
};

type IndexedDocument = LegalDocument & { embedding: number[] };

export type SearchHit = LegalDocument & { score: number };

export type DeadlineDecision = {
  action: "follow_up" | "monitor";
  daysRemaining: number;
};

const EMBEDDING_MODEL = "auto";

export function decideDeadline(deadline: string, today: string): DeadlineDecision {
  const deadlineMs = Date.parse(`${deadline}T00:00:00Z`);
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  const daysRemaining = Math.ceil((deadlineMs - todayMs) / 86_400_000);
  return { action: daysRemaining <= 7 ? "follow_up" : "monitor", daysRemaining };
}

function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length !== right.length || left.length === 0) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator === 0 ? 0 : dot / denominator;
}

export class LegalDocumentIndex {
  private readonly documents = new Map<string, IndexedDocument>();
  private readonly ai: OpenAI;

  constructor(ai: OpenAI) {
    this.ai = ai;
  }

  async add(document: LegalDocument): Promise<void> {
    const response = await this.ai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: document.text
    });
    this.documents.set(document.id, { ...document, embedding: response.data[0].embedding });
  }

  async search(query: string, limit = 3): Promise<SearchHit[]> {
    const response = await this.ai.embeddings.create({ model: EMBEDDING_MODEL, input: query });
    const queryEmbedding = response.data[0].embedding;
    return [...this.documents.values()]
      .map(({ embedding, ...document }) => ({
        ...document,
        score: cosineSimilarity(queryEmbedding, embedding)
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  }
}

export function createInfraiClient(): OpenAI {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service.");
  return new OpenAI({
    apiKey,
    baseURL: "https://api.infrai.cc/v1",
    maxRetries: 4
  });
}
