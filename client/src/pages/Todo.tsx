import { useLocation, useParams } from 'react-router-dom';

export function Todo({ title }: { title: string }) {
  const p = useParams();
  const { pathname } = useLocation();
  return (
    <section>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-text-secondary">TODO: <code className="font-mono">{pathname}</code> {Object.keys(p).length > 0 && JSON.stringify(p)}</p>
    </section>
  );
}
