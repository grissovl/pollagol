export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        <span className="text-4xl">⚽</span>
        <span className="text-3xl font-extrabold text-blue-700">PollaGol</span>
      </div>
      {children}
    </div>
  )
}
