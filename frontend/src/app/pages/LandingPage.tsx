import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Zap,
  FileText,
  CheckCircle2,
  MessageCircle,
  Lock,
  LayoutDashboard,
  Play,
  Star,
  Linkedin,
  Twitter,
  Menu,
  X,
  Shield,
  Share2,
  Check,
} from "lucide-react";

/* ─── Design Tokens ─── */
const NAVY = "#1A1A2E";
const GREEN = "#00C853";
const ORANGE = "#FF6D00";
const BLUE = "#2979FF";
const RED = "#D32F2F";
const BASE_BG = "#F8F9FA";
const CARD_BG = "#FFFFFF";
const GREY = "#6B7280";
const GREY_LIGHT = "#9E9E9E";
const BORDER = "#E5E7EB";

const CARD: React.CSSProperties = {
  backgroundColor: CARD_BG,
  borderRadius: 16,
  border: `1px solid ${BORDER}`,
  boxShadow: "0px 2px 12px rgba(0,0,0,0.07)",
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: ORANGE,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  fontFamily: "'DM Sans', sans-serif",
};

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontWeight: 500,
};

/* ═══════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════ */
function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const links = ["How it Works", "Features", "Pricing", "For Kiranas"];

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        backgroundColor: CARD_BG,
        borderBottom: `1px solid ${BORDER}`,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        className="flex items-center justify-between mx-auto px-6 md:px-10"
        style={{ maxWidth: 1440, height: 72 }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/landing")}
        >
          <div
            className="w-[32px] h-[32px] flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${NAVY}, ${BLUE})`,
              borderRadius: 9,
            }}
          >
            <Zap size={17} color="#FFF" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 20, color: NAVY }}>
            Chat<span style={{ color: BLUE }}>2</span>Cash
          </span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-[14px] no-underline"
              style={{
                fontWeight: 500,
                color: GREY,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = NAVY)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = GREY)
              }
            >
              {l}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="#"
            className="text-[14px] no-underline"
            style={{ fontWeight: 600, color: NAVY }}
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            Login
          </a>
          <button
            className="cursor-pointer px-5 py-2.5 text-[14px]"
            style={{
              backgroundColor: NAVY,
              color: "#FFF",
              borderRadius: 100,
              border: "none",
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Start Free Trial
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden cursor-pointer"
          style={{ background: "none", border: "none" }}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? (
            <X size={24} color={NAVY} />
          ) : (
            <Menu size={24} color={NAVY} />
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="md:hidden flex flex-col gap-3 px-6 pb-5"
          style={{ backgroundColor: CARD_BG, borderTop: `1px solid ${BORDER}` }}
        >
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-[15px] no-underline py-2"
              style={{ fontWeight: 500, color: GREY }}
              onClick={() => setMenuOpen(false)}
            >
              {l}
            </a>
          ))}
          <button
            className="cursor-pointer px-5 py-3 text-[14px] mt-2"
            style={{
              backgroundColor: NAVY,
              color: "#FFF",
              borderRadius: 100,
              border: "none",
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              width: "100%",
            }}
          >
            Start Free Trial
          </button>
        </div>
      )}
    </nav>
  );
}

/* ═══════════════════════════════════════
   HERO PRODUCT MOCKUP
   ═══════════════════════════════════════ */
