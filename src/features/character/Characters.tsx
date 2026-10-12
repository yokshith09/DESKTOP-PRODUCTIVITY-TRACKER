import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * The new characters (Phase 7, pulled forward by the owner): Mochi, Pip, Bolt, Byte, Ghosty.
 * Same "soft 3D" drawing as Loaf the bear, and the same core poses, so every reaction works
 * with every character. `type` is the typing-along pose: a laptop opens and they tap with you.
 */
export const CHARACTER_POSES = ["idle", "type", "cheer", "sleep"] as const;
export type CharacterPose = (typeof CHARACTER_POSES)[number];
export interface CharacterProps { pose?: CharacterPose; animated?: boolean; className?: string }

function useIds() {
  const u = useId().replace(/:/g, "");
  return { id: (n: string) => `${n}-${u}`, url: (n: string) => `url(#${n}-${u})` };
}

/** The shared little laptop, seen from behind the lid (the character faces you). */
function Laptop({ animated, y = 128 }: { animated: boolean; y?: number }) {
  return (
    <g className={animated ? "pet-lid-open" : undefined}>
      <path d={`M64 ${y + 26} L136 ${y + 26} L142 ${y + 42} L58 ${y + 42} Z`} fill="#374151" />
      <rect x="70" y={y - 4} width="60" height="32" rx="3" fill="#1F2937" />
      <rect x="73" y={y - 1} width="54" height="26" rx="2" fill="#60A5FA" opacity=".85" className={animated ? "bear-screen" : undefined} />
      <circle cx="100" cy={y + 12} r="3" fill="#E0F2FE" />
    </g>
  );
}

function Shadow({ url, w = 56 }: { url: (n: string) => string; w?: number }) {
  return <ellipse cx="100" cy="189" rx={w} ry="7" fill="#000" opacity=".26" filter={url("soft")} />;
}

function Defs({ id, a, b, c }: { id: (n: string) => string; a: string; b: string; c: string }) {
  return (
    <defs>
      <radialGradient id={id("body")} cx="34%" cy="24%" r="88%"><stop offset="0" stopColor={a} /><stop offset=".55" stopColor={b} /><stop offset="1" stopColor={c} /></radialGradient>
      <radialGradient id={id("shade")} cx="38%" cy="30%" r="75%"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".28" /></radialGradient>
      <radialGradient id={id("gloss")} cx="30%" cy="20%" r="60%"><stop offset="0" stopColor="#fff" stopOpacity=".75" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      <filter id={id("soft")} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.5" /></filter>
    </defs>
  );
}

/** Eyes: open with highlights, happy arcs, or closed. */
function Eyes({ pose, l, r, y, size = 8, color = "#1a1210" }: { pose: CharacterPose; l: number; r: number; y: number; size?: number; color?: string }) {
  if (pose === "cheer") return <g fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round"><path d={`M${l - 9} ${y + 3} q9 -11 18 0`} /><path d={`M${r - 9} ${y + 3} q9 -11 18 0`} /></g>;
  if (pose === "sleep") return <g fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round"><path d={`M${l - 9} ${y} q9 8 18 0`} /><path d={`M${r - 9} ${y} q9 8 18 0`} /></g>;
  const dy = pose === "type" ? 3 : 0;
  return (
    <g>
      {[l, r].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={y + dy} rx={size} ry={size + 1} fill={color} />
          <circle cx={x - size / 3} cy={y + dy - size / 2.5} r={size / 2.6} fill="#fff" />
        </g>
      ))}
    </g>
  );
}

function Zzz({ on }: { on: boolean }) {
  if (!on) return null;
  return <g fill="#94A3B8" fontWeight="700" fontFamily="system-ui, sans-serif"><text x="150" y="40" fontSize="16" className="bear-zzz">z</text><text x="162" y="24" fontSize="12" className="bear-zzz bear-zzz-late">z</text></g>;
}

const bodyAnim = (pose: CharacterPose, animated: boolean) =>
  !animated ? undefined : pose === "cheer" ? "bear-jump" : pose === "sleep" ? "bear-breathe-slow" : "bear-breathe";
const tap = (pose: CharacterPose, animated: boolean, side: "l" | "r") =>
  animated && pose === "type" ? (side === "l" ? "pet-tap-l" : "pet-tap-r") : undefined;

