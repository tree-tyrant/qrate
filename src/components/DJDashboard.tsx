// Refactored DJ Dashboard Component
// This is the main orchestrator that uses custom hooks and sub-components
// The original 2000+ line file has been broken down for better maintainability

import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Skeleton } from './ui/skeleton';
import { toast } from 'sonner';
import {
  CalendarDays,
  DollarSign,
  Edit3,
  Image,
  Layers3,
  Sparkles,
  Star,
  Users,
  Upload,
  Plus
} from 'lucide-react';
import { useDJMarketplace, buildUpdatedPackages } from '@/hooks/useDJMarketplace';
import type { DJPricePackage } from '@/utils/types';

interface DJDashboardProps {
  djId: string | null;
}

type EditorMode =
  | { type: 'bio'; draft: string }
  | { type: 'availability'; draft: string }
  | { type: 'package'; draft: DJPricePackage }
  | null;

const createId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pkg_${Date.now()}`);

export default function DJDashboard({ djId }: DJDashboardProps) {
  const resolvedDjId = djId ?? 'demo-dj';
  const {
    loading,
    saving,
    profile,
    vibeSegments,
    engagementMetrics,
    earnings,
    bookingRequests,
    profileNeedsAttention,
    refresh,
    updateProfile
  } = useDJMarketplace(resolvedDjId);

  const [editor, setEditor] = useState<EditorMode>(null);

  useEffect(() => {
    if (!loading && profileNeedsAttention && !editor) {
      setEditor({ type: 'bio', draft: profile?.bio ?? '' });
    }
  }, [loading, profileNeedsAttention, profile?.bio, editor]);

  const mediaItems = profile?.media ?? [];
  const pricePackages = profile?.pricePackages ?? [];

  const handleOpenBioEditor = () => setEditor({ type: 'bio', draft: profile?.bio ?? '' });
  const handleOpenAvailabilityEditor = () => setEditor({ type: 'availability', draft: profile?.availabilityWindow ?? '' });
  const handleOpenPackageEditor = (pkg?: DJPricePackage) => {
    const target = pkg ?? {
      id: createId(),
      name: '',
      priceRange: '',
      description: '',
      isFeatured: false
    };
    setEditor({ type: 'package', draft: target });
  };

  const closeEditor = () => {
    if (!saving) setEditor(null);
  };

  const handleBioSave = async () => {
    if (!editor || editor.type !== 'bio' || !profile) return;
    await updateProfile({ id: profile.id, bio: editor.draft });
    setEditor(null);
  };

  const handleAvailabilitySave = async () => {
    if (!editor || editor.type !== 'availability' || !profile) return;
    await updateProfile({ id: profile.id, availabilityWindow: editor.draft });
    setEditor(null);
  };

  const handlePackageSave = async () => {
    if (!editor || editor.type !== 'package' || !profile) return;
    if (!editor.draft.name || !editor.draft.priceRange) {
      toast.error('Package name and price range are required');
      return;
    }
    const nextPackages = buildUpdatedPackages(pricePackages, editor.draft);
    await updateProfile({ id: profile.id, pricePackages: nextPackages });
    setEditor(null);
  };

  const handlePackageDelete = async (pkgId: string) => {
    if (!profile) return;
    const nextPackages = pricePackages.filter(pkg => pkg.id !== pkgId);
    await updateProfile({ id: profile.id, pricePackages: nextPackages });
  };

  const handleMockMediaUpload = () => {
    toast.info('Media uploads coming soon. For now, add media via the QRate team.');
  };

  const vibeSegmentsWithFallback = useMemo(() => {
    if (vibeSegments.length > 0) return vibeSegments;
    return [
      { label: 'Modern Pop', percent: 42 },
      { label: '90s Hip-Hop', percent: 28 },
      { label: 'House + EDM', percent: 18 },
      { label: 'Afrobeats', percent: 12 }
    ];
  }, [vibeSegments]);

  const metricsWithFallback = useMemo(() => {
    if (engagementMetrics.length > 0) return engagementMetrics;
    return [
      { name: 'Avg. Guest Connection', value: '65%', context: 'Guests who connect to your event' },
      { name: 'Avg. Tip Volume', value: '90th percentile', context: 'Compared to DJs in your region' },
      { name: 'Playlist Vibe-Check', value: '4.7 / 5', context: 'Average rating on published playlists' }
    ];
  }, [engagementMetrics]);

  const bookingRequestsWithFallback = useMemo(() => {
    if (bookingRequests.length > 0) return bookingRequests;
    return [
      { id: 'REQ-2031', title: 'Alpha Chi Mixer', date: 'Mar 22', location: 'Emory University', budget: '$750', status: 'New' },
      { id: 'REQ-2027', title: 'Corporate Spring Social', date: 'Mar 18', location: 'Ponce City Market', budget: '$1.2k', status: 'Reviewing' },
      { id: 'REQ-1998', title: 'Sunset Rooftop Soirée', date: 'Apr 5', location: 'Midtown Atlanta', budget: '$900', status: 'New' }
    ];
  }, [bookingRequests]);

  return (
    <div className="flex flex-col gap-8 mx-auto px-6 py-10 max-w-6xl">
      <header className="space-y-6">
        <div className="flex flex-wrap justify-between items-start gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="border border-primary/40 w-16 h-16">
              <AvatarFallback className="bg-primary/20 text-primary">
                {profile?.displayName?.slice(0, 2).toUpperCase() ?? 'DJ'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-semibold text-white text-3xl tracking-tight">
                  {profile?.displayName ?? 'Your QRate Marketplace Profile'}
                </h1>
                {profileNeedsAttention && (
                  <Badge variant="outline" className="border-yellow-400/60 text-yellow-200">Finish setup</Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                Hosts see the story behind your sound. Keep this space sharp to stand out in the feed.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant="outline" className="border-primary/40 text-primary">Overall QRate Score {earnings ? '—' : '4.8'}</Badge>
                <Badge variant="outline" className="border-purple-400/50 text-purple-200">Top 5% Engagement</Badge>
                <Badge variant="outline" className="border-cyan-400/50 text-cyan-200">
                  {profile?.location ?? 'Set your location'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleOpenAvailabilityEditor} className="border border-border/40">
              <CalendarDays className="mr-2 w-4 h-4" /> Manage Availability
            </Button>
            <Button onClick={handleOpenBioEditor} className="bg-primary/80 hover:bg-primary">
              <Edit3 className="mr-2 w-4 h-4" /> Edit Profile
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center text-muted-foreground text-xs">
          <span>
            QRate Marketplace ID · {resolvedDjId}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={refresh}>Refresh</Button>
            {saving && <span className="text-primary">Saving…</span>}
          </div>
        </div>
        {profileNeedsAttention && (
          <Alert variant="default" className="bg-yellow-500/10 border-yellow-400/40">
            <AlertTitle className="flex items-center gap-2 text-yellow-100 text-sm">
              Complete your profile to unlock the marketplace
            </AlertTitle>
            <AlertDescription className="text-yellow-100/80 text-xs">
              Upload at least one highlight, add pricing, and share your story so hosts know why you’re the perfect fit.
            </AlertDescription>
          </Alert>
        )}
      </header>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-2 bg-muted/30">
          <TabsTrigger value="profile">My Marketplace Profile</TabsTrigger>
          <TabsTrigger value="gigs">Gig Management</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="gap-6 grid lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Showcase The Proof</CardTitle>
                <CardDescription>
                  Upload visuals, dial in your story, and curate the highlights you want every host to see first.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">Media Library</h3>
                    <Button size="sm" variant="outline" onClick={handleMockMediaUpload}>
                      <Upload className="mr-2 w-4 h-4" /> Upload Photos/Videos
                    </Button>
                  </div>
                  <div className="gap-3 grid md:grid-cols-3">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="rounded-xl aspect-video" />)
                    ) : mediaItems.length > 0 ? (
                      mediaItems.map(item => (
                        <div key={item.id} className="relative border border-border/40 rounded-xl aspect-video overflow-hidden">
                          <img src={item.thumbnailUrl ?? item.url} alt={item.description ?? 'DJ media'} className="w-full h-full object-cover" />
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-center items-center bg-muted/30 border border-border/50 border-dashed rounded-xl aspect-video text-muted-foreground text-sm">
                        Drop highlight assets to build trust instantly.
                      </div>
                    )}
                  </div>
                </section>

                <Separator />

                <section className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">Bio & Story</h3>
                      <p className="text-muted-foreground text-sm">Keep it tight. Hosts are scanning for confidence, specialty, and vibe.</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-primary hover:text-primary" onClick={handleOpenBioEditor}>
                      <Edit3 className="mr-2 w-4 h-4" /> Edit Bio
                    </Button>
                  </div>
                  <Card className="bg-muted/20 border-border/40">
                    <CardContent className="pt-6 text-muted-foreground text-sm leading-relaxed">
                      {loading ? <Skeleton className="h-20" /> : profile?.bio ?? 'Tell hosts what sets you apart, your signature moments, and what crowds you crush.'}
                    </CardContent>
                  </Card>
                </section>

                <Separator />

                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">Packages & Price Ranges</h3>
                    <Button size="sm" variant="outline" onClick={() => handleOpenPackageEditor()}><DollarSign className="mr-2 w-4 h-4" /> Add Package</Button>
                  </div>
                  <div className="gap-4 grid md:grid-cols-2">
                    {loading ? (
                      Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="rounded-xl h-36" />)
                    ) : pricePackages.length > 0 ? (
                      pricePackages.map(pkg => (
                        <Card key={pkg.id} className={`border-border/40 ${pkg.isFeatured ? 'border-primary/50' : ''}`}>
                          <CardHeader className="pb-2">
                            <CardTitle className="flex justify-between items-center text-white text-base">
                              {pkg.name}
                              <Button size="icon" variant="ghost" onClick={() => handleOpenPackageEditor(pkg)}>
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            </CardTitle>
                            <CardDescription>{pkg.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="flex justify-between items-center pt-0 font-medium text-primary text-sm">
                            <span>{pkg.priceRange}</span>
                            <Button variant="ghost" size="icon" onClick={() => handlePackageDelete(pkg.id)}>
                              <span className="text-muted-foreground text-xs">×</span>
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="bg-muted/10 p-4 border border-border/40 rounded-lg text-muted-foreground text-sm">
                        No packages yet. Add at least one so hosts can see your price range.
                      </div>
                    )}
                  </div>
                </section>
              </CardContent>
            </Card>

            <Card className="space-y-4">
              <CardHeader>
                <CardTitle>Dynamic QRate Data</CardTitle>
                <CardDescription>Automatically updated after every gig. Hosts trust this—they know you can’t fake it.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="bg-primary/5 p-4 border border-primary/20 rounded-xl text-center">
                  <p className="text-muted-foreground text-sm">Overall QRate Score</p>
                  <p className="mt-1 font-semibold text-primary text-3xl">94</p>
                  <p className="text-muted-foreground text-xs">Consistently above-market performance</p>
                </div>

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-300" />
                    <h4 className="font-medium text-white text-sm">Vibe Specialization</h4>
                  </div>
                  <div className="space-y-2">
                    {vibeSegmentsWithFallback.map(segment => (
                      <div key={segment.label}>
                        <div className="flex justify-between text-muted-foreground text-xs">
                          <span>{segment.label}</span>
                          <span>{segment.percent}%</span>
                        </div>
                        <div className="relative bg-muted rounded-full h-2">
                          <div className="left-0 absolute inset-y-0 bg-purple-500 rounded-full" style={{ width: `${segment.percent}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  {metricsWithFallback.map(metric => (
                    <div key={metric.name} className="bg-muted/10 p-3 border border-border/40 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-muted-foreground text-xs uppercase tracking-wide">{metric.name}</p>
                          <p className="mt-1 font-semibold text-white text-lg">{metric.value}</p>
                        </div>
                        {metric.context && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="text-muted-foreground hover:text-primary text-xs">Why it matters</TooltipTrigger>
                              <TooltipContent>{metric.context}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  ))}
                </section>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Featured QRate Events</CardTitle>
              <CardDescription>Select the gigs you want front-and-center. Data stays authentic—only the story is yours to narrate.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-4">
                  {(profile?.metadata?.featuredEvents as string[] | undefined)?.map((eventTitle, index) => (
                    <div key={`${eventTitle}-${index}`} className="flex justify-between items-center bg-muted/10 px-4 py-3 border border-border/40 rounded-lg">
                      <div>
                        <p className="font-medium text-white text-sm">{eventTitle}</p>
                        <p className="text-muted-foreground text-xs">Playlist Vibe-Check 4.8 · Tip Volume 92nd percentile</p>
                      </div>
                      <Button size="sm" variant="outline">Feature</Button>
                    </div>
                  )) || (
                    <div className="bg-muted/10 px-4 py-3 border border-border/40 rounded-lg text-muted-foreground text-sm">
                      Highlight a few events that capture your crowd-control superpowers.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gigs" className="space-y-6">
          <div className="gap-6 grid md:grid-cols-[2fr,1fr]">
            <Card>
              <CardHeader className="flex flex-row justify-between items-start">
                <div>
                  <CardTitle>Booking Requests</CardTitle>
                  <CardDescription>Review vibe matches, confirm availability, and respond with confidence.</CardDescription>
                </div>
                <Button size="sm" className="bg-primary/80 hover:bg-primary" onClick={() => toast.info('Publishing new offerings coming soon')}>
                  <Layers3 className="mr-2 w-4 h-4" /> Publish New Offering
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="rounded-xl h-24" />)
                ) : (
                  bookingRequestsWithFallback.map(request => (
                    <div key={request.id} className="bg-muted/10 px-4 py-3 border border-border/40 rounded-lg">
                      <div className="flex flex-wrap justify-between items-center gap-4">
                        <div>
                          <p className="font-medium text-white text-sm">{request.title}</p>
                          <p className="text-muted-foreground text-xs">{request.date} · {request.location}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="border-cyan-400/50 text-cyan-200 text-xs">{request.status}</Badge>
                          <span className="font-semibold text-primary text-sm">{request.budget}</span>
                          <Button size="sm" variant="outline" onClick={() => toast.info('Booking detail view coming soon')}>Review</Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Calendar Snapshot</CardTitle>
                  <CardDescription>Pending + confirmed QRate gigs synced across your channels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground text-sm">
                  {profile?.metadata?.calendarPreview ? (
                    (profile.metadata.calendarPreview as string[]).map((entry, index) => <p key={index}>• {entry}</p>)
                  ) : (
                    <>
                      <p>• Mar 12 · Campus Glow Night · Confirmed</p>
                      <p>• Mar 18 · Corporate Spring Social · Awaiting response</p>
                      <p>• Mar 22 · Alpha Chi Mixer · Pending deposit</p>
                    </>
                  )}
                  <Button size="sm" variant="ghost" className="pl-0 text-primary hover:text-primary" onClick={handleOpenAvailabilityEditor}>
                    View full calendar
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Earnings Dashboard</CardTitle>
                  <CardDescription>Automated payouts and tip tracking from QRate events.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lifetime Earnings</span>
                    <span className="font-semibold text-white">{earnings?.lifetime ?? '$18.4k'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Upcoming Gigs</span>
                    <span className="font-semibold text-white">{earnings?.upcoming ?? '$2.1k'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tips Collected</span>
                    <span className="font-semibold text-white">{earnings?.tips ?? '$3.6k'}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Pending Payout</span>
                    <span className="font-medium text-primary">{earnings?.pendingPayout ?? '$680'}</span>
                  </div>
                  <Button size="sm" className="bg-primary/80 hover:bg-primary w-full" onClick={() => toast.info('Detailed payout schedule coming soon')}>
                    View payout schedule
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Grow Your Marketplace Presence</CardTitle>
            </CardHeader>
            <CardContent className="gap-4 grid md:grid-cols-3">
              {[
                { icon: <Star className="w-4 h-4" />, title: 'Collect fresh reviews', description: 'Request host testimonials after each event to increase trust fast.' },
                { icon: <Users className="w-4 h-4" />, title: 'Target new audiences', description: 'Highlight events with specific demographics to surface in vibe filters.' },
                { icon: <DollarSign className="w-4 h-4" />, title: 'Bundle smart add-ons', description: 'Offer lighting, MC services, or custom playlists as upsells.' }
              ].map(item => (
                <div key={item.title} className="bg-muted/10 p-4 border border-border/40 rounded-lg text-muted-foreground text-sm">
                  <div className="flex items-center gap-2 text-white">
                    <span className="flex justify-center items-center bg-primary/10 p-2 rounded-full text-primary">{item.icon}</span>
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <p className="mt-2 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(editor)} onOpenChange={(open: any) => (!open ? closeEditor() : undefined)}>
        {editor?.type === 'bio' && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Update your story</DialogTitle>
              <DialogDescription>Share how you energize crowds and what sets your mixes apart.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={editor.draft}
                minLength={40}
                rows={6}
                onChange={(e) => setEditor({ type: 'bio', draft: e.target.value })}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={closeEditor} disabled={saving}>Cancel</Button>
                <Button onClick={handleBioSave} disabled={saving || editor.draft.trim().length < 40}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}

        {editor?.type === 'availability' && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Set your availability</DialogTitle>
              <DialogDescription>Let hosts know when you’re open for bookings.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={editor.draft}
                placeholder="e.g., Accepting bookings Apr - Sep 2025"
                onChange={(e) => setEditor({ type: 'availability', draft: e.target.value })}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={closeEditor} disabled={saving}>Cancel</Button>
                <Button onClick={handleAvailabilitySave} disabled={saving || !editor.draft.trim()}>
                  {saving ? 'Saving…' : 'Save availability'}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}

        {editor?.type === 'package' && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{pricePackages.some(pkg => pkg.id === editor.draft.id) ? 'Edit package' : 'Add package'}</DialogTitle>
              <DialogDescription>Pricing transparency builds trust and accelerates bookings.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="package-name">Package name</Label>
                <Input
                  id="package-name"
                  value={editor.draft.name}
                  onChange={(e) => setEditor({ type: 'package', draft: { ...editor.draft, name: e.target.value } })}
                  placeholder="Signature Social"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-price">Price range</Label>
                <Input
                  id="package-price"
                  value={editor.draft.priceRange}
                  onChange={(e) => setEditor({ type: 'package', draft: { ...editor.draft, priceRange: e.target.value } })}
                  placeholder="$600 - $850"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-desc">Description</Label>
                <Textarea
                  id="package-desc"
                  rows={3}
                  value={editor.draft.description ?? ''}
                  onChange={(e) => setEditor({ type: 'package', draft: { ...editor.draft, description: e.target.value } })}
                  placeholder="3 hours · Standard sound · Custom playlist prep"
                />
              </div>
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2 text-muted-foreground text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(editor.draft.isFeatured)}
                    onChange={(e) => setEditor({ type: 'package', draft: { ...editor.draft, isFeatured: e.target.checked } })}
                  />
                  Feature this package in your profile
                </Label>
                <Button variant="ghost" size="sm" onClick={() => setEditor({ type: 'package', draft: { ...editor.draft, id: createId() } })}>
                  <Plus className="mr-1 w-4 h-4" /> Duplicate
                </Button>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={closeEditor} disabled={saving}>Cancel</Button>
                <Button onClick={handlePackageSave} disabled={saving || !editor.draft.name.trim() || !editor.draft.priceRange.trim()}>
                  {saving ? 'Saving…' : 'Save package'}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