function HeroMockup() {
  return (
    <div className="relative">
      {/* Floating product card */}
      <div
        style={{
          ...CARD,
          transform: "rotate(-2deg)",
          boxShadow:
            "0 20px 60px rgba(26,26,46,0.15), 0px 2px 12px rgba(0,0,0,0.07)",
          animation: "heroFloat 3s ease-in-out infinite",
          overflow: "hidden",
        }}
      >
        <div className="flex" style={{ minHeight: 220 }}>
          {/* Left – WhatsApp chat */}
          <div
            className="flex-1 flex flex-col gap-2 p-4"
            style={{
              backgroundColor: "#FFFBEB",
              borderRight: `1px solid ${BORDER}`,
              minWidth: 0,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <MessageCircle size={12} color="#25D366" strokeWidth={2.5} />
              <span
                className="text-[10px] tracking-[0.04em] uppercase"
                style={{ fontWeight: 600, color: GREY }}
              >
                WhatsApp Chat
              </span>
            </div>
            <div
              className="px-3 py-2"
              style={{
                backgroundColor: "#DCF8C6",
                borderRadius: "10px 10px 2px 10px",
                fontSize: 12,
                color: "#111318",
                lineHeight: 1.5,
              }}
            >
              2 kilo aaloo, 1 kilo pyaaz dena bhai
            </div>
          </div>

          {/* Center bolt */}
          <div
            className="flex items-center justify-center px-2 shrink-0"
            style={{ backgroundColor: BASE_BG }}
          >
            <div
              className="w-[32px] h-[32px] flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, rgba(26,26,46,0.08), rgba(255,109,0,0.12))`,
                borderRadius: 8,
              }}
            >
              <Zap size={16} color={ORANGE} strokeWidth={2.5} />
            </div>
          </div>

          {/* Right – Structured order */}
          <div
            className="flex-1 flex flex-col gap-2 p-4"
            style={{
              backgroundColor: "#F0FDF4",
              minWidth: 0,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <FileText size={12} color={NAVY} strokeWidth={2.5} />
              <span
                className="text-[10px] tracking-[0.04em] uppercase"
                style={{ fontWeight: 600, color: GREY }}
              >
                Extracted Order
              </span>
            </div>
            {[
              { item: "Aaloo", qty: "2kg", price: "₹40" },
              { item: "Pyaaz", qty: "1kg", price: "₹30" },
            ].map((r) => (
              <div
                key={r.item}
                className="flex items-center justify-between text-[11px]"
                style={{ color: "#0D0F12" }}
              >
                <span style={{ fontWeight: 500 }}>
                  {r.item} {r.qty}
                </span>
                <span style={{ ...MONO, fontSize: 11 }}>{r.price}</span>
              </div>
            ))}
            <div
              className="flex items-center justify-between mt-1 pt-1.5"
              style={{ borderTop: `1px solid ${BORDER}` }}
            >
              <span
                className="text-[12px]"
                style={{ fontWeight: 700, color: NAVY }}
              >
                Total
              </span>
              <span style={{ ...MONO, fontSize: 13, fontWeight: 700, color: NAVY }}>
                ₹70
              </span>
            </div>
            <div
              className="flex items-center gap-1 px-2 py-0.5 self-start mt-1"
              style={{
                backgroundColor: "rgba(0,200,83,0.1)",
                borderRadius: 100,
              }}
            >
              <CheckCircle2 size={10} color={GREEN} strokeWidth={2.5} />
              <span
                className="text-[10px]"
                style={{ fontWeight: 600, color: GREEN, ...MONO }}
              >
                97%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating stat chips */}
      <div className="flex flex-wrap justify-center gap-2.5 mt-5">
        {[
          { text: "247 orders processed today", color: BLUE, bg: "rgba(41,121,255,0.08)" },
          {
            text: "₹1,24,850 recovered this week",
            color: GREEN,
            bg: "rgba(0,200,83,0.08)",
          },
          {
            text: "1.2s avg extraction time",
            color: ORANGE,
            bg: "rgba(255,109,0,0.08)",
          },
        ].map((c) => (
          <span
            key={c.text}
            className="px-3 py-1.5 text-[11px]"
            style={{
              backgroundColor: c.bg,
              borderRadius: 100,
              fontWeight: 600,
              color: c.color,
              whiteSpace: "nowrap",
            }}
          >
            {c.text}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════ */
function HeroSection() {
  return (
    <section
      id="hero"
      className="w-full"
      style={{
        backgroundColor: BASE_BG,
        fontFamily: "'DM Sans', sans-serif",
        minHeight: 640,
      }}
    >
      <div
        className="mx-auto px-6 md:px-10 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12 md:gap-8"
        style={{ maxWidth: 1440 }}
      >
        {/* Left (55%) */}
        <div className="w-full md:w-[55%] flex flex-col gap-6">
          {/* Eyebrow */}
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: 3,
                height: 20,
                backgroundColor: ORANGE,
                borderRadius: 2,
              }}
            />
            <span style={SECTION_LABEL}>
              FOR INDIA'S 60M WHATSAPP-FIRST BUSINESSES
            </span>
          </div>

          {/* Headline */}
          <h1
            className="m-0"
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 700,
              color: NAVY,
              lineHeight: 1.2,
              maxWidth: 560,
            }}
          >
            Your WhatsApp orders,
            <br />
            turned into GST invoices
            <br />
            in under 2 seconds.
          </h1>

          {/* Subtext */}
          <p
            className="m-0"
            style={{
              fontSize: 18,
              fontWeight: 400,
              color: GREY,
              lineHeight: 1.6,
              maxWidth: 520,
            }}
          >
            Chat2Cash reads your Hinglish order chats, extracts the details
            automatically, and generates compliant invoices — no typing
            required.
          </p>

          {/* CTA row */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              className="cursor-pointer px-8 flex items-center justify-center"
              style={{
                height: 56,
                backgroundColor: NAVY,
                color: "#FFF",
                borderRadius: 100,
                border: "none",
                fontWeight: 600,
                fontSize: 16,
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0px 4px 20px rgba(26,26,46,0.18)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#2a2a44";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0px 6px 28px rgba(26,26,46,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = NAVY;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0px 4px 20px rgba(26,26,46,0.18)";
              }}
            >
              Start Free — No Card Needed
            </button>
            <a
              href="#"
              className="flex items-center gap-2 no-underline text-[14px]"
              style={{ fontWeight: 600, color: NAVY }}
            >
              <Play size={16} color={NAVY} strokeWidth={2.5} />
              Watch 60-sec Demo
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-5 mt-1">
            {[
              "GST Compliant",
              "PII Protected",
              "Works in Hindi & English",
            ].map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5 text-[12px]"
                style={{ fontWeight: 500, color: GREY_LIGHT }}
              >
                <Check size={13} color={GREEN} strokeWidth={2.5} />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right (45%) */}
        <div className="w-full md:w-[45%]">
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   SOCIAL PROOF
   ═══════════════════════════════════════ */
function SocialProof() {
  const stores = [
    "Ravi's Kirana, Mumbai",
    "Sharma Wholesale, Delhi",
    "Patel Tiffin, Surat",
    "Singh Traders, Ludhiana",
    "Mehta General Store, Pune",
  ];
  return (
    <section
      className="w-full py-6 flex flex-col items-center gap-4 px-6"
      style={{
        backgroundColor: CARD_BG,
        borderTop: `1px solid ${BORDER}`,
        borderBottom: `1px solid ${BORDER}`,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <p
        className="m-0 text-center text-[14px]"
        style={{ fontWeight: 500, color: GREY }}
      >
        Trusted by kirana stores, wholesale traders, and tiffin services across
        India
      </p>
      <div className="flex flex-wrap justify-center gap-2.5">
        {stores.map((s) => (
          <span
            key={s}
            className="px-4 py-2 text-[12px]"
            style={{
              backgroundColor: BASE_BG,
              borderRadius: 100,
              fontWeight: 500,
              color: GREY_LIGHT,
              border: `1px solid ${BORDER}`,
              whiteSpace: "nowrap",
            }}
          >
            {s}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   HOW IT WORKS
   ═══════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: <MessageCircle size={20} color="#FFF" strokeWidth={2} />,
      iconBg: "#25D366",
      title: "Paste any WhatsApp order message",
      body: "Hindi, English, or Hinglish — our AI understands it all. No formatting needed.",
      preview: "bhai kal 5 thali ready rakhna, evening delivery",
      previewType: "chat" as const,
    },
    {
      num: "02",
      icon: <Zap size={20} color="#FFF" strokeWidth={2} />,
      iconBg: ORANGE,
      title: "Claude AI reads and structures the order",
      body: "Items, quantities, prices, delivery intent — all pulled out automatically in under 2 seconds.",
      preview: null,
      previewType: "order" as const,
    },
    {
      num: "03",
      icon: <FileText size={20} color="#FFF" strokeWidth={2} />,
      iconBg: NAVY,
      title: "GST-compliant PDF invoice, ready to share",
      body: "One click. Sends directly on WhatsApp. Your customer gets a proper invoice, you get paid faster.",
      preview: null,
      previewType: "invoice" as const,
    },
  ];

  return (
    <section
      id="how-it-works"
      className="w-full py-16 md:py-24 px-6 md:px-10"
      style={{ backgroundColor: BASE_BG, fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
        <div className="flex flex-col items-center gap-3 mb-14">
          <span style={SECTION_LABEL}>HOW IT WORKS</span>
          <h2
            className="m-0 text-center"
            style={{
              fontSize: "clamp(24px, 3vw, 32px)",
              fontWeight: 700,
              color: NAVY,
            }}
          >
            From messy chat to paid invoice — in 3 steps.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((s, idx) => (
            <div
              key={s.num}
              className="flex flex-col relative overflow-hidden"
              style={{
                ...CARD,
                padding: 28,
              }}
            >
              {/* Decorative step number */}
              <span
                className="absolute top-3 right-4"
                style={{
                  fontSize: 72,
                  fontWeight: 800,
                  color: "rgba(0,0,0,0.03)",
                  lineHeight: 1,
                  fontFamily: "'DM Sans', sans-serif",
                  userSelect: "none",
                }}
              >
                {s.num}
              </span>

              {/* Icon */}
              <div
                className="w-[40px] h-[40px] flex items-center justify-center mb-4"
                style={{ backgroundColor: s.iconBg, borderRadius: 11 }}
              >
                {s.icon}
              </div>

              <h3
                className="m-0 mb-2"
                style={{ fontSize: 16, fontWeight: 700, color: "#0D0F12" }}
              >
                {s.title}
              </h3>
              <p
                className="m-0 mb-5 flex-1"
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: GREY,
                  lineHeight: 1.6,
                }}
              >
                {s.body}
              </p>

              {/* Mini preview */}
              {s.previewType === "chat" && (
                <div
                  className="px-3 py-2"
                  style={{
                    backgroundColor: "#DCF8C6",
                    borderRadius: "10px 10px 2px 10px",
                    fontSize: 12,
                    color: "#111318",
                    lineHeight: 1.5,
                    fontStyle: "italic",
                  }}
                >
                  "{s.preview}"
                </div>
              )}
              {s.previewType === "order" && (
                <div
                  className="flex flex-col gap-1.5 p-3"
                  style={{
                    backgroundColor: BASE_BG,
                    borderRadius: 10,
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  {[
                    { i: "Thali", q: "5x", p: "₹250" },
                  ].map((r) => (
                    <div
                      key={r.i}
                      className="flex justify-between text-[11px]"
                    >
                      <span style={{ fontWeight: 500, color: "#0D0F12" }}>
                        {r.i} {r.q}
                      </span>
                      <span style={{ ...MONO, fontSize: 11, color: "#0D0F12" }}>
                        {r.p}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle2 size={10} color={GREEN} strokeWidth={2.5} />
                    <span
                      className="text-[10px]"
                      style={{ fontWeight: 600, color: GREEN }}
                    >
                      Confidence: 97%
                    </span>
                  </div>
                </div>
              )}
              {s.previewType === "invoice" && (
                <div
                  className="flex flex-col gap-1.5 p-3 relative"
                  style={{
                    backgroundColor: BASE_BG,
                    borderRadius: 10,
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <FileText size={11} color={NAVY} />
                    <span
                      className="text-[10px]"
                      style={{ fontWeight: 700, color: NAVY }}
                    >
                      Tax Invoice #INV-047
                    </span>
                  </div>
                  <div
                    style={{
                      width: 60,
                      height: 3,
                      backgroundColor: BORDER,
                      borderRadius: 2,
                    }}
                  />
                  <div
                    style={{
                      width: 80,
                      height: 3,
                      backgroundColor: BORDER,
                      borderRadius: 2,
                    }}
                  />
                  <span
                    className="absolute top-2 right-2 text-[8px] px-1.5 py-0.5"
                    style={{
                      backgroundColor: "rgba(0,200,83,0.1)",
                      borderRadius: 4,
                      fontWeight: 700,
                      color: GREEN,
                      transform: "rotate(-6deg)",
                    }}
                  >
                    VALID
                  </span>
                </div>
              )}

              {/* Dotted connector (desktop) */}
              {idx < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-1/2 -right-[14px] w-[22px]"
                  style={{
                    borderTop: `2px dashed ${BORDER}`,
                    zIndex: 10,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   FEATURES BENTO GRID
   ═══════════════════════════════════════ */
function FeaturesGrid() {
  return (
    <section
      id="features"
      className="w-full py-16 md:py-24 px-6 md:px-10"
      style={{
        backgroundColor: CARD_BG,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
        <div className="flex flex-col items-center gap-3 mb-14">
          <span style={SECTION_LABEL}>FEATURES</span>
          <h2
            className="m-0 text-center"
            style={{
              fontSize: "clamp(24px, 3vw, 32px)",
              fontWeight: 700,
              color: NAVY,
            }}
          >
            Everything a growing Indian business needs.
          </h2>
        </div>

        <div
          className="grid gap-5"
          style={{
            gridTemplateColumns: "repeat(3, 1fr)",
          }}
        >
          {/* Large card – Hinglish AI (2 cols) */}
          <div
            className="col-span-3 md:col-span-2 flex flex-col md:flex-row overflow-hidden"
            style={CARD}
          >
            <div className="flex-1 p-7 flex flex-col justify-center">
              <h3
                className="m-0 mb-2"
                style={{ fontSize: 20, fontWeight: 700, color: "#0D0F12" }}
              >
                Hinglish AI That Actually Works
              </h3>
              <p
                className="m-0"
                style={{ fontSize: 14, color: GREY, lineHeight: 1.6 }}
              >
                Built specifically for how Indian business owners actually type.
                No need to write in perfect English.
              </p>
            </div>
            <div
              className="flex-1 flex items-center justify-center p-5"
              style={{ backgroundColor: BASE_BG }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="px-3 py-2"
                  style={{
                    backgroundColor: "#DCF8C6",
                    borderRadius: "10px 10px 2px 10px",
                    fontSize: 11,
                    color: "#111318",
                    maxWidth: 120,
                  }}
                >
                  "bhai 2 bag cement aur 50 rod chahiye"
                </div>
                <Zap size={16} color={ORANGE} />
                <div
                  className="flex flex-col gap-1 p-2.5"
                  style={{
                    borderRadius: 10,
                    border: `1px solid ${BORDER}`,
                    backgroundColor: CARD_BG,
                    fontSize: 11,
                    minWidth: 100,
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#0D0F12" }}>
                    Cement × 2 bag
                  </span>
                  <span style={{ fontWeight: 600, color: "#0D0F12" }}>
                    Rod × 50 pcs
                  </span>
                  <span
                    className="text-[9px] mt-0.5"
                    style={{ color: GREEN, fontWeight: 600 }}
                  >
                    ✓ Extracted
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* GST Invoice */}
          <div
            className="col-span-3 md:col-span-1 flex flex-col p-7"
            style={CARD}
          >
            <div
              className="w-[40px] h-[40px] flex items-center justify-center mb-4"
              style={{
                background: `linear-gradient(135deg, ${NAVY}, ${BLUE})`,
                borderRadius: 11,
              }}
            >
              <FileText size={20} color="#FFF" strokeWidth={2} />
            </div>
            <h3
              className="m-0 mb-2"
              style={{ fontSize: 16, fontWeight: 700, color: "#0D0F12" }}
            >
              GST Invoice in 1 Click
            </h3>
            <p
              className="m-0"
              style={{ fontSize: 13, color: GREY, lineHeight: 1.6 }}
            >
              CGST, SGST, HSN codes — all calculated and filled automatically.
            </p>
          </div>

          {/* PII Protected */}
          <div
            className="col-span-3 md:col-span-1 flex flex-col p-7"
            style={CARD}
          >
            <div
              className="w-[40px] h-[40px] flex items-center justify-center mb-4"
              style={{ backgroundColor: "rgba(0,200,83,0.1)", borderRadius: 11 }}
            >
              <Shield size={20} color={GREEN} strokeWidth={2} />
            </div>
            <h3
              className="m-0 mb-2"
              style={{ fontSize: 16, fontWeight: 700, color: "#0D0F12" }}
            >
              PII Protected by Default
            </h3>
            <p
              className="m-0"
              style={{ fontSize: 13, color: GREY, lineHeight: 1.6 }}
            >
              Customer names and phone numbers are automatically redacted in
              your records.
            </p>
          </div>

          {/* Live Order Dashboard */}
          <div
            className="col-span-3 md:col-span-1 flex flex-col p-7"
            style={CARD}
          >
            <div
              className="w-[40px] h-[40px] flex items-center justify-center mb-4"
              style={{ backgroundColor: "rgba(41,121,255,0.1)", borderRadius: 11 }}
            >
              <LayoutDashboard size={20} color={BLUE} strokeWidth={2} />
            </div>
            <h3
              className="m-0 mb-2"
              style={{ fontSize: 16, fontWeight: 700, color: "#0D0F12" }}
            >
              Live Order Dashboard
            </h3>
            <p
              className="m-0"
              style={{ fontSize: 13, color: GREY, lineHeight: 1.6 }}
            >
              See all pending, paid, and processing orders in one place.
            </p>
          </div>

          {/* Large card – WhatsApp Native (2 cols) */}
          <div
            className="col-span-3 md:col-span-2 flex flex-col md:flex-row overflow-hidden"
            style={CARD}
          >
            <div className="flex-1 p-7 flex flex-col justify-center">
              <h3
                className="m-0 mb-2"
                style={{ fontSize: 20, fontWeight: 700, color: "#0D0F12" }}
              >
                WhatsApp-Native Sharing
              </h3>
              <p
                className="m-0"
                style={{ fontSize: 14, color: GREY, lineHeight: 1.6 }}
              >
                Send invoices directly back to your customer's WhatsApp in one
                tap. No email, no app download needed.
              </p>
            </div>
            <div
              className="flex-1 flex items-center justify-center p-5"
              style={{ backgroundColor: BASE_BG }}
            >
              {/* Mini phone mockup */}
              <div
                className="flex flex-col overflow-hidden"
                style={{
                  width: 140,
                  borderRadius: 16,
                  border: "2px solid #0D0F12",
                  backgroundColor: CARD_BG,
                }}
              >
                <div
                  className="flex items-center gap-1.5 px-3 py-2"
                  style={{
                    backgroundColor: "#25D366",
                  }}
                >
                  <MessageCircle size={10} color="#FFF" />
                  <span
                    className="text-[9px]"
                    style={{ fontWeight: 600, color: "#FFF" }}
                  >
                    WhatsApp
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 p-2.5">
                  <div
                    className="px-2 py-1"
                    style={{
                      backgroundColor: "#DCF8C6",
                      borderRadius: 6,
                      fontSize: 8,
                      color: "#111318",
                    }}
                  >
                    Invoice #INV-047
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 size={8} color={NAVY} />
                    <span
                      className="text-[8px]"
                      style={{ fontWeight: 600, color: NAVY }}
                    >
                      Shared via Chat2Cash
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lock icon card (1 col) — already have PII above, so use Lock icon */}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   PRICING
   ═══════════════════════════════════════ */
function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "₹0",
      subtitle: "Perfect to get started",
      features: [
        "50 extractions/month",
        "1 store",
        "Basic invoices",
        "Email support",
      ],
      cta: "Start Free",
      highlighted: false,
    },
    {
      name: "Growth",
      price: "₹499",
      subtitle: "For active kirana stores",
      features: [
        "Unlimited extractions",
        "3 stores",
        "GST invoices",
        "WhatsApp sharing",
        "Priority support",
      ],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Business",
      price: "₹1,499",
      subtitle: "For wholesale & multi-outlet",
      features: [
        "Everything in Growth",
        "10 stores",
        "API access",
        "Custom invoice branding",
        "Dedicated support",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <section
      id="pricing"
      className="w-full py-16 md:py-24 px-6 md:px-10"
      style={{ backgroundColor: BASE_BG, fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="mx-auto" style={{ maxWidth: 1000 }}>
        <div className="flex flex-col items-center gap-2 mb-4">
          <span style={SECTION_LABEL}>PRICING</span>
          <h2
            className="m-0 text-center"
            style={{
              fontSize: "clamp(24px, 3vw, 32px)",
              fontWeight: 700,
              color: NAVY,
            }}
          >
            Simple pricing. No surprises.
          </h2>
          <p
            className="m-0 text-center text-[16px]"
            style={{ color: GREY, fontWeight: 400 }}
          >
            Start free. Upgrade when you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
          {plans.map((p) => (
            <div
              key={p.name}
              className="flex flex-col p-7 relative"
              style={{
                backgroundColor: p.highlighted ? NAVY : CARD_BG,
                borderRadius: 16,
                border: p.highlighted
                  ? "none"
                  : `1px solid ${p.name === "Business" ? NAVY : BORDER}`,
                boxShadow: p.highlighted
                  ? "0 20px 60px rgba(26,26,46,0.2)"
                  : "0px 2px 12px rgba(0,0,0,0.07)",
              }}
            >
              {p.highlighted && (
                <span
                  className="absolute -top-3 left-1/2 px-3 py-1 text-[10px]"
                  style={{
                    transform: "translateX(-50%)",
                    backgroundColor: ORANGE,
                    color: "#FFF",
                    borderRadius: 100,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  RECOMMENDED
                </span>
              )}

              <h3
                className="m-0 mb-1"
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: p.highlighted ? "#FFF" : "#0D0F12",
                }}
              >
                {p.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: p.highlighted ? "#FFF" : NAVY,
                    lineHeight: 1.1,
                  }}
                >
                  {p.price}
                </span>
                <span
                  className="text-[14px]"
                  style={{
                    fontWeight: 400,
                    color: p.highlighted ? "rgba(255,255,255,0.6)" : GREY,
                  }}
                >
                  / month
                </span>
              </div>
              <p
                className="m-0 mb-5 text-[13px]"
                style={{
                  color: p.highlighted ? "rgba(255,255,255,0.6)" : GREY,
                }}
              >
                {p.subtitle}
              </p>

              <div className="flex flex-col gap-3 flex-1 mb-6">
                {p.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <Check
                      size={14}
                      color={p.highlighted ? GREEN : GREEN}
                      strokeWidth={2.5}
                    />
                    <span
                      className="text-[13px]"
                      style={{
                        fontWeight: 400,
                        color: p.highlighted ? "rgba(255,255,255,0.9)" : "#0D0F12",
                      }}
                    >
                      {f}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="w-full py-3.5 cursor-pointer text-[14px]"
                style={{
                  borderRadius: 12,
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  border: p.highlighted
                    ? "none"
                    : `1.5px solid ${NAVY}`,
                  backgroundColor: p.highlighted ? ORANGE : "transparent",
                  color: p.highlighted ? "#FFF" : NAVY,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (p.highlighted) {
                    e.currentTarget.style.backgroundColor = "#e66200";
                  } else {
                    e.currentTarget.style.backgroundColor = NAVY;
                    e.currentTarget.style.color = "#FFF";
                  }
                }}
                onMouseLeave={(e) => {
                  if (p.highlighted) {
                    e.currentTarget.style.backgroundColor = ORANGE;
                  } else {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = NAVY;
                  }
                }}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   TESTIMONIAL
   ═══════════════════════════════════════ */
function Testimonial() {
  return (
    <section
      className="w-full py-16 md:py-24 px-6"
      style={{
        backgroundColor: CARD_BG,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        className="mx-auto flex flex-col items-center"
        style={{ maxWidth: 720 }}
      >
        {/* Stars */}
        <div className="flex gap-1 mb-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={20}
              color="#F59E0B"
              fill="#F59E0B"
              strokeWidth={0}
            />
          ))}
        </div>

        {/* Quote block */}
        <div
          className="px-8 py-6 mb-5"
          style={{ backgroundColor: "#FFFBEB", borderRadius: 16 }}
        >
          <p
            className="m-0 text-center"
            style={{
              fontSize: "clamp(18px, 2.5vw, 24px)",
              fontWeight: 500,
              color: NAVY,
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            "Pehle roz ek ghanta lagta tha invoices banane mein. Ab 2 minute
            mein sab ho jaata hai."
          </p>
          <p
            className="m-0 mt-3 text-center text-[14px]"
            style={{ color: GREY, fontStyle: "italic" }}
          >
            "Earlier it used to take an hour every day to make invoices. Now
            it's done in 2 minutes."
          </p>
        </div>

        <p
          className="m-0 text-[14px]"
          style={{ fontWeight: 600, color: "#0D0F12" }}
        >
          — Rajesh Sharma, Sharma Wholesale, Delhi
        </p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   FINAL CTA
   ═══════════════════════════════════════ */
function FinalCTA() {
  return (
    <section
      className="w-full flex flex-col items-center justify-center px-6"
      style={{
        backgroundColor: NAVY,
        minHeight: 320,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <h2
        className="m-0 text-center mb-3"
        style={{
          fontSize: "clamp(24px, 3vw, 36px)",
          fontWeight: 700,
          color: "#FFF",
        }}
      >
        Stop losing orders in your WhatsApp chats.
      </h2>
      <p
        className="m-0 text-center mb-8 text-[16px]"
        style={{ color: "rgba(255,255,255,0.6)" }}
      >
        Join 2,400+ Indian businesses already using Chat2Cash.
      </p>
      <button
        className="cursor-pointer px-10 flex items-center justify-center mb-4"
        style={{
          height: 56,
          backgroundColor: ORANGE,
          color: "#FFF",
          borderRadius: 100,
          border: "none",
          fontWeight: 600,
          fontSize: 16,
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: "0px 4px 20px rgba(255,109,0,0.3)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#e66200";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = ORANGE;
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        Start Free — Takes 2 Minutes
      </button>
      <p
        className="m-0 text-center text-[13px]"
        style={{ color: "rgba(255,255,255,0.45)" }}
      >
        No credit card required &bull; Cancel anytime &bull; GST compliant
      </p>
    </section>
  );
}

/* ═══════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════ */
function Footer() {
  const columns = [
    {
      title: "Product",
      links: ["Features", "Pricing", "Changelog", "Roadmap"],
    },
    {
      title: "Company",
      links: ["About", "Blog", "Careers", "Press"],
    },
    {
      title: "Support",
      links: ["Help Center", "WhatsApp Support", "API Docs", "Status"],
    },
  ];

  return (
    <footer
      className="w-full px-6 md:px-10 pt-14 pb-6"
      style={{
        backgroundColor: "#0D0F12",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        className="mx-auto grid grid-cols-1 md:grid-cols-5 gap-10 mb-10"
        style={{ maxWidth: 1200 }}
      >
        {/* Brand col */}
        <div className="md:col-span-2 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-[28px] h-[28px] flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${NAVY}, ${BLUE})`,
                borderRadius: 7,
              }}
            >
              <Zap size={14} color="#FFF" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#FFF" }}>
              Chat<span style={{ color: BLUE }}>2</span>Cash
            </span>
          </div>
          <p
            className="m-0 text-[13px]"
            style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}
          >
            AI-powered operations for India's SMBs
          </p>
          <p
            className="m-0 text-[13px] mt-2"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Made with ❤️ in India 🇮🇳
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Linkedin size={16} color="rgba(255,255,255,0.4)" />
            <Twitter size={16} color="rgba(255,255,255,0.4)" />
          </div>
        </div>

        {/* Link columns */}
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <span
              className="text-[11px] tracking-[0.06em] uppercase mb-1"
              style={{ fontWeight: 600, color: "rgba(255,255,255,0.3)" }}
            >
              {col.title}
            </span>
            {col.links.map((link) => (
              <a
                key={link}
                href="#"
                className="no-underline text-[13px]"
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontWeight: 400,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "#FFF")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.55)")
                }
              >
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        className="mx-auto flex flex-col md:flex-row items-center justify-between gap-3 pt-6"
        style={{
          maxWidth: 1200,
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span
          className="text-[12px]"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          &copy; 2024 Chat2Cash. All rights reserved.
        </span>
        <span
          className="text-[12px]"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          Privacy Policy &bull; Terms of Service &bull; GST: 27XXXXX1234X1ZX
        </span>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════
   LANDING PAGE (main export)
   ═══════════════════════════════════════ */
export function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        scrollBehavior: "smooth",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <Navbar />
      <HeroSection />
      <SocialProof />
      <HowItWorks />
      <FeaturesGrid />
      <Pricing />
      <Testimonial />
      <FinalCTA />
      <Footer />

      {/* Hero float animation */}
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: rotate(-2deg) translateY(0); }
          50% { transform: rotate(-2deg) translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
