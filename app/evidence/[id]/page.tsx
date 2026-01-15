"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Evidence = {
  id: string;
  status: string;
  notes: string | null;
  photo_path: string | null;
  taken_at: string;
  gps_lat: number | null;
  gps_lng: number | null;
  device_info: string | null;
  work_packages: { item_code: string; title: string } | null;
};

type LogRow = {
  id: string;
  action: string;
  comment: string | null;
  acted_at: string;
};

export default function EvidenceDetail({ params }: { params: { id: string } }) {
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return (window.location.href = "/login");

      const { data: ev, error } = await supabase
        .from("evidence")
        .select(`
          id,status,notes,photo_path,taken_at,gps_lat,gps_lng,device_info,
          work_packages ( item_code, title )
        `)
        .eq("id", params.id)
        .single();

      if (error || !ev) return setMsg(error?.message ?? "Evidence not found");
      setEvidence(ev as any);

      if (ev.photo_path) {
        const { data: signed } = await supabase.storage
          .from("evidence-photos")
          .createSignedUrl(ev.photo_path, 60 * 60);

        if (signed?.signedUrl) setPhotoUrl(signed.signedUrl);
      }

      const { data: lg } = await supabase
        .from("verification_log")
        .select("id,action,comment,acted_at")
        .eq("evidence_id", params.id)
        .order("acted_at", { ascending: false });

      setLogs((lg ?? []) as any);
    })();
  }, [params.id]);

  if (msg) return <div style={{ padding: 24 }}>{msg}</div>;
  if (!evidence) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1>Evidence Pack</h1>
      <p><a href="/projects">← Back to Projects</a></p>

      <div style={{ border: "1px solid #ddd", padding: 12 }}>
        <p><b>Status:</b> {evidence.status}</p>
        <p><b>Work Package:</b> {evidence.work_packages?.item_code} — {evidence.work_packages?.title}</p>
        <p><b>Taken at:</b> {new Date(evidence.taken_at).toLocaleString()}</p>
        <p><b>GPS:</b> {evidence.gps_lat ?? "-"}, {evidence.gps_lng ?? "-"}</p>
        <p><b>Notes:</b> {evidence.notes ?? "-"}</p>
        <p><b>Device:</b> {evidence.device_info ?? "-"}</p>
      </div>

      <h2 style={{ marginTop: 16 }}>Photo Evidence</h2>
      {photoUrl ? (
        <img src={photoUrl} alt="Evidence" style={{ maxWidth: "100%", border: "1px solid #ddd" }} />
      ) : (
        <p>No photo.</p>
      )}

      <h2 style={{ marginTop: 16 }}>Verification Log (Audit Trail)</h2>
      {logs.length === 0 ? (
        <p>No actions yet.</p>
      ) : (
        <ul>
          {logs.map((l) => (
            <li key={l.id} style={{ padding: 8, borderBottom: "1px solid #eee" }}>
              <b>{l.action.toUpperCase()}</b> — {new Date(l.acted_at).toLocaleString()}
              <div>Comment: {l.comment ?? "-"}</div>
            </li>
          ))}
        </ul>
      )}

      <button onClick={() => window.print()} style={{ marginTop: 16 }}>
        Print / Save as PDF
      </button>
    </div>
  );
}
