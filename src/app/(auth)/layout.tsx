import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image
            src="/64da6112cec570b31b32f76d_ilv2.svg"
            alt="Integrated LV Logo"
            width={200}
            height={50}
            priority
          />
        </div>
        {children}
      </div>
    </div>
  )
}

