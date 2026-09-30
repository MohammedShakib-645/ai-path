// Sandboxed code execution via Piston (public API, free, no key).
// Our server NEVER runs user code — it only relays to the sandbox.
export async function piston(language: string, code: string, stdin = "") {
  const res = await fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, version: "*", files: [{ content: code }], stdin }),
  });
  if (!res.ok) throw new Error(`Execution service HTTP ${res.status}`);
  return res.json();
}
