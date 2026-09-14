interface HeaderProps {
  username?: string
  onMenuClick: () => void
}

export default function Header({ username, onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold">نظام محاسبة تاجر ملابس</h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 hidden sm:inline">{username}</span>
      </div>
    </header>
  )
}
