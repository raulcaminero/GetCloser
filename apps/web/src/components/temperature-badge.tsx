const config = {
  HOT: { label: '🔥 Hot', className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  WARM: { label: '🟡 Warm', className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  COLD: { label: '❄️ Cold', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
};

export function TemperatureBadge({ temperature }: { temperature: 'HOT' | 'WARM' | 'COLD' }) {
  const { label, className } = config[temperature] ?? config.COLD;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>{label}</span>;
}
