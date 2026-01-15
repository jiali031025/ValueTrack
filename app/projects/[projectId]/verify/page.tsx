"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type EvidenceRow = {
  id: string;
  status: string;
  notes: string | null;
  taken_at: string;
};

export default function VerifyPage({ params }: { params: { projectId: string } }) {
  const [rows, setRows] = useState<EvidenceRow[]>([]);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("evidence")
      .select("id,status,notes,taken_at")
      .eq("project_id", params.projectId)
      .eq("status", "pending")
      .order("taken_at", { ascending: false })
      .limit(50);

    if (error) setMsg(error.message);
    setRows(data ?? []);
  };

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return (window.location.href = "/login");
      await load();
    })();
  }, [params.projectId]);

  const decide = async (evidenceId: string, action: "verified" | "queried" | "rejected") => {
    setMsg("");
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return setMsg("Not logged in.");

    const comment = prompt(`Comment for ${action}? (optional)`) ?? "";

    const { error: upErr } = await supabase.from("evidence").update({ status: action }).eq("id", evidenceId);
    if (upErr) return setMsg(upErr.message);

    const { error: logErr } = await supabase.from("verification_log").insert({
      evidence_id: evidenceId,
      action,
      comment,
      acted_by: userId
    });
    if (logErr) return setMsg(logErr.message);

    await load();
    setMsg(`Updated to ${action} ✅`);
  };

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1>QS Verification Dashboard</h1>
      <p><a href="/projects">← Back to Projects</a></p>
      <p>{msg}</p>

      <table border={1} cellPadding={8} style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Evidence</th>
            <th>Taken At</th>
            <th>Notes</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><a href={`/evidence/${r.id}`}>{r.id.slice(0, 8)}…</a></td>
              <td>{new Date(r.taken_at).toLocaleString()}</td>
              <td>{r.notes ?? "-"}</td>
              <td>{r.status}</td>
              <td>
                <button onClick={() => decide(r.id, "verified")}>Verify</button>{" "}
                <button onClick={() => decide(r.id, "queried")}>Query</button>{" "}
                <button onClick={() => decide(r.id, "rejected")}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 12 }}>
        Note: This page lists <b>pending</b> evidence only.
      </p>
    </div>
  );
}
