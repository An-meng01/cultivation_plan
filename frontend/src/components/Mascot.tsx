import { motion } from 'framer-motion';

interface Props {
  size?: number;
  mood?: 'idle' | 'happy';
}

export default function Mascot({ size = 120, mood = 'idle' }: Props) {
  const happy = mood === 'happy';
  return (
    <motion.div
      style={{ width: size, height: size, display: 'inline-block', transformOrigin: 'bottom center' }}
      animate={happy ? { y: [0, -16, 0], rotate: [0, -8, 8, 0] } : { y: [0, -6, 0] }}
      transition={
        happy
          ? { duration: 0.7, repeat: 1, ease: 'easeOut' }
          : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
          <radialGradient id="body" cx="40%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#a5e3a8" />
            <stop offset="100%" stopColor="#5cb85c" />
          </radialGradient>
        </defs>

        {/* 阴影 */}
        <ellipse cx="60" cy="110" rx="26" ry="5" fill="rgba(60,120,60,0.18)" />

        {/* 头顶嫩芽（随风轻摆） */}
        <motion.g
          style={{ transformOrigin: '60px 40px' }}
          animate={{ rotate: [-6, 6, -6] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M60 44 C58 30 50 26 44 22 C54 24 60 32 60 44 Z" fill="#7cc77c" />
          <path d="M60 44 C62 30 70 26 76 22 C66 24 60 32 60 44 Z" fill="#8ed18e" />
        </motion.g>

        {/* 身体（圆润草绿精灵） */}
        <circle cx="60" cy="72" r="30" fill="url(#body)" />
        <ellipse cx="60" cy="80" rx="18" ry="14" fill="#dff5df" opacity="0.7" />

        {/* 脸颊（粉色小花点缀） */}
        <circle cx="46" cy="78" r="5" fill="#ff9ec4" opacity="0.75" />
        <circle cx="74" cy="78" r="5" fill="#ff9ec4" opacity="0.75" />

        {/* 眼睛（会眨） */}
        <motion.g
          animate={{ scaleY: [1, 1, 0.1, 1] }}
          transition={{ duration: 4, times: [0, 0.92, 0.96, 1], repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '60px 68px' }}
        >
          <circle cx="51" cy="68" r="4.2" fill="#2f4a2f" />
          <circle cx="69" cy="68" r="4.2" fill="#2f4a2f" />
          <circle cx="52.4" cy="66.6" r="1.3" fill="#fff" />
          <circle cx="70.4" cy="66.6" r="1.3" fill="#fff" />
        </motion.g>

        {/* 微笑 */}
        <path d="M52 80 Q60 88 68 80" stroke="#2f4a2f" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}
