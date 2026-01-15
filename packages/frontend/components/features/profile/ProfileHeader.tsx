'use client';

import { User } from '@streakfarm/shared/types/user';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Award } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';

interface ProfileHeaderProps {
  user: User;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          {/* Profile Picture */}
          {user.photo_url ? (
            <img
              src={user.photo_url}
              alt={user.first_name}
              className="h-24 w-24 rounded-full border-4 border-primary"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-primary">
              {user.first_name[0]}
            </div>
          )}

          {/* Name & Username */}
          <h2 className="text-2xl font-bold mt-4">
            {user.first_name} {user.last_name}
          </h2>
          {user.username && (
            <p className="text-muted-foreground">@{user.username}</p>
          )}

          {/* Badges */}
          <div className="flex items-center gap-2 mt-4">
            {user.is_founding_member && (
              <Badge className="bg-yellow-500">
                <Award className="h-3 w-3 mr-1" />
                Founding Member
              </Badge>
            )}
            {user.is_early_adopter && (
              <Badge className="bg-blue-500">Early Adopter</Badge>
            )}
            <Badge variant="outline">User #{user.user_number}</Badge>
          </div>

          {/* Join Date */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-3">
            <Calendar className="h-4 w-4" />
            <span>Joined {formatDate(user.created_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
