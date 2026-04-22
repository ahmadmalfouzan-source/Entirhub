import React from 'react';
import { 
  SectionHeader, 
  AchievementCard, 
  PremiumButton,
  StatWidget
} from '@/components/premium';
import { Trophy, Award, Target, Star, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export function Achievements() {
  const navigate = useNavigate();

  // Mock data for system demonstration - in a real app these come from useStore/supabase
  const achievementGroups = [
    {
      title: "Content Explorer",
      items: [
        { title: "First Blood", description: "Add your first movie to the library.", rarity: 'common', isUnlocked: true, date: "MAR 12, 2024" },
        { title: "Series Binge", description: "Complete a full TV season in under 24 hours.", rarity: 'rare', isUnlocked: true, date: "APR 05, 2024" },
        { title: "Movie Marathon", description: "Log 5 movies in a single weekend.", rarity: 'ultra', isUnlocked: false },
      ]
    },
    {
      title: "Gamer Elite",
      items: [
        { title: "Completionist", description: "Reach 100% completion in any tracked game.", rarity: 'platinum', isUnlocked: false },
        { title: "Speed Reader", description: "Visit a Strategy Wiki 10 times.", rarity: 'common', isUnlocked: true, date: "MAY 01, 2024" },
        { title: "No Life", description: "Log over 100 hours in a single game title.", rarity: 'ultra', isUnlocked: false },
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#030308] pb-24 animate-in fade-in duration-500">
      {/* Header Container */}
      <div className="sticky top-0 z-[100] bg-[#030308]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <PremiumButton variant="glass" size="icon" className="h-11 w-11 rounded-2xl" onClick={() => navigate(-1)}>
               <ChevronLeft className="w-5 h-5 text-white" />
            </PremiumButton>
            <SectionHeader title="TROPHIES" subtitle="YOUR MILESTONES" />
         </div>
         <Trophy className="w-6 h-6 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
      </div>

      <div className="px-6 py-8 space-y-12">
        {/* Global Progress Strip */}
        <div className="grid grid-cols-2 gap-4">
           <StatWidget label="Unlocked" value="4/12" icon={Award} />
           <StatWidget label="Global Rank" value="Top 5%" icon={Target} color="text-accent" />
        </div>

        {/* Achievement Groups */}
        {achievementGroups.map((group, gIdx) => (
          <section key={group.title} className="space-y-6">
             <div className="px-2">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.25em]">{group.title}</h3>
                <div className="h-0.5 w-12 bg-primary mt-1" />
             </div>
             
             <div className="space-y-4">
                {group.items.map((item, idx) => (
                  <motion.div 
                    key={item.title}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: (gIdx * group.items.length + idx) * 0.05 }}
                  >
                    <AchievementCard 
                      title={item.title}
                      description={item.description}
                      rarity={item.rarity as any}
                      isUnlocked={item.isUnlocked}
                      date={item.date}
                    />
                  </motion.div>
                ))}
             </div>
          </section>
        ))}
      </div>
    </div>
  );
}
