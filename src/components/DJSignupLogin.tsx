import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, Headphones, Lock, User, Mail, Eye, EyeOff, Hash, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface DJSignupLoginProps {
  onLogin: (username: string, password: string) => boolean;
  onSignup: (username: string, password: string, email: string) => boolean;
  onJoinWithCode: (eventCode: string) => void;
  onBack: () => void;
}

function DJSignupLogin({ onLogin, onSignup, onJoinWithCode, onBack }: DJSignupLoginProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'code'>('login');
  
  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Signup state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  
  // Event code state
  const [eventCode, setEventCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const success = onLogin(loginUsername, loginPassword);
    if (!success) {
      setLoginError('Invalid credentials. Please try again.');
    }
    setLoginLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters');
      return;
    }

    setSignupLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const success = onSignup(signupUsername, signupPassword, signupEmail);
    if (!success) {
      setSignupError('Username already exists');
    }
    setSignupLoading(false);
  };

  const handleJoinWithCode = async () => {
    if (eventCode.trim()) {
      setCodeLoading(true);
      await new Promise(resolve => setTimeout(resolve, 400));
      onJoinWithCode(eventCode.trim().toUpperCase());
      setCodeLoading(false);
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
        
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-purple-700/20 to-transparent rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
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
              className="glass-effect hover:bg-[var(--neon-purple)]/10 border border-[var(--glass-border)] hover:border-[var(--neon-purple)]/50 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="glass-effect border-[var(--glass-border)] hover:border-purple-500/30 transition-all duration-500">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center">
                  <Headphones className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">
                  DJ Access
                </CardTitle>
                <p className="text-purple-200/80 text-sm">
                  Create an account or join with event code
                </p>
              </CardHeader>

              <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    <TabsTrigger value="code">Event Code</TabsTrigger>
                  </TabsList>

                  {/* Login Tab */}
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-username" className="text-white flex items-center gap-2">
                          <User className="w-4 h-4 text-purple-400" />
                          Username
                        </Label>
                        <Input
                          id="login-username"
                          type="text"
                          placeholder="Enter your username"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          className="glass-effect border-purple-400/40 text-white placeholder-purple-300/60 focus:border-purple-400 focus:ring-purple-400"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-white flex items-center gap-2">
                          <Lock className="w-4 h-4 text-purple-400" />
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showLoginPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="glass-effect border-purple-400/40 text-white placeholder-purple-300/60 focus:border-purple-400 focus:ring-purple-400 pr-12"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300/60 hover:text-purple-400 transition-colors"
                          >
                            {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {loginError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 glass-effect border border-red-500/30 rounded-lg bg-red-900/20"
                        >
                          <p className="text-red-400 text-sm text-center">{loginError}</p>
                        </motion.div>
                      )}

                      <Button
                        type="submit"
                        disabled={loginLoading || !loginUsername || !loginPassword}
                        className="w-full bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-600 hover:to-purple-800 text-white py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-700/25 disabled:opacity-50"
                      >
                        {loginLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            Signing In...
                          </div>
                        ) : (
                          <>
                            <Headphones className="w-4 h-4 mr-2" />
                            Sign In as DJ
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Signup Tab */}
                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-username" className="text-white flex items-center gap-2">
                          <User className="w-4 h-4 text-purple-400" />
                          Username
                        </Label>
                        <Input
                          id="signup-username"
                          type="text"
                          placeholder="Choose a username"
                          value={signupUsername}
                          onChange={(e) => setSignupUsername(e.target.value)}
                          className="glass-effect border-purple-400/40 text-white placeholder-purple-300/60 focus:border-purple-400 focus:ring-purple-400"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-white flex items-center gap-2">
                          <Mail className="w-4 h-4 text-purple-400" />
                          Email
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@email.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="glass-effect border-purple-400/40 text-white placeholder-purple-300/60 focus:border-purple-400 focus:ring-purple-400"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-white flex items-center gap-2">
                          <Lock className="w-4 h-4 text-purple-400" />
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showSignupPassword ? "text" : "password"}
                            placeholder="Create a password"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className="glass-effect border-purple-400/40 text-white placeholder-purple-300/60 focus:border-purple-400 focus:ring-purple-400 pr-12"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300/60 hover:text-purple-400 transition-colors"
                          >
                            {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm" className="text-white flex items-center gap-2">
                          <Lock className="w-4 h-4 text-purple-400" />
                          Confirm Password
                        </Label>
                        <Input
                          id="signup-confirm"
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          className="glass-effect border-purple-400/40 text-white placeholder-purple-300/60 focus:border-purple-400 focus:ring-purple-400"
                          required
                        />
                      </div>

                      {signupError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 glass-effect border border-red-500/30 rounded-lg bg-red-900/20"
                        >
                          <p className="text-red-400 text-sm text-center">{signupError}</p>
                        </motion.div>
                      )}

                      <Button
                        type="submit"
                        disabled={signupLoading || !signupUsername || !signupEmail || !signupPassword || !signupConfirmPassword}
                        className="w-full bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-600 hover:to-purple-800 text-white py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-700/25 disabled:opacity-50"
                      >
                        {signupLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            Creating Account...
                          </div>
                        ) : (
                          <>
                            <User className="w-4 h-4 mr-2" />
                            Create DJ Account
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Event Code Tab */}
                  <TabsContent value="code">
                    <div className="space-y-4">
                      <p className="text-sm text-gray-400 text-center">
                        Join an event without creating an account using the event code
                      </p>

                      <div className="space-y-2">
                        <Label htmlFor="event-code" className="text-white flex items-center gap-2">
                          <Hash className="w-4 h-4 text-purple-400" />
                          Event Code
                        </Label>
                        <Input
                          id="event-code"
                          type="text"
                          placeholder="Enter code (e.g., ABC123)"
                          value={eventCode}
                          onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                          className="glass-effect border-purple-400/40 text-white placeholder-purple-300/60 focus:border-purple-400 focus:ring-purple-400 font-mono tracking-wider text-center"
                          onKeyDown={(e) => e.key === 'Enter' && handleJoinWithCode()}
                        />
                      </div>

                      <Button
                        onClick={handleJoinWithCode}
                        disabled={!eventCode.trim() || codeLoading}
                        className="w-full bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-600 hover:to-purple-800 text-white py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-700/25 disabled:opacity-50"
                      >
                        {codeLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            Accessing Event...
                          </div>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Access DJ Dashboard
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default DJSignupLogin;
