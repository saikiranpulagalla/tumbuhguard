export function MetricCard({ label, value, detail, tone = 'neutral', status }: { label: string; value: string; detail: string; tone?: 'neutral'|'pass'|'fail'|'blocked'; status?: string }) {
  return <article className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong>{status&&<b className="metric-status">{status}</b>}<small>{detail}</small></article>;
}
