"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Project = { id: string; name: string; client: string | null };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return (window.location.href = "/login");

      const { data, error } = await supabase
        .from("projects")
        .select("id,name,client")
        .order("created_at", { ascending: false });

      if (error) return setMsg(error.message);
      setProjects(data ?? []);
    })();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Projects</h1>
        <button onClick={logout}>Logout</button>
      </div>

      <p>{msg}</p>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {projects.map((p) => (
          <li key={p.id} style={{ padding: 12, border: "1px solid #333", marginTop: 10 }}>
            <b>{p.name}</b> {p.client ? `— ${p.client}` : ""}
            <div style={{ marginTop: 8 }}>
              <a href={`/projects/${p.id}/capture`}>Capture Evidence</a>
              {"  |  "}
              <a href={`/projects/${p.id}/verify`}>Verify (QS)</a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

