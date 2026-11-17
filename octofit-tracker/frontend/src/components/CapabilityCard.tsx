import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props = {
  title: string;
  description: string;
  endpoint: string;
  dataKey: string;
  emptyText: string;
  renderItem: (item: Record<string, unknown>, index: number) => ReactNode;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function CapabilityCard({ title, description, endpoint, dataKey, emptyText, renderItem }: Props) {
  const [items, setItems] = useState<Record<string, unknown>[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setItems(null);
    setError(null);
    getJson<Record<string, unknown>>(endpoint)
      .then((response) => {
        const data = response[dataKey];
        if (!Array.isArray(data) || !data.every(isRecord)) throw new Error('The server returned an invalid response.');
        if (active) setItems(data);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : 'Unable to load data.');
      });

    return () => {
      active = false;
    };
  }, [dataKey, endpoint]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {items === null && error === null && <p role="status">Loading {title.toLowerCase()}...</p>}
        {error !== null && <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>}
        {items !== null && items.length === 0 && <p>{emptyText}</p>}
        {items !== null && items.length > 0 && <ul>{items.map(renderItem)}</ul>}
      </div>
    </section>
  );
}
