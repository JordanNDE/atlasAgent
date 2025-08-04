import React from "react";

const highlight = { color: "#00ff38" };
const faqBoxStyle = {
  fontSize: 18,
  marginBottom: 24,
  background: "#f0f4f8",
  borderRadius: 8,
  padding: 24,
  color: "#222",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  fontWeight: 500,
};
const storyBoxStyle = {
  border: "1px solid #00ff38",
  borderRadius: 8,
  padding: 20,
  background: "#eafaf1",
  color: "#222",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  fontWeight: 500,
};

export default function Docs() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
      <h1 style={{ ...highlight, fontWeight: 800, fontSize: 36, marginBottom: 16, textAlign: "center" }}>
        Decoland’s Retrieval-Augmented Generation (RAG) System FAQ
      </h1>

      {/* FAQ Section */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ ...highlight, fontWeight: 700, fontSize: 28, marginTop: 32 }}>❓ Why did we implement a RAG system?</h2>
        <div style={faqBoxStyle}>
          <span style={{ fontWeight: 700 }}>Q:</span> What made Decoland choose RAG over standard AI solutions?<br />
          <span style={{ fontWeight: 700 }}>A:</span> At Decoland, we work at the intersection of blockchain, AI, civic participation, governance, and finance. Off-the-shelf language models (LLMs) often provide generic, shallow, or even inaccurate answers—especially for specialized topics. We also have a vast, curated repository of documents that wasn’t being fully leveraged. We needed a solution that could deliver expert, contextualized, and trustworthy answers, grounded in our own knowledge base. That’s why we built a Retrieval-Augmented Generation (RAG) system. <span role="img" aria-label="books">📚</span>
        </div>

        <h2 style={{ ...highlight, fontWeight: 700, fontSize: 28, marginTop: 32 }}>🌟 What are the benefits?</h2>
        <div style={faqBoxStyle}>
          <span style={{ fontWeight: 700 }}>Q:</span> How does RAG make a difference for our users and team?<br />
          <span style={{ fontWeight: 700 }}>A:</span>
          <ul style={{ fontSize: 17, margin: 0, paddingLeft: 24, color: "#222" }}>
            <li><b>Accuracy</b> <span role="img" aria-label="check">✅</span>: Answers are based on real, up-to-date documents, not just model guesses.</li>
            <li><b>Depth</b> <span role="img" aria-label="deep">🌊</span>: Users get in-depth, context-rich responses, not generic summaries.</li>
            <li><b>Transparency</b> <span role="img" aria-label="magnifier">🔍</span>: Every answer can be traced back to its source, building trust.</li>
            <li><b>Reduced Hallucination</b> <span role="img" aria-label="no-entry">🚫</span>: Fewer made-up or incorrect answers.</li>
            <li><b>Efficiency</b> <span role="img" aria-label="rocket">🚀</span>: Makes our document trove useful and accessible for everyone.</li>
          </ul>
        </div>

        <h2 style={{ ...highlight, fontWeight: 700, fontSize: 28, marginTop: 32 }}>⚙️ How does it work?</h2>
        <div style={faqBoxStyle}>
          <span style={{ fontWeight: 700 }}>Q:</span> What are the main steps in our RAG pipeline?<br />
          <span style={{ fontWeight: 700 }}>A:</span>
          <ol style={{ fontSize: 17, margin: 0, paddingLeft: 24, color: "#222" }}>
            <li><b>Ingestion</b>: Documents are uploaded (individually, in bulk, or by folder).</li>
            <li><b>Preprocessing & Chunking</b>: Documents are cleaned and split into manageable, meaningful chunks.</li>
            <li><b>Embedding & Storage</b>: Each chunk is turned into a vector and stored in Pinecone for fast search.</li>
            <li><b>Retrieval & Reranking</b>: When a user asks a question, the system retrieves the top 15 relevant chunks, then reranks them using a specialized model to select the 7 best.</li>
            <li><b>Answer Generation</b>: The LLM uses these chunks as context, ensuring answers are accurate, up-to-date, and referenceable.</li>
          </ol>
        </div>

        <h2 style={{ ...highlight, fontWeight: 700, fontSize: 28, marginTop: 32 }}>🛠️ How did we build it?</h2>
        <div style={faqBoxStyle}>
          <span style={{ fontWeight: 700 }}>Q:</span> What’s unique about Decoland’s RAG implementation?<br />
          <span style={{ fontWeight: 700 }}>A:</span>
          <ul style={{ fontSize: 17, margin: 0, paddingLeft: 24, color: "#222" }}>
            <li>Custom chunking and reranking pipeline for maximum relevance.</li>
            <li>Integration with our DCL tool and Pinecone for scalable, fast search.</li>
            <li>Designed for our specific domain and document types.</li>
            <li>Every answer includes metadata and references, so users can trace back the main arguments and sources.</li>
          </ul>
        </div>
      </div>

      {/* User Stories Section */}
      <h2 style={{ ...highlight, fontWeight: 700, fontSize: 28, marginTop: 32 }}>💡 Examples: How RAG improved our process</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 16, marginBottom: 32 }}>
        <div style={storyBoxStyle}>
          <b>1. Supporting Partners with Complex Questions</b> <span role="img" aria-label="handshake">🤝</span>
          <p style={{ margin: 0 }}>
            Before RAG, our support team struggled to answer complex questions about blockchain governance. Now, when a partner asks about the impact of a specific regulation, the system instantly provides a detailed, sourced answer, referencing the exact page in our latest whitepaper. This saves hours of manual research and builds trust with our partners.
          </p>
        </div>
        <div style={storyBoxStyle}>
          <b>2. Empowering Civic Participation</b> <span role="img" aria-label="megaphone">📢</span>
          <p style={{ margin: 0 }}>
            A community organizer wanted to understand how blockchain could be used for transparent voting in local governance. Previously, finding relevant case studies and technical explanations in our document trove was overwhelming. With RAG, the organizer simply asked their question and received a clear, sourced answer, including links to real-world pilot projects and technical guides from our database. This enabled them to confidently propose a new initiative to their city council.
          </p>
        </div>
        <div style={storyBoxStyle}>
          <b>3. Accelerating Financial Compliance Research</b> <span role="img" aria-label="chart">📊</span>
          <p style={{ margin: 0 }}>
            Our compliance team needed to quickly assess the implications of a new EU regulation on decentralized finance projects. Instead of manually searching through hundreds of legal documents and reports, they used our RAG-powered assistant. The system retrieved and summarized the most relevant sections, citing the exact documents and pages. This not only saved days of research but also ensured that our team’s recommendations were backed by authoritative sources.
          </p>
        </div>
      </div>

      {/* Diagram Section */}
      <h2 style={{ ...highlight, fontWeight: 700, fontSize: 28, marginTop: 32 }}>🖼️ How does a RAG answer work?</h2>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <img
          src="/rag_sys_architecture.png"
          alt="RAG System Architecture Diagram"
          style={{ maxWidth: "100%", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 16 }}
        />
        <p style={{ fontSize: 16, color: "#888" }}>
          This diagram shows how a user’s question is answered by retrieving, reranking, and grounding the response in real documents.
        </p>
      </div>

      <p style={{ fontSize: 16, color: "#888", textAlign: "center" }}>
        For more details, visit the <a href="https://atlas-ingest-app-xavec.ondigitalocean.app/" target="_blank" rel="noopener noreferrer" style={highlight}>DCL tool documentation</a>.
      </p>
    </div>
  );
}
