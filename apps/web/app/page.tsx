import Link from "next/link";

export const revalidate = 60;

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface EventItem {
  id: string;
  title: string;
  date?: string;
  coverImage?: string;
}

async function fetchRecentEvents(): Promise<EventItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/events?page=1&page_size=6`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const events = await fetchRecentEvents();

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ──────────── Navbar ──────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0a0a0f]/70 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent"
          >
            Event Gallery
          </Link>
          <Link
            href="/administrator"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            ผู้ดูแลระบบ
          </Link>
        </div>
      </nav>

      {/* ──────────── Hero Section ──────────── */}
      <section className="relative overflow-hidden pt-20">
        {/* Gradient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-900/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-[11px] font-semibold tracking-widest uppercase rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Event Photography Platform
          </span>

          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-6"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            <span className="bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent">
              ภาพงานอีเวนต์
            </span>
            <br />
            <span className="text-neutral-500 text-3xl sm:text-4xl md:text-5xl font-light">
              ค้นหา ดาวน์โหลด แชร์ได้ง่าย
            </span>
          </h1>

          <p className="max-w-lg text-neutral-400 text-[15px] sm:text-base leading-relaxed mb-10">
            ระบบแกลเลอรีสำหรับช่างภาพงานอีเวนต์ — รองรับค้นหาด้วยใบหน้า,
            QR&nbsp;Code, และแยกแกลเลอรีตามงาน
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {events.length > 0 && (
              <a
                href="#events"
                className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 transition-all hover:scale-[1.03] active:scale-100"
              >
                ดูงานอีเวนต์
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            )}
            <Link
              href="/administrator"
              className="inline-flex items-center gap-2 px-7 py-3 text-sm font-medium rounded-full border border-white/10 text-neutral-300 hover:bg-white/5 hover:text-white transition-all"
            >
              เข้าสู่ระบบผู้ดูแล
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────── Features Section ──────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold tracking-widest uppercase text-violet-400/70 mb-3">
            Features
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-16 tracking-tight text-white">
            ฟีเจอร์หลัก
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ),
                title: "ค้นหาด้วยใบหน้า",
                desc: "อัปโหลดรูปหน้าของคุณ ระบบจะค้นหาภาพที่มีคุณอยู่ในทุกงาน",
                color: "from-violet-500 to-purple-600",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                ),
                title: "QR Code",
                desc: "สร้าง QR Code สำหรับแต่ละงาน ให้แขกสแกนดูภาพได้ทันที",
                color: "from-indigo-500 to-blue-600",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                title: "แกลเลอรีแยกงาน",
                desc: "แต่ละงานมีแกลเลอรีของตัวเอง พร้อม Lightbox คุณภาพสูง",
                color: "from-fuchsia-500 to-pink-600",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300"
              >
                <div
                  className={`w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white mb-5 shadow-lg`}
                >
                  {f.icon}
                </div>
                <h3 className="text-[15px] font-semibold mb-2 text-white">
                  {f.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── Recent Events ──────────── */}
      {events.length > 0 && (
        <section id="events" className="py-24 px-6 scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-xs font-semibold tracking-widest uppercase text-violet-400/70 mb-3">
              Events
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-16 tracking-tight text-white">
              งานอีเวนต์ล่าสุด
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((event) => (
                <a
                  key={event.id}
                  href={`/event/${event.id}`}
                  className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-violet-900/10"
                >
                  {/* Gradient cover */}
                  <div className="aspect-[16/10] bg-gradient-to-br from-violet-950 via-indigo-950 to-neutral-950 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-white/10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>

                  <div className="p-5">
                    <h3 className="text-sm font-semibold text-neutral-200 group-hover:text-violet-300 transition-colors line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-neutral-600">
                      คลิกเพื่อดูแกลเลอรี →
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ──────────── Footer ──────────── */}
      <footer className="py-10 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-600">
            © {new Date().getFullYear()} Event Gallery — Powered by AI Face Search
          </p>
          <Link
            href="/administrator"
            className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            ผู้ดูแลระบบ
          </Link>
        </div>
      </footer>
    </main>
  );
}
