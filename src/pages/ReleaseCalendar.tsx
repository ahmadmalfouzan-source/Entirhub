import React, { useState, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isToday,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  differenceInDays
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Film, Tv, Gamepad2, Sparkles, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { fetchCalendarReleases } from '@/services/api';
import { toggleReleaseReminder, getNotifications } from '@/services/notifications';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

type MediaType = 'all' | 'movie' | 'series' | 'game';

export function ReleaseCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filter, setFilter] = useState<MediaType>('all');
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<string[]>([]);
  const { addToWatchlist, user } = useStore();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  useEffect(() => {
    if (user) {
      getNotifications(user.id).then(notifs => {
        setReminders(notifs.map(n => n.media_id));
      });
    }
  }, [user]);

  useEffect(() => {
    const loadReleases = async () => {
      setLoading(true);
      try {
        const start = format(monthStart, 'yyyy-MM-dd');
        const end = format(monthEnd, 'yyyy-MM-dd');
        const data = await fetchCalendarReleases(start, end);
        setReleases(data);
      } catch (error) {
        console.error('Failed to fetch calendar data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReleases();
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const filteredReleases = releases.filter(r => filter === 'all' || r.media_type === filter);
  
  const getReleasesByDate = (date: Date) => {
    return filteredReleases.filter(r => isSameDay(new Date(r.release_date), date));
  };

  const selectedDayReleases = getReleasesByDate(selectedDate);
  
  const mostAnticipated = [...releases]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);

  const handleToggleReminder = async (release: any) => {
    if (!user) {
      toast.error('Please sign in to set reminders');
      return;
    }
    try {
      const isAdded = await toggleReleaseReminder(user.id, release);
      if (isAdded) {
        toast.success(`We'll remind you when ${release.title} releases!`, {
          icon: '🔔'
        });
        setReminders([...reminders, release.external_id]);
      } else {
        setReminders(reminders.filter(id => id !== release.external_id));
      }
    } catch (error) {
      toast.error('Failed to set reminder');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
      <div className="p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <CalendarDays className="text-accent" />
              Release Calendar
            </h1>
            <div className="flex items-center bg-white/5 rounded-xl p-1">
              <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="px-4 font-bold min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2 p-1 bg-white/5 rounded-xl self-start overflow-x-auto no-scrollbar max-w-full">
            {(['all', 'movie', 'series', 'game'] as const).map((type) => (
              <Button
                key={type}
                variant={filter === type ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilter(type)}
                className={cn(
                  "rounded-lg transition-all capitalize",
                  filter === type && "shadow-lg shadow-blue-500/20"
                )}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dayReleases = getReleasesByDate(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isPicked = isSameDay(day, selectedDate);
              const isTodayDay = isToday(day);

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "min-h-[80px] md:min-h-[100px] p-2 flex flex-col items-center gap-2 transition-all relative border-r border-b border-white/10 last:border-r-0 hover:bg-white/5",
                    !isCurrentMonth && "opacity-20",
                    isPicked && "bg-blue-500/10"
                  )}
                >
                  <span className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold",
                    isTodayDay ? "bg-primary text-white" : "",
                    isPicked && !isTodayDay ? "border-2 border-blue-500 text-accent" : ""
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  <div className="flex flex-wrap justify-center gap-1">
                    {dayReleases.slice(0, 3).map((r, i) => (
                      <div 
                        key={i}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          r.media_type === 'movie' ? "bg-blue-500" : 
                          r.media_type === 'series' ? "bg-purple-500" : "bg-green-500"
                        )}
                      />
                    ))}
                    {dayReleases.length > 3 && (
                      <span className="text-[10px] text-gray-500">+{dayReleases.length - 3}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Panel */}
        <motion.div 
          layout
          className="bg-white/5 rounded-3xl border border-white/10 p-6 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-accent">●</span>
              Releases for {format(selectedDate, 'EEEE, MMM do')}
            </h2>
            <Badge variant="outline" className="text-gray-400">
              {selectedDayReleases.length} {selectedDayReleases.length === 1 ? 'Release' : 'Releases'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedDayReleases.length > 0 ? (
              selectedDayReleases.map((release) => (
                <ReleaseCard 
                  key={release.external_id} 
                  release={release} 
                  onAdd={() => addToWatchlist(release)}
                  onToggleNotify={() => handleToggleReminder(release)}
                  isNotified={reminders.includes(release.external_id)}
                />
              ))
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-500 space-y-2">
                <Sparkles className="w-8 h-8 opacity-20" />
                <p>No major releases scheduled for this day</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Most Anticipated */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Most Anticipated this Month
          </h2>
          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:-mx-8 md:px-8">
            {mostAnticipated.map((release) => {
              const daysTo = differenceInDays(new Date(release.release_date), new Date());
              return (
                <motion.div
                  key={release.external_id}
                  whileHover={{ y: -5 }}
                  className="min-w-[280px] md:min-w-[320px] bg-white/5 rounded-2xl border border-white/10 overflow-hidden relative group"
                >
                  <img src={release.poster_url} className="w-full h-40 object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary text-white border-0 shadow-lg">
                      {daysTo > 0 ? `In ${daysTo} days` : daysTo === 0 ? 'Today' : 'Released'}
                    </Badge>
                  </div>
                  <div className="p-4 flex gap-4">
                    <img src={release.poster_url} className="w-12 h-18 object-cover rounded shadow-lg -mt-10 relative z-10" />
                    <div className="space-y-1">
                      <h3 className="font-bold line-clamp-1">{release.title}</h3>
                      <div className="flex items-center gap-2">
                        {release.media_type === 'movie' ? <Film className="w-3 h-3 text-accent" /> : 
                         release.media_type === 'series' ? <Tv className="w-3 h-3 text-purple-400" /> : 
                         <Gamepad2 className="w-3 h-3 text-green-400" />}
                        <span className="text-xs text-gray-400 capitalize">{release.media_type}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function ReleaseCard({ 
  release, 
  onAdd, 
  onToggleNotify, 
  isNotified 
}: { 
  release: any; 
  onAdd: () => any; 
  onToggleNotify: () => any;
  isNotified: boolean;
  key?: any 
}) {
  return (
    <div className="bg-white/5 rounded-2xl p-3 flex gap-4 border border-white/10 hover:border-white/20 transition-all group relative">
      <div className="relative w-24 h-36 flex-shrink-0">
        <img src={release.poster_url} className="w-full h-full object-cover rounded-xl shadow-lg" alt="" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="icon" variant="ghost" className="rounded-full bg-primary hover:bg-blue-500 h-8 w-8" onClick={onAdd}>
            <Plus className="w-4 h-4 text-white" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className={cn(
              "rounded-full h-8 w-8 transition-all",
              isNotified ? "bg-yellow-500 hover:bg-yellow-400" : "bg-white/10 hover:bg-white/20"
            )}
            onClick={onToggleNotify}
          >
            <Bell className={cn("w-4 h-4", isNotified ? "text-black fill-black" : "text-white")} />
          </Button>
        </div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-2 h-2 rounded-full",
                release.media_type === 'movie' ? "bg-blue-500" : 
                release.media_type === 'series' ? "bg-purple-500" : "bg-green-500"
              )} />
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{release.media_type}</span>
            </div>
            <button 
              onClick={onToggleNotify}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isNotified ? "text-yellow-500 bg-yellow-500/10" : "text-gray-500 hover:text-white hover:bg-white/5"
              )}
            >
              <Bell className={cn("w-3.5 h-3.5", isNotified && "fill-current")} />
            </button>
          </div>
          <h3 className="font-bold truncate text-sm">{release.title}</h3>
          <p className="text-xs text-gray-400">
            {release.release_date ? format(new Date(release.release_date), 'MMM d, yyyy') : 'TBA'}
          </p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full h-7 text-[10px] rounded-lg border-white/10 hover:bg-white/5 mt-2"
          onClick={onAdd}
        >
          <Plus className="w-3 h-3 mr-1" /> Add to Watchlist
        </Button>
      </div>
    </div>
  );
}
