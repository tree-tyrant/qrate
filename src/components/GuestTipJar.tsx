import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { PartyPopper, Check, Music, MessageSquare, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import { Tip, TipMessageType } from '../utils/types';
import { utils } from '../utils/api';

interface GuestTipJarProps {
  eventId: string;
  onBack: () => void;
}

export default function GuestTipJar({ eventId, onBack }: GuestTipJarProps) {
  const [step, setStep] = useState<'select-amount' | 'success'>('select-amount');
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [message, setMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [messageType, setMessageType] = useState<TipMessageType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const presetAmounts = [5, 10, 20];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 5) {
      setSelectedAmount(parsed);
    }
  };

  const handleSendTip = async () => {
    if (selectedAmount < 5) {
      alert('Minimum tip amount is $5.00');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Create tip object
    const tip: Tip = {
      id: `tip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount: selectedAmount,
      guestName: guestName.trim() || 'Anonymous',
      timestamp: new Date().toISOString(),
      message: message.trim() || undefined,
      messageType: message.trim() ? messageType || 'MESSAGE' : undefined,
      dismissed: false,
      addedToQueue: false,
    };

    // Parse track info from request messages
    if (messageType === 'REQUEST' && message.trim()) {
      // Simple parsing - look for song titles in quotes or after "play"
      const match = message.match(/["']([^"']+)["']|play\s+(.+?)(?:\s+by|$)/i);
      if (match) {
        tip.trackName = match[1] || match[2];
        // Mock scores for demo
        tip.crowdScore = Math.floor(Math.random() * 100);
        tip.themeMatch = Math.floor(Math.random() * 100);
      }
    }

    // Store tip in localStorage
    const existingTips = utils.storage.get(`qrate_tips_${eventId}`) || [];
    utils.storage.set(`qrate_tips_${eventId}`, [...existingTips, tip]);

    setIsProcessing(false);
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full space-y-6 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-purple)] rounded-full mx-auto flex items-center justify-center">
            <Check className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold gradient-text">Tip Sent!</h2>
            <p className="text-white/80">
              Thanks for supporting the DJ! We've passed your message along.
            </p>
          </div>

          <Card className="glass-effect border-[var(--neon-cyan)]/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Amount sent:</span>
                <span className="text-2xl font-bold text-[rgb(255,190,11)]">
                  ${selectedAmount.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 text-xs text-white/50">
                DJ receives: ${(selectedAmount * 0.85).toFixed(2)} (85%)
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={onBack}
            className="w-full h-12 qrate-gradient text-white font-semibold"
          >
            Close
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-purple)] rounded-full mx-auto flex items-center justify-center">
            <PartyPopper className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold gradient-text">Enjoying the music?</h2>
          <p className="text-white/80">
            Send a "thank you" tip to the DJ!
          </p>
          <p className="text-xs text-white/50">
            This tip goes directly to the DJ to support their work.
          </p>
        </div>

        {/* Amount Selection */}
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Select Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preset Amounts */}
            <div className="grid grid-cols-3 gap-3">
              {presetAmounts.map((amount) => (
                <Button
                  key={amount}
                  onClick={() => handleAmountSelect(amount)}
                  variant={selectedAmount === amount && !customAmount ? 'default' : 'outline'}
                  className={`h-14 text-lg font-semibold ${
                    selectedAmount === amount && !customAmount
                      ? 'qrate-gradient text-white'
                      : 'glass-effect border-white/20 text-white hover:bg-white/10'
                  }`}
                >
                  ${amount}
                </Button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <Label htmlFor="custom-amount" className="text-white/70">
                Or enter custom amount (min. $5.00)
              </Label>
              <Input
                id="custom-amount"
                type="number"
                min="5"
                step="0.01"
                placeholder="Enter amount..."
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                className="glass-effect border-white/20 text-white placeholder:text-white/40 h-12"
              />
            </div>
          </CardContent>
        </Card>

        {/* Message Type Selection */}
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-sm">Message Type (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={messageType === 'REQUEST' ? 'default' : 'outline'}
                onClick={() => setMessageType(messageType === 'REQUEST' ? null : 'REQUEST')}
                className={`flex-1 ${
                  messageType === 'REQUEST'
                    ? 'bg-[var(--neon-cyan)]/30 border-[var(--neon-cyan)] text-[var(--neon-cyan)]'
                    : 'glass-effect border-white/20 text-white/70 hover:bg-white/10'
                }`}
              >
                <Music className="w-4 h-4 mr-2" />
                Song Request
              </Button>
              <Button
                size="sm"
                variant={messageType === 'SHOUTOUT' ? 'default' : 'outline'}
                onClick={() => setMessageType(messageType === 'SHOUTOUT' ? null : 'SHOUTOUT')}
                className={`flex-1 ${
                  messageType === 'SHOUTOUT'
                    ? 'bg-[var(--neon-purple)]/30 border-[var(--neon-purple)] text-[var(--neon-purple)]'
                    : 'glass-effect border-white/20 text-white/70 hover:bg-white/10'
                }`}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Shoutout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Message Input */}
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-sm">Add Message (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Add a message, shoutout, or request..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="glass-effect border-white/20 text-white placeholder:text-white/40 min-h-[100px]"
            />
            
            {/* Guest Name */}
            <div className="space-y-2">
              <Label htmlFor="guest-name" className="text-white/70 text-xs">
                Your Name (optional)
              </Label>
              <Input
                id="guest-name"
                placeholder="Enter your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="glass-effect border-white/20 text-white placeholder:text-white/40 h-10"
              />
              <p className="text-xs text-white/50">
                No name entered will show as "Anonymous"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <p className="text-xs text-white/50 text-center px-4">
          *This is a tip, not a purchase. Any requests are not guaranteed. 15% processing fee is applied.
        </p>

        {/* Submit Button */}
        <Button
          onClick={handleSendTip}
          disabled={isProcessing || selectedAmount < 5}
          className="w-full h-14 qrate-gradient text-white font-semibold text-lg"
        >
          {isProcessing ? (
            'Processing...'
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Send ${selectedAmount.toFixed(2)} Tip
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full text-white/70 hover:text-white hover:bg-white/10"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}
