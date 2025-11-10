import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function AdminPanel() {
  return (
    <div className="bg-background min-h-screen py-10">
      <div className="mx-auto px-4 max-w-4xl">
        <Card className="glass-effect border border-border/40">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Admin Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>This admin view is coming soon.</p>
            <p>Use the host dashboard to manage events while we finish building these tools.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



