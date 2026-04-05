import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "72px 20px", textAlign: "center" }}>
      <h1 style={{ marginBottom: 8 }}>404</h1>
      <p style={{ color: "rgba(255,255,255,0.72)", marginBottom: 22 }}>
        The page you requested was not found.
      </p>
      <Link href="/">Back to home</Link>
    </main>
  );
}
