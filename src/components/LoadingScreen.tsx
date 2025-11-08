import { motion } from 'motion/react';
import { Music } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

function LoadingScreen({ message = "Loading QRate..." }: LoadingScreenProps) {
  // Generate random heights for equalizer bars
  const barCount = 8;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[#1a0a2e] to-[#16213e] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-8"
      >
        {/* Animated Sound Equalizer */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--neon-pink)]/20 to-[var(--neon-cyan)]/20 flex items-center justify-center border-2 border-[var(--neon-cyan)]/30">
            <Music className="w-12 h-12 text-[var(--neon-cyan)]" />
          </div>
          
          {/* Sound Equalizer Bars */}
          <div className="flex items-end justify-center gap-1.5 h-20 mt-6">
            {[...Array(barCount)].map((_, i) => {
              const delay = i * 0.1;
              const duration = 0.6 + Math.random() * 0.4;
              const maxHeight = 60 + Math.random() * 40; // 60-100% height
              
              return (
                <motion.div
                  key={i}
                  className={`w-2 rounded-full ${
                    i % 4 === 0 ? 'bg-[var(--neon-pink)]' :
                    i % 4 === 1 ? 'bg-[var(--neon-cyan)]' :
                    i % 4 === 2 ? 'bg-[var(--neon-purple)]' :
                    'bg-[var(--neon-yellow)]'
                  }`}
                  animate={{
                    height: [
                      '20%',
                      `${maxHeight}%`,
                      '20%',
                      `${maxHeight * 0.6}%`,
                      '20%',
                    ],
                  }}
                  transition={{
                    duration: duration,
                    repeat: Infinity,
                    delay: delay,
                    ease: 'easeInOut',
                  }}
                  style={{
                    boxShadow: `0 0 10px ${
                      i % 4 === 0 ? 'var(--neon-pink)' :
                      i % 4 === 1 ? 'var(--neon-cyan)' :
                      i % 4 === 2 ? 'var(--neon-purple)' :
                      'var(--neon-yellow)'
                    }`,
                  }}
                />
              );
            })}
          </div>
        </div>
        
        {/* Loading text */}
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold gradient-text">
            QRate
          </h2>
          <p className="text-gray-400 text-lg">{message}</p>
          
          {/* Loading dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-[var(--neon-cyan)] rounded-full"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Optimized floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 rounded-full ${
                i % 3 === 0 ? 'bg-[var(--neon-pink)]' : 
                i % 3 === 1 ? 'bg-[var(--neon-cyan)]' : 'bg-[var(--neon-purple)]'
              }`}
              style={{
                left: `${10 + (i * 15)}%`,
                top: `${20 + (i * 10)}%`,
                opacity: 0.3,
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default LoadingScreen;
