"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type WorkPackage = { id: string; title: string; item_code: string };

export default function CapturePage({ params }: { params: { projectId: string } }) {
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [workPackageId, setWorkPackageId] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [gps, setGps] = useState<{ lat?: number; lng?: number }>({});
  const [gpsRequired, setGpsRequired] = useState(false);

  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return (window.location.href = "/login");

      const { data: wp, error } = await supabase
        .from("work_packages")
        .select("id,title,item_code")
        .eq("project_id", params.projectId)
        .order("created_at", { ascending: false });

      if (error) setMsg(error.message);
      setWorkPackages(wp ?? []);
    })();
  }, [params.projectId]);

  const getGps = () => {
    setMsg("");
    if (!navigator.geolocation) return setMsg("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setMsg("GPS permission denied. (If GPS is compulsory, please allow location.)")
    );
  };

  const submitEvidence = async () => {
    setMsg("");
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    if (!userId) return setMsg("Not logged in.");
    if (!workPackageId) return setMsg("Please select a work package.");
    if (!file) return setMsg("Please upload a photo.");

    // ✅ GPS validation: optional OR compulsory
    if (gpsRequired && (gps.lat == null || gps.lng == null)) {
      return setMsg("GPS is compulsory. Please click 'Get GPS' and allow location.");
    }

    const path = `${params.projectId}/${userId}/${Date.now()}-${file.name}`;

    const { error: upErr } = await supabase.storage.from("evidence-photos").upload(path, file);
    if (upErr) return setMsg(`Upload failed: ${upErr.message}`);

    const { error: evErr } = await supabase.from("evidence").insert({
      project_id: params.projectId,
      work_package_id: workPackageId,
      submitted_by: userId,
      notes,
      photo_path: path,
      gps_lat: gps.lat ?? null,
      gps_lng: gps.lng ?? null,
      device_info: navigator.userAgent
    });

    if (evErr) return setMsg(`Submit failed: ${evErr.message}`);

    setMsg("Submitted successfully ✅");
    setNotes("");
    setFile(null);
    setWorkPackageId("");
    // keep gps value (optional)
  };

  return (
    <div style={{ maxWidth: 720, margin: "24px auto", padding: 16 }}>
      <h1>Evidence Capture</h1>
      <p><a href="/projects">← Back to Projects</a></p>

      <div style={{ marginTop: 10, padding: 10, border: "1px solid #333" }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={gpsRequired}
            onChange={(e) => setGpsRequired(e.target.checked)}
          />
          GPS compulsory (tick for strict site verification)
        </label>

        <button onClick={getGps} style={{ marginTop: 10 }}>
          Get GPS
        </button>

        <div style={{ marginTop: 8 }}>
          GPS: {gps.lat?.toFixed(6) ?? "-"}, {gps.lng?.toFixed(6) ?? "-"}
        </div>

        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>
          Tip: On laptop you may keep GPS optional. On mobile you can turn it compulsory.
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <label>Work Package</label><br />
        <select value={workPackageId} onChange={(e) => setWorkPackageId(e.target.value)}>
          <option value="">-- select --</option>
          {workPackages.map((w) => (
            <option key={w.id} value={w.id}>
              {w.item_code} — {w.title}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 16 }}>
        <label>Photo Evidence</label><br />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>

      <div style={{ marginTop: 16 }}>
        <label>Notes</label><br />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} style={{ width: "100%" }} />
      </div>

      <button onClick={submitEvidence} style={{ marginTop: 16 }}>Submit</button>
      <p>{msg}</p>
    </div>
  );
}