/** Mochi the cat: paws at the keys; curls up asleep. */
export function Mochi({ pose = "idle", animated = false, className }: CharacterProps) {
  const { id, url } = useIds();
  const up = pose === "cheer";
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={`Mochi the cat (${pose})`} className={cn("overflow-visible", className)}>
      <Defs id={id} a="#FFF7EE" b="#F4D3B0" c="#C99A6B" />
      <Shadow url={url} />
      <g className={bodyAnim(pose, animated)}>
        <path d="M150 170 q40 -10 30 -50 q-4 -14 -12 -6 q8 30 -26 44 z" fill={url("body")} />
        <ellipse cx="100" cy="146" rx="50" ry="40" fill={url("body")} />
        <ellipse cx="100" cy="146" rx="50" ry="40" fill={url("shade")} />
        <ellipse cx="100" cy="156" rx="26" ry="22" fill="#FFFDF9" opacity=".9" />
        {pose === "type" && <Laptop animated={animated} />}
        {[72, 128].map((x, i) => (
          <ellipse key={x} cx={x} cy={up ? 96 : pose === "type" ? 166 : 174} rx="13" ry="10" fill={url("body")} className={tap(pose, animated, i ? "r" : "l")} />
        ))}
        <path d="M58 52 L66 18 L88 44 Z M142 52 L134 18 L112 44 Z" fill={url("body")} />
        <path d="M64 46 L68 28 L80 42 Z M136 46 L132 28 L120 42 Z" fill="#F7A9B4" />
        <ellipse cx="100" cy="78" rx="52" ry="44" fill={url("body")} />
        <ellipse cx="100" cy="78" rx="52" ry="44" fill={url("shade")} />
        <path d="M86 40 q6 8 0 16 M100 36 v18 M114 40 q-6 8 0 16" stroke="#E0A86E" strokeWidth="4" strokeLinecap="round" fill="none" />
        <ellipse cx="80" cy="50" rx="24" ry="11" fill={url("gloss")} />
        <Eyes pose={pose} l={80} r={120} y={76} color="#2B3A1E" />
        <path d="M96 92 l4 4 l4 -4 z" fill="#F08A9A" />
        <path d="M100 96 q-6 6 -12 2 M100 96 q6 6 12 2" stroke="#3A2620" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <g stroke="#B08868" strokeWidth="1.6" strokeLinecap="round"><path d="M70 94 h-18 M70 99 l-16 4 M130 94 h18 M130 99 l16 4" /></g>
        <ellipse cx="66" cy="92" rx="8" ry="5" fill="#FF9AA8" opacity=".4" /><ellipse cx="134" cy="92" rx="8" ry="5" fill="#FF9AA8" opacity=".4" />
      </g>
      <Zzz on={pose === "sleep"} />
    </svg>
  );
}

/** Pip the penguin: flippers slap the keys; belly-slides when happy. */
export function Pip({ pose = "idle", animated = false, className }: CharacterProps) {
  const { id, url } = useIds();
  const up = pose === "cheer";
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={`Pip the penguin (${pose})`} className={cn("overflow-visible", className)}>
      <Defs id={id} a="#5B6B8C" b="#2D3A55" c="#141B2B" />
      <Shadow url={url} w={44} />
      <g className={bodyAnim(pose, animated)}>
        <ellipse cx="82" cy="184" rx="14" ry="6" fill="#F59E0B" /><ellipse cx="118" cy="184" rx="14" ry="6" fill="#F59E0B" />
        <ellipse cx="100" cy="112" rx="56" ry="74" fill={url("body")} />
        <ellipse cx="100" cy="112" rx="56" ry="74" fill={url("shade")} />
        <ellipse cx="100" cy="128" rx="38" ry="54" fill="#FBFBF7" />
        <ellipse cx="100" cy="80" rx="34" ry="28" fill="#FBFBF7" />
        <ellipse cx="78" cy="56" rx="22" ry="12" fill={url("gloss")} />
        {pose === "type" && <Laptop animated={animated} y={132} />}
        {[{ x: 46, s: "l" as const, r: up ? -60 : pose === "type" ? -35 : 12 }, { x: 154, s: "r" as const, r: up ? 60 : pose === "type" ? 35 : -12 }].map((f) => (
          <ellipse key={f.x} cx={f.x} cy="128" rx="12" ry="34" fill={url("body")} transform={`rotate(${f.r} ${f.x} 100)`} className={tap(pose, animated, f.s)} />
        ))}
        <Eyes pose={pose} l={86} r={114} y={76} size={6} />
        <path d="M92 90 q8 -6 16 0 q-8 10 -16 0 z" fill="#F59E0B" />
        <ellipse cx="74" cy="92" rx="7" ry="4" fill="#FF9AA8" opacity=".5" /><ellipse cx="126" cy="92" rx="7" ry="4" fill="#FF9AA8" opacity=".5" />
      </g>
      <Zzz on={pose === "sleep"} />
    </svg>
  );
}

