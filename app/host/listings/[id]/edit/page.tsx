import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { mapListing } from '@/lib/listings';
import { HostListingEditForm } from '@/components/host/HostListingEditForm';

export default async function EditHostListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/host/login');

  const { data: host } = await supabase
    .from('hosts')
    .select('id, business_name, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!host) redirect('/host');

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('host_id', host.id)
    .maybeSingle();

  if (error || !data) notFound();

  return (
    <main className="page">
      <div className="container section">
        <div className="section-head">
          <div>
            <p className="muted">Host Dashboard</p>
            <h1>แก้ไขที่พัก</h1>
            <p className="muted" style={{ marginTop: 6 }}>{data.name}</p>
          </div>
        </div>
        <HostListingEditForm listing={mapListing(data)} />
      </div>
    </main>
  );
}
