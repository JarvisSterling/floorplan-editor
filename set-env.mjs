const token = "z9QBuEdasB9mKITNVDjfJ8Ji";
const proj = "prj_A07x8s5LeHyZnKkcOhn79zffgmhL";
const envs = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", value: "https://ztrrterfgllcnmmcwnmj.supabase.co" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0cnJ0ZXJmZ2xsY25tbWN3bm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MzE0NTQsImV4cCI6MjA4NzEwNzQ1NH0.LGhczNZJIl4ZV0EwC3iVCAYqB6JkJlaC3FG63e_7vFI" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0cnJ0ZXJmZ2xsY25tbWN3bm1qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUzMTQ1NCwiZXhwIjoyMDg3MTA3NDU0fQ.sl7Dal5anuWhc6VP2RNtwg5MjdBxtO0u715dG7z7yZY" },
];

for (const e of envs) {
  const res = await fetch(`https://api.vercel.com/v10/projects/${proj}/env`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ key: e.key, value: e.value, type: "encrypted", target: ["production", "preview", "development"] }),
  });
  const d = await res.json();
  console.log(e.key, d.key ? "✅" : d.error?.message || JSON.stringify(d));
}
