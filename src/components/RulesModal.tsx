import React, { useState, useEffect } from 'react';
import { X, UserPlus, Users } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Participant {
  id: string;
  username: string;
  joined_at: string;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sortBy, setSortBy] = useState<'username' | 'joined_at'>('joined_at');
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const { session } = useAuthStore();

  const fetchParticipants = async () => {
    const { data } = await supabase
      .from('challenge_participants')
      .select('id, users!inner(username), joined_at')
      .order(sortBy === 'username' ? 'users.username' : 'joined_at', { ascending: true });

    if (data) {
      setParticipants(data.map(p => ({
        id: p.id,
        username: p.users.username,
        joined_at: p.joined_at
      })));
    }
  };

  const checkParticipation = async () => {
    if (session?.user) {
      const { data } = await supabase
        .from('challenge_participants')
        .select()
        .eq('user_id', session.user.id)
        .single();
      setHasJoined(!!data);
    }
  };

  const handleJoinChallenge = async () => {
    if (!session?.user || hasJoined || isJoining) return;
    
    setIsJoining(true);
    try {
      await supabase
        .from('challenge_participants')
        .insert([{ user_id: session.user.id }]);
      setHasJoined(true);
      await fetchParticipants();
    } catch (error) {
      console.error('Error joining challenge:', error);
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchParticipants();
      checkParticipation();
      const interval = setInterval(fetchParticipants, 60000);
      return () => clearInterval(interval);
    }
  }, [isOpen, sortBy]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Challenge Rules & Guidelines</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-8">
            <button
              onClick={handleJoinChallenge}
              disabled={hasJoined || isJoining}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-medium ${
                hasJoined 
                  ? 'bg-green-500 cursor-default'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {hasJoined ? (
                <>
                  <Users className="h-5 w-5" />
                  You've Joined the Challenge!
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  {isJoining ? 'Joining...' : 'Join Challenge'}
                </>
              )}
            </button>
          </div>

          <div className="mb-8 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Current Participants ({participants.length})
              </h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'username' | 'joined_at')}
                className="text-sm border rounded-md px-2 py-1"
              >
                <option value="joined_at">Sort by Join Date</option>
                <option value="username">Sort by Username</option>
              </select>
            </div>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className={`p-3 rounded-lg ${
                    session?.user && participant.id === session.user.id
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">
                      {participant.username}
                      {session?.user && participant.id === session.user.id && (
                        <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-gray-500">
                      Joined {new Date(participant.joined_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-2">Duration</h3>
              <p>January 20 - March 1 (6 weeks)</p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Workout Commitment</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Complete at least 5 workouts per week</li>
                <li>Each workout must be minimum 30 minutes</li>
                <li>Any physical activity counts (gym, yoga, running, cycling, etc.)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Points System</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Base: 5 points per completed workout</li>
                <li>6+ workouts in a week: +10 bonus points</li>
                <li>7+ hours sleep: +5 points per day</li>
                <li>Under 5 hours screen time: +5 points per day</li>
                <li>No sugar day: +4 points</li>
                <li>3 weeks streak: +15 points (full adherence)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Penalties</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>₹500 per missed workout</li>
                <li>Penalties go to group fund for rewards</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Grace Policy</h3>
              <p>One free pass for a missed workout (emergencies only)</p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Fair Play</h3>
              <p>False reporting will result in immediate disqualification</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}