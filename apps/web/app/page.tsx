export const revalidate = 60;

export default function Home() {
  return (
    <main className="min-h-screen bg-background transition-colors duration-300">
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 tracking-wide transition-colors">
          Gallery
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-md text-center leading-relaxed transition-colors">
          เลือกอีเวนต์เพื่อดูแกลเลอรี
        </p>
      </div>
    </main>
  );
}
