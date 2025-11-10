import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, Headphones, Lock, User, Mail, Eye, EyeOff, Hash, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface DJSignupLoginProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onSignup: (username: string, password: string, email: string) => Promise<boolean>;
  onJoinWithCode: (eventCode: string) => Promise<void>;
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

    const success = await onLogin(loginUsername, loginPassword);
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

    const success = await onSignup(signupUsername, signupPassword, signupEmail);
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
    <div className="relative flex justify-center items-center min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="top-10 left-10 absolute bg-[var(--neon-pink)] rounded-full w-2 h-2 animate-pulse"></div>
        <div className="top-32 right-16 absolute bg-[var(--neon-cyan)] rounded-full w-1 h-1 animate-pulse delay-700"></div>
        <div className="bottom-20 left-20 absolute bg-[var(--neon-yellow)] rounded-full w-1.5 h-1.5 animate-pulse delay-1000"></div>
        <div className="right-32 bottom-40 absolute bg-[var(--neon-purple)] rounded-full w-1 h-1 animate-pulse delay-300"></div>
        
        <div className="-top-32 -right-32 absolute bg-gradient-to-br from-purple-500/20 to-transparent blur-3xl rounded-full w-96 h-96 animate-float"></div>
        <div className="-bottom-32 -left-32 absolute bg-gradient-to-tr from-purple-700/20 to-transparent blur-3xl rounded-full w-80 h-80 animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="z-10 relative flex justify-center items-center mx-auto px-6 py-12 min-h-screen container">
        <div className="mx-auto w-full max-w-md">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Button 
              onClick={onBack}
              className="hover:bg-[var(--neon-purple)]/10 border border-[var(--glass-border)] hover:border-[var(--neon-purple)]/50 text-white glass-effect"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-[var(--glass-border)] hover:border-purple-500/30 transition-all duration-500 glass-effect">
              <CardHeader className="pb-6 text-center">
                <div className="flex justify-center items-center bg-gradient-to-br from-purple-700 to-purple-900 mx-auto mb-4 rounded-full w-16 h-16">
                  <Headphones className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-white text-2xl">
                  DJ Access
                </CardTitle>
                <p className="text-purple-200/80 text-sm">
                  Create an account or join with event code
                </p>
              </CardHeader>

              <CardContent>
                <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'login' | 'signup' | 'code')} className="w-full">
                  <TabsList className="grid grid-cols-3 mb-6 w-full">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    <TabsTrigger value="code">Event Code</TabsTrigger>
                  </TabsList>

                  {/* Login Tab */}
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-username" className="flex items-center gap-2 text-white">
                          <User className="w-4 h-4 text-purple-400" />
                          Username
                        </Label>
                        <Input
                          id="login-username"
                          type="text"
                          placeholder="Enter your username"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          className="border-purple-400/40 focus:border-purple-400 focus:ring-purple-400 text-white glass-effect placeholder-purple-300/60"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="flex items-center gap-2 text-white">
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
                            className="pr-12 border-purple-400/40 focus:border-purple-400 focus:ring-purple-400 text-white glass-effect placeholder-purple-300/60"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="top-1/2 right-3 absolute text-purple-300/60 hover:text-purple-400 transition-colors -translate-y-1/2 transform"
                          >
                            {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {loginError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-900/20 p-3 border border-red-500/30 rounded-lg glass-effect"
                        >
                          <p className="text-red-400 text-sm text-center">{loginError}</p>
                        </motion.div>
                      )}

                      <Button
                        type="submit"
                        disabled={loginLoading || !loginUsername || !loginPassword}
                        className="bg-gradient-to-r from-purple-700 hover:from-purple-600 to-purple-900 hover:to-purple-800 disabled:opacity-50 hover:shadow-lg hover:shadow-purple-700/25 py-3 rounded-xl w-full text-white transition-all duration-300"
                      >
                        {loginLoading ? (
                          <div className="flex justify-center items-center">
                            <div className="mr-2 border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin"></div>
                            Signing In...
                          </div>
                        ) : (
                          <>
                            <Headphones className="mr-2 w-4 h-4" />
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
                        <Label htmlFor="signup-username" className="flex items-center gap-2 text-white">
                          <User className="w-4 h-4 text-purple-400" />
                          Username
                        </Label>
                        <Input
                          id="signup-username"
                          type="text"
                          placeholder="Choose a username"
                          value={signupUsername}
                          onChange={(e) => setSignupUsername(e.target.value)}
                          className="border-purple-400/40 focus:border-purple-400 focus:ring-purple-400 text-white glass-effect placeholder-purple-300/60"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="flex items-center gap-2 text-white">
                          <Mail className="w-4 h-4 text-purple-400" />
                          Email
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@email.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="border-purple-400/40 focus:border-purple-400 focus:ring-purple-400 text-white glass-effect placeholder-purple-300/60"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="flex items-center gap-2 text-white">
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
                            className="pr-12 border-purple-400/40 focus:border-purple-400 focus:ring-purple-400 text-white glass-effect placeholder-purple-300/60"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                            className="top-1/2 right-3 absolute text-purple-300/60 hover:text-purple-400 transition-colors -translate-y-1/2 transform"
                          >
                            {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm" className="flex items-center gap-2 text-white">
                          <Lock className="w-4 h-4 text-purple-400" />
                          Confirm Password
                        </Label>
                        <Input
                          id="signup-confirm"
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          className="border-purple-400/40 focus:border-purple-400 focus:ring-purple-400 text-white glass-effect placeholder-purple-300/60"
                          required
                        />
                      </div>

                      {signupError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-900/20 p-3 border border-red-500/30 rounded-lg glass-effect"
                        >
                          <p className="text-red-400 text-sm text-center">{signupError}</p>
                        </motion.div>
                      )}

                      <Button
                        type="submit"
                        disabled={signupLoading || !signupUsername || !signupEmail || !signupPassword || !signupConfirmPassword}
                        className="bg-gradient-to-r from-purple-700 hover:from-purple-600 to-purple-900 hover:to-purple-800 disabled:opacity-50 hover:shadow-lg hover:shadow-purple-700/25 py-3 rounded-xl w-full text-white transition-all duration-300"
                      >
                        {signupLoading ? (
                          <div className="flex justify-center items-center">
                            <div className="mr-2 border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin"></div>
                            Creating Account...
                          </div>
                        ) : (
                          <>
                            <User className="mr-2 w-4 h-4" />
                            Create DJ Account
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Event Code Tab */}
                  <TabsContent value="code">
                    <div className="space-y-4">
                      <p className="text-gray-400 text-sm text-center">
                        Join an event without creating an account using the event code
                      </p>

                      <div className="space-y-2">
                        <Label htmlFor="event-code" className="flex items-center gap-2 text-white">
                          <Hash className="w-4 h-4 text-purple-400" />
                          Event Code
                        </Label>
                        <Input
                          id="event-code"
                          type="text"
                          placeholder="Enter code (e.g., ABC123)"
                          value={eventCode}
                          onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                          className="border-purple-400/40 focus:border-purple-400 focus:ring-purple-400 font-mono text-white text-center tracking-wider glass-effect placeholder-purple-300/60"
                          onKeyDown={(e) => e.key === 'Enter' && handleJoinWithCode()}
                        />
                      </div>

                      <Button
                        onClick={handleJoinWithCode}
                        disabled={!eventCode.trim() || codeLoading}
                        className="bg-gradient-to-r from-purple-700 hover:from-purple-600 to-purple-900 hover:to-purple-800 disabled:opacity-50 hover:shadow-lg hover:shadow-purple-700/25 py-3 rounded-xl w-full text-white transition-all duration-300"
                      >
                        {codeLoading ? (
                          <div className="flex justify-center items-center">
                            <div className="mr-2 border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin"></div>
                            Accessing Event...
                          </div>
                        ) : (
                          <>
                            <Zap className="mr-2 w-4 h-4" />
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
