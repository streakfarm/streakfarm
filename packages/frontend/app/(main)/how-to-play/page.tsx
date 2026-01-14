'use client';

import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function HowToPlayPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">How to Play</h1>
        <p className="text-muted-foreground">
          Learn how to maximize your points
        </p>
      </div>
      
      {/* Quick Guide */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Quick Start Guide</h3>
        
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-primary">1</span>
            </div>
            <div>
              <p className="font-semibold">Open Boxes Every Hour</p>
              <p className="text-sm text-muted-foreground">
                You get 24 boxes per day. Each box expires after 3 hours. Don't let them go to waste!
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-primary">2</span>
            </div>
            <div>
              <p className="font-semibold">Check In Daily</p>
              <p className="text-sm text-muted-foreground">
                Maintain your streak to increase your point multiplier. Missing a day resets your streak to 0.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-primary">3</span>
            </div>
            <div>
              <p className="font-semibold">Complete Tasks</p>
              <p className="text-sm text-muted-foreground">
                Earn bonus points by completing social tasks, watching ads, and more.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-primary">4</span>
            </div>
            <div>
              <p className="font-semibold">Invite Friends</p>
              <p className="text-sm text-muted-foreground">
                Get 10% of all points your referrals earn, forever. No limits!
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-primary">5</span>
            </div>
            <div>
              <p className="font-semibold">Earn Badges</p>
              <p className="text-sm text-muted-foreground">
                Unlock permanent multipliers by earning achievement badges.
              </p>
            </div>
          </div>
        </div>
      </Card>
      
      {/* FAQ */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Frequently Asked Questions</h3>
        
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>What happens if I miss a day?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Your streak will reset to 0 and you'll lose your streak multiplier. However, your badges and total points are safe!
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger>How do multipliers work?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Multipliers stack additively. For example: 7-day streak (1.5×) + 2 badges (1.1× + 2.0×) = 4.6× total multiplier on all points you earn.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger>What are the box rarities?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Common (94.9%): 50-1,000 points • Rare (5%): 5,000-10,000 points • Legendary (0.1%): 10,000-50,000 points
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4">
            <AccordionTrigger>Do I need to connect a wallet?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              No, but connecting gives you 5,000 bonus points, unlocks exclusive tasks, and increases your future token airdrop allocation.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-5">
            <AccordionTrigger>When is the token airdrop?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Token launch date will be announced. Keep farming points and building streaks to maximize your allocation!
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-6">
            <AccordionTrigger>How is my airdrop calculated?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Based on: Total points (40%), Streak (20%), Badges (20%), Referrals (10%), Early adopter status (10%). Exact formula revealed before snapshot.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
      
      {/* Tips */}
      <Card className="p-6 bg-primary/5">
        <h3 className="font-semibold mb-4">Pro Tips 💡</h3>
        
        <ul className="space-y-2 text-sm">
          <li>• Set 3-hour reminders to never miss boxes</li>
          <li>• Focus on building a long streak early (compound effect)</li>
          <li>• Join early to get permanent multiplier bonuses</li>
          <li>• Quality referrals > quantity (active users earn you more)</li>
          <li>• Connect wallet ASAP for exclusive high-value tasks</li>
          <li>• Check leaderboard daily for rank-based badges</li>
        </ul>
      </Card>
    </div>
  );
}