/** Bolt the robot: its screen-face scrolls code while you type. */
export function Bolt({ pose = "idle", animated = false, className }: CharacterProps) {
  const { id, url } = useIds();
  const up = pose === "cheer";
  const face = pose === "sleep" ? "#334155" : "#0F172A";
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={`Bolt the robot (${pose})`} className={cn("overflow-visible", className)}>
      <Defs id={id} a="#E2E8F0" b="#94A3B8" c="#475569" />
      <Shadow url={url} w={50} />
      <g className={bodyAnim(pose, animated)}>
        <rect x="70" y="170" width="20" height="14" rx="4" fill="#64748B" /><rect x="110" y="170" width="20" height="14" rx="4" fill="#64748B" />
        <rect x="56" y="112" width="88" height="64" rx="18" fill={url("body")} />
        <rect x="56" y="112" width="88" height="64" rx="18" fill={url("shade")} />
        <circle cx="100" cy="142" r="9" fill="#38BDF8" className={animated ? "pet-glow" : undefined} />
        {pose === "type" && <Laptop animated={animated} y={136} />}
        {[{ x: 44, s: "l" as const }, { x: 156, s: "r" as const }].map((a) => (
          <rect key={a.x} x={a.x - 8} y={up ? 70 : pose === "type" ? 140 : 120} width="16" height="40" rx="8" fill={url("body")} className={tap(pose, animated, a.s)} />
        ))}
        <line x1="100" y1="22" x2="100" y2="36" stroke="#64748B" strokeWidth="4" />
        <circle cx="100" cy="18" r="7" fill="#F43F5E" className={animated ? "pet-glow" : undefined} />
        <rect x="46" y="34" width="108" height="80" rx="22" fill={url("body")} />
        <rect x="46" y="34" width="108" height="80" rx="22" fill={url("shade")} />
        <rect x="58" y="46" width="84" height="56" rx="12" fill={face} />
        <ellipse cx="78" cy="42" rx="22" ry="7" fill={url("gloss")} />
        {pose === "type" ? (
          <g className={animated ? "pet-code" : undefined} stroke="#4ADE80" strokeWidth="3" strokeLinecap="round">
            <path d="M66 58 h20 M90 58 h14 M66 68 h12 M82 68 h26 M66 78 h30 M66 88 h16 M86 88 h22" />
          </g>
        ) : pose === "sleep" ? (
          <g stroke="#94A3B8" strokeWidth="3" strokeLinecap="round"><path d="M74 74 h16 M110 74 h16" /></g>
        ) : (
          <g fill="#4ADE80">
            {up ? <g fill="none" stroke="#4ADE80" strokeWidth="4" strokeLinecap="round"><path d="M72 76 q8 -10 16 0 M112 76 q8 -10 16 0" /></g>
              : <><rect x="74" y="64" width="12" height="16" rx="4" /><rect x="114" y="64" width="12" height="16" rx="4" /></>}
            <path d="M88 90 q12 8 24 0" fill="none" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
      </g>
      <Zzz on={pose === "sleep"} />
    </svg>
  );
}

/** Byte the hamster: a wheel spins behind it while you type; naps in its bedding. */
export function Byte({ pose = "idle", animated = false, className }: CharacterProps) {
  const { id, url } = useIds();
  const up = pose === "cheer";
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={`Byte the hamster (${pose})`} className={cn("overflow-visible", className)}>
      <Defs id={id} a="#FFE7C2" b="#F2B66D" c="#C27A35" />
      <Shadow url={url} w={52} />
      {pose === "type" && (
        <g className={animated ? "pet-wheel" : undefined} opacity=".5">
          <circle cx="100" cy="110" r="84" fill="none" stroke="#94A3B8" strokeWidth="5" />
          {[0, 45, 90, 135].map((a) => <line key={a} x1="100" y1="26" x2="100" y2="194" stroke="#CBD5E1" strokeWidth="2" transform={`rotate(${a} 100 110)`} />)}
        </g>
      )}
      {pose === "sleep" && <ellipse cx="100" cy="182" rx="74" ry="14" fill="#FDE68A" opacity=".8" />}
      <g className={bodyAnim(pose, animated)}>
        <ellipse cx="100" cy="132" rx="64" ry="54" fill={url("body")} />
        <ellipse cx="100" cy="132" rx="64" ry="54" fill={url("shade")} />
        <ellipse cx="100" cy="146" rx="38" ry="34" fill="#FFF8EC" />
        {[{ x: 52, y: 70 }, { x: 148, y: 70 }].map((e) => (
          <g key={e.x}><circle cx={e.x} cy={e.y} r="16" fill={url("body")} /><circle cx={e.x} cy={e.y + 2} r="9" fill="#F7A9B4" /></g>
        ))}
        <ellipse cx="80" cy="96" rx="26" ry="12" fill={url("gloss")} />
        {pose === "type" && <Laptop animated={animated} y={130} />}
        {[{ x: 82, s: "l" as const }, { x: 118, s: "r" as const }].map((p) => (
          <ellipse key={p.x} cx={p.x} cy={up ? 100 : pose === "type" ? 164 : 160} rx="9" ry="7" fill="#F7C9A8" className={tap(pose, animated, p.s)} />
        ))}
        <Eyes pose={pose} l={82} r={118} y={112} size={7} />
        <ellipse cx="100" cy="126" rx="5" ry="3.5" fill="#E07A8A" />
        <path d="M100 129 v4 M100 133 q-5 4 -10 1 M100 133 q5 4 10 1" stroke="#3A2620" strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="62" cy="128" rx="13" ry="10" fill="#FF9AA8" opacity=".45" /><ellipse cx="138" cy="128" rx="13" ry="10" fill="#FF9AA8" opacity=".45" />
      </g>
      <Zzz on={pose === "sleep"} />
    </svg>
  );
}

