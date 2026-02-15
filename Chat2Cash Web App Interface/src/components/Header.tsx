export function Header() {
  return (
    <header className="h-20 bg-gradient-to-r from-[#00a884] to-[#008069] shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
      <div className="max-w-[1440px] mx-auto h-full px-8 flex items-center justify-between">
        {/* Logo */}
        <div className="text-white font-semibold tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            💰
          </div>
          <span className="text-xl">Chat2Cash</span>
        </div>
        
        {/* Tagline */}
        <div className="absolute left-1/2 -translate-x-1/2 text-white/90 text-sm font-medium hidden md:block">
          AI-powered order extraction for WhatsApp Business
        </div>
        
        {/* Right side placeholder for balance */}
        <div className="w-32"></div>
      </div>
    </header>
  );
}