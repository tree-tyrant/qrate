import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function AdminPanel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="glass-effect border-[var(--glass-border)]">
          <CardHeader>
            <CardTitle className="text-white">Admin Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">
              Admin functionality is currently under development.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
