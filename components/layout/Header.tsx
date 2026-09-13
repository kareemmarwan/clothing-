interface HeaderProps {
  username?: string
}

export default function Header({ username }: HeaderProps) {
  return (
    <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold">نظام محاسبة تاجر ملابس</h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{username}</span>
      </div>
    </header>
  )
}
