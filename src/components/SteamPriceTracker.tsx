import { useEffect, useState } from 'react';
import { getSteamAppId, getSteamPrice, getSteamHistoricalLow, createPriceAlert, getPriceAlert, deletePriceAlert, SteamPriceData, SteamLowRecord } from '@/services/steamService';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { ExternalLink, Tag, Loader2, Bell, AlertCircle, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface SteamPriceTrackerProps {
  gameName: string;
}

export function SteamPriceTracker({ gameName }: SteamPriceTrackerProps) {
  const [loading, setLoading] = useState(true);
  const [appid, setAppId] = useState<number | null>(null);
  const [priceSA, setPriceSA] = useState<SteamPriceData | null | 'free'>(null);
  const [priceUS, setPriceUS] = useState<SteamPriceData | null | 'free'>(null);
  const [historicalLow, setHistoricalLow] = useState<SteamLowRecord | null>(null);
  
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [isSettingAlert, setIsSettingAlert] = useState(false);
  const [isAlertLoading, setIsAlertLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('[SteamPrice] Starting fetch for:', gameName);
        const id = await getSteamAppId(gameName);
        console.log('[SteamPrice] AppID result:', id, 'for game:', gameName);
        if (!id) {
          console.log('[SteamPrice] No AppID found, skipping price fetch');
          setLoading(false);
          return;
        }
        
        setAppId(id);
        console.log('[SteamPrice] Triggering price fetches for ID:', id);
          const [sa, us, low, { data: { user } }] = await Promise.all([
            getSteamPrice(id, 'SA'),
            getSteamPrice(id, 'US'),
            getSteamHistoricalLow(id),
            supabase.auth.getUser()
          ]);
          setPriceSA(sa);
          setPriceUS(us);
          setHistoricalLow(low);

          if (user) {
            const alert = await getPriceAlert(user.id, id);
            setActiveAlert(alert);
          }
      } catch (err) {
        console.error('[SteamPrice] Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gameName]);

  const handleToggleAlert = async () => {
    if (activeAlert) {
      setIsAlertLoading(true);
      try {
        await deletePriceAlert(activeAlert.id);
        setActiveAlert(null);
        toast.success('Price alert removed');
      } catch (err: any) {
        toast.error('Failed to remove alert');
      } finally {
        setIsAlertLoading(false);
      }
      return;
    }
    setIsSettingAlert(!isSettingAlert);
  };

  const handleSetAlert = async () => {
    if (!targetPrice || isNaN(parseFloat(targetPrice))) {
      toast.error('Please enter a valid target price');
      return;
    }

    setIsAlertLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to set price alerts');
        return;
      }

      if (!appid) return;

      const currentFinal = priceSA && priceSA !== 'free' ? priceSA.final / 100 : 0;

      await createPriceAlert({
        userId: user.id,
        gameName,
        steamAppId: appid,
        targetPrice: parseFloat(targetPrice),
        currentPrice: currentFinal
      });

      const freshAlert = await getPriceAlert(user.id, appid);
      setActiveAlert(freshAlert);
      toast.success(`We'll notify you when price drops below SAR ${targetPrice}`);
      setIsSettingAlert(false);
      setTargetPrice('');
    } catch (err: any) {
      console.error('[SteamPrice] Alert creation failed:', err);
      toast.error(err.message || 'Failed to set alert');
    } finally {
      setIsAlertLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-4 bg-white/5 rounded-xl border border-white/5">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Fetching Steam prices...</span>
      </div>
    );
  }

  if (!appid || (!priceSA && !priceUS)) return null;

  const isAtHistoricalLow = historicalLow && priceSA && priceSA !== 'free' && (priceSA.final / 100) <= historicalLow.amount;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border bg-white/5 flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          Price & Store
        </h3>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">Steam Store</Badge>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Saudi Arabia Price */}
          <div className="space-y-1.5 flex flex-col justify-between">
            <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <span>🇸🇦</span> Saudi Arabia
            </div>
            <div className="flex flex-col">
              {priceSA === 'free' ? (
                <span className="text-lg font-bold text-green-500">Free to Play</span>
              ) : priceSA ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xl font-bold",
                      isAtHistoricalLow ? "text-green-500" : "text-foreground"
                    )}>
                      {priceSA.final_formatted}
                    </span>
                    {priceSA.discount_percent > 0 && (
                      <Badge className="bg-green-600 hover:bg-green-600 text-[10px] h-5 px-1.5">
                        -{priceSA.discount_percent}%
                      </Badge>
                    )}
                  </div>
                  {priceSA.discount_percent > 0 && (
                    <span className="text-xs text-muted-foreground line-through decoration-red-500/50">
                      {priceSA.initial_formatted}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground text-sm italic">Not available</span>
              )}
            </div>
          </div>

          {/* US Price */}
          <div className="space-y-1.5 border-l border-border pl-4">
            <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <span>🇺🇸</span> United States
            </div>
            <div className="flex flex-col">
              {priceUS === 'free' ? (
                <span className="text-lg font-bold text-green-500">Free</span>
              ) : priceUS ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-foreground">{priceUS.final_formatted}</span>
                    {priceUS.discount_percent > 0 && (
                      <Badge className="bg-green-600 hover:bg-green-600 text-[10px] h-5 px-1.5">
                        -{priceUS.discount_percent}%
                      </Badge>
                    )}
                  </div>
                  {priceUS.discount_percent > 0 && (
                    <span className="text-xs text-muted-foreground line-through decoration-red-500/50">
                      {priceUS.initial_formatted}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground text-sm italic">Not available</span>
              )}
            </div>
          </div>
        </div>

        {historicalLow && (
          <div className={cn(
            "text-xs p-2 rounded-lg border flex items-center gap-2",
            isAtHistoricalLow 
              ? "bg-green-500/10 border-green-500/20 text-green-500" 
              : "bg-white/5 border-white/5 text-muted-foreground"
          )}>
            <AlertCircle className="w-3.5 h-3.5" />
            Historical Low: <span className={cn("font-medium", isAtHistoricalLow ? "text-green-500" : "text-foreground")}>{historicalLow.formatted}</span>
            {isAtHistoricalLow && <Badge variant="outline" className="ml-auto text-[8px] bg-green-500/20 text-green-500 border-green-500/50 h-4 uppercase translate-y-[1px]">Best Deal</Badge>}
          </div>
        )}

        <div className="flex gap-2">
          <a 
            href={`https://store.steampowered.com/app/${appid}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className={cn(buttonVariants({ className: "flex-1 bg-[#1b2838] hover:bg-[#2a3f5a] text-white border-0" }))}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Steam
          </a>
          
          <Button 
            variant="outline" 
            size="icon"
            className={cn(
              "shrink-0 transition-all",
              activeAlert ? "border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20" : "",
              isSettingAlert ? "border-primary bg-primary/10" : ""
            )}
            onClick={handleToggleAlert}
            disabled={isAlertLoading}
          >
            {isAlertLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <Bell className={cn(
                "w-4 h-4 transition-colors", 
                activeAlert ? "fill-yellow-500 text-yellow-500" : "",
                isSettingAlert ? "text-primary" : ""
              )} />
            )}
          </Button>
        </div>

        {isSettingAlert && (
          <div className="pt-2 animate-in slide-in-from-top-2">
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Notify me when price drops below: SAR</label>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="e.g. 50"
                    className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button 
                    size="sm" 
                    className="h-8 shrink-0"
                    onClick={handleSetAlert}
                    disabled={isAlertLoading}
                  >
                    {isAlertLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                    Set Alert
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight italic">
                Current: {priceSA && priceSA !== 'free' ? priceSA.final_formatted : 'Free'}
              </p>
            </div>
          </div>
        )}

        {activeAlert && !isSettingAlert && (
          <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-2.5 flex items-center justify-between group">
            <div className="flex flex-col">
              <span className="text-[10px] text-yellow-500/80 font-bold uppercase tracking-wider">Active Alert</span>
              <span className="text-xs text-foreground font-medium">Target: SAR {activeAlert.target_price}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
              onClick={handleToggleAlert}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
