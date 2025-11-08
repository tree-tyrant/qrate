import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { ArrowLeft, User, Lock, Music, Eye, EyeOff, Hash, Headphones, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => boolean;
  onBack: () => void;
  onDJMode: () => void;
  onSignUp: () => void;
  onJoinEvent?: (eventCode: string) => void;
}

function LoginPage({ onLogin, onBack, onDJMode, onSignUp, onJoinEvent }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [eventCode, setEventCode] = useState('');
  const [isDJLoading, setIsDJLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const success = onLogin(username, password);
    if (!success) {
      setError('Invalid credentials. Try demo/demo or tester/tester');
    }
    setIsLoading(false);
  };

  const handleDJJoinEvent = async () => {
    if (eventCode.trim() && onJoinEvent) {
      setIsDJLoading(true);
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 400));
      onJoinEvent(eventCode.trim().toUpperCase());
      setIsDJLoading(false);
    }
  };

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

      <div className="container mx-auto px-6 relative z-10 flex items-center justify-center min-h-screen py-12">
        <div className="max-w-md w-full mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Button 
              onClick={onBack}
              className="glass-effect hover:bg-[var(--neon-cyan)]/10 border border-[var(--glass-border)] hover:border-[var(--neon-cyan)]/50 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </motion.div>

          {/* Centered Host Login */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="glass-effect border-[var(--glass-border)] hover:border-blue-400/30 transition-all duration-500 bg-gradient-to-br from-blue-900/40 via-blue-800/30 to-cyan-900/40 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-white animate-pulse-neon">
                  Host Login
                </CardTitle>
                <p className="text-blue-200/80 text-sm">
                  Sign in to create and manage your events
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Username Field */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-cyan-400" />
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="glass-effect border-blue-400/40 text-white placeholder-blue-300/60 focus:border-cyan-400 focus:ring-cyan-400 transition-all duration-300 bg-blue-800/20"
                      required
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-400" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="glass-effect border-blue-400/40 text-white placeholder-blue-300/60 focus:border-blue-400 focus:ring-blue-400 pr-12 transition-all duration-300 bg-blue-800/20"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300/60 hover:text-blue-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 glass-effect border border-red-500/30 rounded-lg bg-red-900/20"
                    >
                      <p className="text-red-400 text-sm text-center">{error}</p>
                    </motion.div>
                  )}

                  {/* Login Button */}
                  <Button
                    type="submit"
                    disabled={isLoading || !username || !password}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Signing In...
                      </div>
                    ) : (
                      <>
                        <Music className="w-4 h-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>

                {/* Alternative Actions */}
                <div className="space-y-4 pt-4 border-t border-blue-400/20">
                  <div className="text-center">
                    <span className="text-blue-200/70 text-sm">Don't have an account?</span>
                  </div>
                  
                  <Button
                    onClick={onSignUp}
                    className="w-full glass-effect border border-cyan-400/50 hover:bg-cyan-400/10 text-cyan-400 font-medium py-3 rounded-xl transition-all duration-300 bg-cyan-900/10"
                  >
                    Create Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
