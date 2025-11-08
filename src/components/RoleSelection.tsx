import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Users, Headphones, Music, Sparkles, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import MercuryTitle from './MercuryTitle';

interface RoleSelectionProps {
  onSelectHost: () => void;
  onSelectDJ: () => void;
  onSelectGuest: () => void;
  onBack: () => void;
}

function RoleSelection({ onSelectHost, onSelectDJ, onSelectGuest, onBack }: RoleSelectionProps) {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-2 h-2 bg-[var(--neon-pink)] rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-16 w-1 h-1 bg-[var(--neon-cyan)] rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-[var(--neon-yellow)] rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 right-32 w-1 h-1 bg-[var(--neon-purple)] rounded-full animate-pulse delay-300"></div>
        
        {/* Large gradient orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-[var(--neon-purple)]/20 to-transparent rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-[var(--neon-cyan)]/20 to-transparent rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Button 
            onClick={onBack}
            className="glass-effect hover:bg-[var(--neon-cyan)]/10 border border-[var(--glass-border)] hover:border-[var(--neon-cyan)]/50 text-white mt-[90px] mr-[0px] mb-[0px] ml-[0px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <MercuryTitle text="QRate" className="mb-4" />
          <h2 className="text-2xl md:text-3xl text-white mb-4">Choose Your Role</h2>
          <p className="text-gray-300 max-w-xl mx-auto">
            Select how you want to experience QRate
          </p>
        </motion.div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Host Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card 
              className="glass-effect border-[var(--glass-border)] hover:border-blue-400/50 transition-all duration-300 group cursor-pointer h-full"
              onClick={onSelectHost}
            >
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Music className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl text-white mb-3">Host</h3>
                <p className="text-gray-300 mb-6">
                  Create and manage events for your parties, clubs, or gatherings
                </p>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white">
                  I'm a Host
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* DJ Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card 
              className="glass-effect border-[var(--glass-border)] hover:border-purple-500/50 transition-all duration-300 group cursor-pointer h-full"
              onClick={onSelectDJ}
            >
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Headphones className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl text-white mb-3">DJ</h3>
                <p className="text-gray-300 mb-6">
                  Access the DJ dashboard and get AI-powered track recommendations
                </p>
                <Button className="w-full bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-600 hover:to-purple-800 text-white">
                  I'm a DJ
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Guest Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card 
              className="glass-effect border-[var(--glass-border)] hover:border-[var(--neon-pink)]/50 transition-all duration-300 group cursor-pointer h-full"
              onClick={onSelectGuest}
            >
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--neon-pink)] to-[var(--neon-purple)] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl text-white mb-3">Guest</h3>
                <p className="text-gray-300 mb-6">
                  Join an event and share your music preferences with the crowd
                </p>
                <Button className="w-full bg-gradient-to-r from-[var(--neon-pink)] to-[var(--neon-purple)] hover:opacity-90 text-white">
                  I'm a Guest
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Helper Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full mt-[0px] mr-[0px] mb-[60px] ml-[0px]">
            <Sparkles className="w-4 h-4 text-[var(--neon-cyan)] animate-pulse" />
            <span className="text-sm text-gray-400">
              New to QRate? Choose based on your event role
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default RoleSelection;
