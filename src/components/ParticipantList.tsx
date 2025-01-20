import React from 'react';
import { Trophy, Dumbbell, Clock, Moon } from 'lucide-react';
import { useParticipants } from '../hooks/useParticipants';
import { useAuthStore } from '../stores/authStore';

export default function ParticipantList() {
  const { participants, loading } = useParticipants();
  const { session } = useAuthStore();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {participants.map((participant) => {
        const isCurrentUser = session?.user?.id === participant.id;
        
        return (
          <div
            key={participant.id}
            className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow ${
              isCurrentUser ? 'ring-2 ring-indigo-500 ring-opacity-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <Dumbbell className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {participant.username}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                        You
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Joined {new Date(participant.challenge_participants?.joined_at || participant.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex flex-col items-center">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium">
                    {participant.daily_logs_aggregate?.aggregate?.sum || 0}
                  </span>
                  <span className="text-xs text-gray-500">Points</span>
                </div>
                <div className="flex flex-col items-center">
                  <Clock className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">
                    {participant.daily_logs_aggregate?.aggregate?.count || 0}
                  </span>
                  <span className="text-xs text-gray-500">Workouts</span>
                </div>
                <div className="flex flex-col items-center">
                  <Moon className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">{participant.streak || 0}</span>
                  <span className="text-xs text-gray-500">Streak</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}