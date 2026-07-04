"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "6rem 1rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "1.25rem" }}>Toy Company</span>
        <div>
          <h1 style={{ fontWeight: 700, fontSize: "2rem", margin: "0 0 0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#666", maxWidth: "28rem", margin: "0 auto" }}>
            A critical error occurred. Please try again.
          </p>
        </div>
        <button
          onClick={() => reset()}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.5rem",
            border: "1px solid #ccc",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
