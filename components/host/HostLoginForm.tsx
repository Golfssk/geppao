'use client';

import { FormEvent, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export function HostLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้องครับ');
      setLoading(false);
      return;
    }

    router.push('/host/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 460, margin: '32px auto 0' }}>
      <div className="card-body">
        <h1>เข้าสู่ระบบเจ้าของที่พัก</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          เข้าสู่ระบบเพื่อจัดการที่พักของคุณบน GepPao
        </p>

        <div className="filter-group" style={{ marginTop: 24 }}>
          <label htmlFor="email">อีเมล</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="host@geppao.com"
            required
          />
        </div>

        <div className="filter-group" style={{ marginTop: 16 }}>
          <label htmlFor="password">รหัสผ่าน</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="รหัสผ่าน"
            required
          />
        </div>

        {error && (
          <p role="alert" style={{ color: 'var(--rust)', marginTop: 16 }}>
            {error}
          </p>
        )}

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 24, width: '100%' }}>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </div>
    </form>
  );
}
