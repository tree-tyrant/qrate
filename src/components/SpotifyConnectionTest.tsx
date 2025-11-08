import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft } from 'lucide-react';

interface SpotifyConnectionTestProps {
  onBack: () => void;
}

export default function SpotifyConnectionTest({ onBack }: SpotifyConnectionTestProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 text-white hover:text-[var(--neon-cyan)]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="glass-effect border-[var(--glass-border)]">
          <CardHeader>
            <CardTitle className="text-white">Spotify Connection Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">
              Spotify integration is managed through the guest flow and DJ dashboard.
              This test page is for debugging purposes only.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
