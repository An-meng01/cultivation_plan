import { motion } from 'framer-motion';

const lightBlobs = [
  { color: '#bfe6c3', size: 460, top: -100, left: -80, dx: 36, dy: 44, dur: 19 },
  { color: '#e9c6e6', size: 380, top: 120, right: -100, dx: -44, dy: 32, dur: 23 },
  { color: '#cdeccd', size: 320, bottom: -80, left: 140, dx: 24, dy: -34, dur: 21 },
  { color: '#fff0d9', size: 280, bottom: 40, right: 80, dx: -22, dy: 24, dur: 25 },
];

const darkBlobs = [
  { color: '#1f4d33', size: 460, top: -100, left: -80, dx: 36, dy: 44, dur: 19 },
  { color: '#3a2350', size: 380, top: 120, right: -100, dx: -44, dy: 32, dur: 23 },
  { color: '#234a3a', size: 320, bottom: -80, left: 140, dx: 24, dy: -34, dur: 21 },
  { color: '#3a2535', size: 280, bottom: 40, right: 80, dx: -22, dy: 24, dur: 25 },
];

function Leaf({ top, left, size, delay, dur, dark }: { top: number | string; left: number | string; size: number; delay: number; dur: number; dark: boolean }) {
  return (
    <motion.div
      style={{ position: 'absolute', top, left, width: size, height: size, opacity: dark ? 0.3 : 0.5 }}
      animate={{ y: [0, -26, 0], x: [0, 14, 0], rotate: [0, 25, 0] }}
      transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <path d="M4 20 C4 8 12 4 20 4 C20 16 12 20 4 20 Z" fill={dark ? '#3f8f5f' : '#8ed18e'} />
        <path d="M5 19 C9 14 14 10 19 6" stroke={dark ? '#5cb85c' : '#5cb85c'} strokeWidth="1.2" fill="none" />
      </svg>
    </motion.div>
  );
}

export default function AnimatedBackground({ dark = false }: { dark?: boolean }) {
  const blobs = dark ? darkBlobs : lightBlobs;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        background: dark
          ? 'linear-gradient(135deg, #0f2018 0%, #161427 50%, #1d1622 100%)'
          : 'linear-gradient(135deg, #eef7ee 0%, #e6f3ea 45%, #fbeef4 100%)',
      }}
    >
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            background: b.color,
            filter: 'blur(46px)',
            opacity: 0.6,
            top: b.top,
            left: b.left,
            right: b.right,
            bottom: b.bottom,
          }}
          animate={{ x: [0, b.dx, 0], y: [0, b.dy, 0] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <Leaf top={90} left="12%" size={26} delay={0} dur={9} dark={dark} />
      <Leaf top={60} left="78%" size={20} delay={2} dur={11} dark={dark} />
      <Leaf top="70%" left="22%" size={22} delay={4} dur={10} dark={dark} />
      <Leaf top="82%" left="65%" size={18} delay={1.5} dur={12} dark={dark} />
      <Leaf top={40} left="46%" size={16} delay={3} dur={13} dark={dark} />
    </div>
  );
}
