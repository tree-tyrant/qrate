import { memo } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface ComponentLoaderProps {
  componentName?: string;
}

export const ComponentLoader = memo(({ componentName }: ComponentLoaderProps) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--background)] via-[#1a0a2e] to-[#16213e] relative overflow-hidden">
    {/* Animated background particles */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-1.5 h-1.5 rounded-full ${
            i % 4 === 0 ? 'bg-[var(--neon-pink)]' :
            i % 4 === 1 ? 'bg-[var(--neon-cyan)]' :
            i % 4 === 2 ? 'bg-[var(--neon-purple)]' :
            'bg-[var(--neon-yellow)]'
          }`}
          style={{
            left: `${15 + (i * 12)}%`,
            top: `${20 + (i * 8)}%`,
            opacity: 0.2,
          }}
          animate={{
            y: [-30, 30, -30],
            x: [-20, 20, -20],
            opacity: [0.1, 0.4, 0.1],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>

    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative z-10"
    >
      <div className="glass-effect p-10 rounded-2xl border border-[var(--glass-border)] backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Glowing background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-purple)]/10 via-transparent to-[var(--neon-cyan)]/10 pointer-events-none" />
        
        <div className="flex flex-col items-center gap-6 relative z-10">
          {/* Enhanced spinner container */}
          <div className="relative">
            {/* Outer rotating ring */}
            <motion.div
              className="w-20 h-20 rounded-full border-4 border-transparent"
              style={{
                borderTopColor: 'var(--neon-purple)',
                borderRightColor: 'var(--neon-cyan)',
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            
            {/* Inner counter-rotating ring */}
            <motion.div
              className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent"
              style={{
                borderBottomColor: 'var(--neon-pink)',
                borderLeftColor: 'var(--neon-yellow)',
              }}
              animate={{ rotate: -360 }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Loader2 className="w-8 h-8 text-[var(--neon-cyan)]" />
              </motion.div>
            </div>
            
            {/* Pulsing glow effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-[var(--neon-cyan)]/20 blur-xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>

          {/* Text content */}
          <div className="text-center space-y-2">
            <motion.h3
              className="text-xl font-bold mb-2 bg-gradient-to-r from-[var(--neon-purple)] via-[var(--neon-cyan)] to-[var(--neon-pink)] bg-clip-text text-transparent"
              animate={{
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              Loading {componentName || 'Component'}
            </motion.h3>
            <motion.p
              className="text-muted-foreground text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Preparing your experience...
            </motion.p>
            
            {/* Animated dots */}
            <div className="flex justify-center gap-2 mt-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-[var(--neon-cyan)] rounded-full"
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
));

ComponentLoader.displayName = 'ComponentLoader';
