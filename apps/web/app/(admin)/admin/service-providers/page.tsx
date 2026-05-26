'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { ResourceManager } from '@/components/admin/resource-manager';

interface LogoUpload {
  signed_url: string;
  public_url: string;
}

function LogoUploader() {
  const [busy, setBusy] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setPublicUrl(null);
    try {
      const { signed_url, public_url } = await api.post<LogoUpload>(
        '/admin/providers/logo-upload-url',
        { mime_type: file.type },
      );
      const put = await fetch(signed_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);
      setPublicUrl(public_url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-border-default bg-surface p-4">
      <h2 className="font-medium">Upload a logo</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Upload a logo (PNG/JPG/SVG/WEBP), then paste the returned URL into a
        provider&apos;s <code>logo_url</code> field below.
      </p>
      <input
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        onChange={onFile}
        disabled={busy}
        className="mt-2 text-sm"
      />
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      {publicUrl && (
        <p className="mt-2 break-all rounded bg-base p-2 font-mono text-xs">
          {publicUrl}
        </p>
      )}
    </section>
  );
}

export default function Page() {
  return (
    <div className="space-y-5">
      <LogoUploader />
      <ResourceManager
        resource="service-providers"
        idKey="id"
        title="Service providers"
      />
    </div>
  );
}
