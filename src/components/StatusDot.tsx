export function StatusDot({ active }: { active: boolean; }) {
  return (
    <div className="absolute top-2 right-4 flex items-center gap-2 text-xs">
      <span className={`size-2.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
      <span>{active ? 'Ativa' : 'Desativada'}</span>
    </div>
  )
}
