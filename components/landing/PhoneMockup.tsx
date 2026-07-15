export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* World map background */}
      <svg
        className="absolute inset-0 h-full w-full opacity-40"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Dotted world map approximation */}
        {[
          [80, 120], [100, 100], [120, 90], [140, 85], [160, 90], [180, 100], [200, 95], [220, 100], [240, 110], [260, 120], [280, 130], [300, 140], [320, 150],
          [70, 140], [90, 130], [110, 125], [130, 120], [150, 115], [170, 110], [190, 105], [210, 100], [230, 105], [250, 115], [270, 125], [290, 135], [310, 145],
          [60, 160], [80, 150], [100, 145], [120, 140], [140, 135], [160, 130], [180, 125], [200, 120], [220, 125], [240, 130], [260, 140], [280, 150], [300, 160], [320, 170],
          [50, 180], [70, 175], [90, 170], [110, 165], [130, 160], [150, 155], [170, 150], [190, 145], [210, 140], [230, 145], [250, 150], [270, 160], [290, 170], [310, 180],
          [80, 200], [100, 195], [120, 190], [140, 185], [160, 180], [180, 175], [200, 170], [220, 175], [240, 180], [260, 190], [280, 200], [300, 210],
          [100, 220], [120, 215], [140, 210], [160, 205], [180, 200], [200, 195], [220, 200], [240, 205], [260, 215], [280, 225],
          [120, 240], [140, 235], [160, 230], [180, 225], [200, 220], [220, 225], [240, 230], [260, 240],
          [140, 260], [160, 255], [180, 250], [200, 245], [220, 250], [240, 255],
          [160, 280], [180, 275], [200, 270], [220, 275],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2" fill="#22d3ee" opacity="0.5" />
        ))}
        {/* Connection arcs */}
        <path d="M120 130 Q200 80 280 130" stroke="#22d3ee" strokeWidth="1" strokeDasharray="4 4" fill="none" opacity="0.3" />
        <path d="M100 180 Q200 140 300 180" stroke="#a855f7" strokeWidth="1" strokeDasharray="4 4" fill="none" opacity="0.3" />
        <path d="M140 220 Q200 190 260 220" stroke="#ec4899" strokeWidth="1" strokeDasharray="4 4" fill="none" opacity="0.3" />
        {/* Network nodes */}
        {[
          [120, 130], [200, 95], [280, 130], [100, 180], [200, 140], [300, 180], [140, 220], [260, 220],
        ].map(([cx, cy], i) => (
          <g key={`node-${i}`}>
            <circle cx={cx} cy={cy} r="6" fill="#22d3ee" opacity="0.2" className="landing-node-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
            <circle cx={cx} cy={cy} r="3" fill="#22d3ee" />
          </g>
        ))}
      </svg>

      {/* Phone frame */}
      <div className="relative mx-auto mt-8 w-[260px] rotate-[-2deg] sm:w-[280px]">
        <div className="rounded-[2.5rem] border border-white/10 bg-slate-900 p-2 shadow-2xl shadow-purple-500/10">
          <div className="overflow-hidden rounded-[2rem] bg-slate-950">
            {/* Status bar */}
            <div className="flex items-center justify-between px-6 py-2 text-[10px] text-slate-400">
              <span>9:41</span>
              <div className="mx-auto h-5 w-20 rounded-full bg-slate-800" />
              <span>●●●</span>
            </div>

            {/* App header */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <span className="text-sm font-semibold text-white">RoamKit</span>
              <div className="w-5" />
            </div>

            {/* Plan card */}
            <div className="mx-4 mt-4 rounded-2xl landing-gradient-bg p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">Global eSIM</p>
              <p className="mt-1 text-lg font-bold text-white">Europe</p>
              <p className="text-xs text-white/80">30 Days · 10 GB</p>
              <div className="mt-3 flex justify-end">
                <svg className="h-5 w-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
            </div>

            {/* eSIM status */}
            <div className="mx-4 mt-4 rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Your eSIM</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Active</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Expires in 29 days</p>
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Data usage</span>
                  <span>4.2 GB / 10 GB</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[42%] rounded-full landing-gradient-bg" />
                </div>
              </div>
            </div>

            {/* Bottom nav */}
            <div className="mt-6 flex justify-around border-t border-white/5 px-4 py-3">
              {[
                { label: "Home", active: true },
                { label: "My eSIMs", active: false },
                { label: "Usage", active: false },
                { label: "Account", active: false },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-0.5">
                  <div className={`h-4 w-4 rounded ${item.active ? "bg-cyan-400" : "bg-slate-600"}`} />
                  <span className={`text-[8px] ${item.active ? "text-cyan-400" : "text-slate-500"}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
