import { LegalDocumentIndex, createInfraiClient, decideDeadline } from "./legal_document_index.js";

const index = new LegalDocumentIndex(createInfraiClient());

await index.add({
  id: "doc-signed-nda",
  matterId: "matter-1042",
  kind: "signed_delivery",
  text: "The mutual NDA was signed by both parties and delivered to client counsel on August 8.",
  deadline: "2026-08-18"
});

await index.add({
  id: "doc-intake",
  matterId: "matter-1042",
  kind: "matter_intake",
  text: "New corporate matter concerning review of confidentiality terms before a financing discussion."
});

const [bestMatch] = await index.search("Has the signed confidentiality agreement been delivered?", 1);
const deadlineDecision = bestMatch.deadline
  ? decideDeadline(bestMatch.deadline, "2026-08-13")
  : null;

console.log(JSON.stringify({ bestMatch, deadlineDecision }, null, 2));
