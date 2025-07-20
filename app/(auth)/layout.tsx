export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-purple-900">Arc Messenger</h1>
            <p className="mt-2 text-sm text-purple-600">
              Modern messaging with Arc Browser design
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}