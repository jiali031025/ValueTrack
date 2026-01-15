"use client";

import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const signIn = async () => {
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);
    window.location.href = "/projects";
  };

  const signUp = async () => {
    setMsg("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: email.split("@")[0] } }
    });
    if (error) return setMsg(error.message);
    setMsg("Signup success ✅ Now sign in.");
  };

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 16 }}>
      {/* Logo */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <Image src="/logo.png" alt="ValuTrack logo" width={260} height={90} priority />
      </div>

      <input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: 10, marginTop: 8 }}
      />

      <input
        placeholder="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: 10, marginTop: 8 }}
      />

      <button onClick={signIn} style={{ width: "100%", padding: 10, marginTop: 12 }}>
        Sign in
      </button>

      <button onClick={signUp} style={{ width: "100%", padding: 10, marginTop: 8 }}>
        Sign up
      </button>

      <p style={{ marginTop: 12 }}>{msg}</p>
    </div>
  );
}