/** Ghosty: floats, glows while you type, fades a little when asleep. */
export function Ghosty({ pose = "idle", animated = false, className }: CharacterProps) {
  const { id, url } = useIds();
  const up = pose === "cheer";
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={`Ghosty (${pose})`} className={cn("overflow-visible", className)} style={{ opacity: pose === "sleep" ? 0.7 : 1 }}>
      <Defs id={id} a="#FFFFFF" b="#EEF2FF" c="#C7D2FE" />
      <Shadow url={url} w={40} />
      {pose === "type" && <circle cx="100" cy="100" r="80" fill="#A5B4FC" opacity=".25" filter={url("soft")} className={animated ? "pet-glow" : undefined} />}
      <g className={animated && pose !== "cheer" ? "pet-float" : bodyAnim(pose, animated)}>
        <path d="M44 100 q0 -70 56 -70 q56 0 56 70 v66 q-9 12 -18 0 q-9 -12 -19 0 q-9 12 -19 0 q-10 -12 -19 0 q-9 12 -19 0 q-9 -12 -18 0 z" fill={url("body")} />
        <path d="M44 100 q0 -70 56 -70 q56 0 56 70 v66 q-9 12 -18 0 q-9 -12 -19 0 q-9 12 -19 0 q-10 -12 -19 0 q-9 12 -19 0 q-9 -12 -18 0 z" fill={url("shade")} opacity=".6" />
        <ellipse cx="80" cy="56" rx="24" ry="12" fill={url("gloss")} />
        {pose === "type" && <Laptop animated={animated} y={124} />}
        {[{ x: 40, s: "l" as const, r: up ? -50 : pose === "type" ? -20 : 20 }, { x: 160, s: "r" as const, r: up ? 50 : pose === "type" ? 20 : -20 }].map((a) => (
          <ellipse key={a.x} cx={a.x} cy={pose === "type" ? 140 : 116} rx="10" ry="18" fill={url("body")} transform={`rotate(${a.r} ${a.x} 116)`} className={tap(pose, animated, a.s)} />
        ))}
        <Eyes pose={pose} l={82} r={118} y={88} size={7} color="#312E81" />
        {up ? <ellipse cx="100" cy="110" rx="9" ry="7" fill="#312E81" /> : <path d="M92 108 q8 6 16 0" stroke="#312E81" strokeWidth="2.6" fill="none" strokeLinecap="round" />}
        <ellipse cx="68" cy="104" rx="9" ry="5" fill="#FDA4AF" opacity=".5" /><ellipse cx="132" cy="104" rx="9" ry="5" fill="#FDA4AF" opacity=".5" />
      </g>
      <Zzz on={pose === "sleep"} />
    </svg>
  );
}

export const CHARACTERS = [
  { key: "mochi", name: "Mochi", what: "the cat", Component: Mochi },
  { key: "pip", name: "Pip", what: "the penguin", Component: Pip },
  { key: "bolt", name: "Bolt", what: "the robot", Component: Bolt },
  { key: "byte", name: "Byte", what: "the hamster", Component: Byte },
  { key: "ghosty", name: "Ghosty", what: "the ghost", Component: Ghosty },
] as const;
