import React, { useState, useEffect } from 'react';
import { format, startOfWeek } from 'date-fns';
import { Check, X, ChevronUp, ChevronDown, Dumbbell, Apple, Footprints, Moon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Log {
  date: string;
  workout_completed: boolean;
  workout_duration: number | null;
  workout_proof_url: string | null;
  sleep_hours: number | null;
  screen_time_hours: number | null;
  no_sugar: boolean;
  points: number;
  step_count: number | null;
  created_at: string;
  user: {
    username: string;
  };
  user_id: string;
}

interface Props {
  date: Date;
  logs: Log[];
}

interface WorkoutCount {
  [key: string]: number;
}

export default function ParticipantLogTable({ date, logs }: Props) {
  const [sortField, setSortField] = useState<keyof Log>('user');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<WorkoutCount>({});

  useEffect(() => {
    const fetchWeeklyWorkouts = async () => {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('daily_logs')
        .select('user_id, date')
        .gte('date', weekStartStr)
        .lte('date', format(date, 'yyyy-MM-dd'))
        .eq('workout_completed', true);

      if (error) {
        console.error('Error fetching weekly workouts:', error);
        return;
      }

      const counts: WorkoutCount = {};
      data?.forEach(log => {
        counts[log.user_id] = (counts[log.user_id] || 0) + 1;
      });
      setWeeklyWorkouts(counts);
    };

    fetchWeeklyWorkouts();
  }, [date]);

  const handleSort = (field: keyof Log) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedLogs = [...logs].sort((a, b) => {
    if (sortField === 'user') {
      return sortDirection === 'asc'
        ? a.user.username.localeCompare(b.user.username)
        : b.user.username.localeCompare(a.user.username);
    }
    return sortDirection === 'asc'
      ? String(a[sortField]).localeCompare(String(b[sortField]))
      : String(b[sortField]).localeCompare(String(a[sortField]));
  });

  const SortIcon = ({ field }: { field: keyof Log }) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const getWorkoutPoints = (log: Log) => {
    if (!log.workout_completed || !log.workout_duration || log.workout_duration < 30) {
      return 0;
    }
    const workoutCount = weeklyWorkouts[log.user_id] || 0;
    return workoutCount > 5 ? 10 : 5;
  };

  const calculatePointsBreakdown = (log: Log) => {
    let breakdown = [];
    
    // Workout points
    if (log.workout_completed && log.workout_duration && log.workout_duration >= 30) {
      const points = getWorkoutPoints(log);
      breakdown.push(`+${points} workout`);
    }
    
    // Sleep bonus (7+ hours: 5 points)
    if (log.sleep_hours && log.sleep_hours >= 7) {
      breakdown.push('+5 sleep');
    }
    
    // Screen time bonus (under 5 hours: 5 points)
    if (log.screen_time_hours && log.screen_time_hours < 5) {
      breakdown.push('+5 screen');
    }
    
    // No sugar bonus (4 points)
    if (log.no_sugar) {
      breakdown.push('+4 sugar');
    }
    
    // Step count bonus (12K+ steps: 5 points)
    if (log.step_count && log.step_count >= 12000) {
      breakdown.push('+5 steps');
    }
    
    return breakdown.join(', ');
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">
          Daily Logs for {format(date, 'MMMM d, yyyy')}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('user')}
              >
                <div className="flex items-center space-x-1">
                  <span>Participant</span>
                  <SortIcon field="user" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-center">
                  <Dumbbell className="h-4 w-4" />
                  <span className="ml-1">Workout</span>
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-center">
                  <Moon className="h-4 w-4" />
                  <span className="ml-1">Sleep</span>
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-center">
                  <Apple className="h-4 w-4" />
                  <span className="ml-1">No Sugar</span>
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-center">
                  <Footprints className="h-4 w-4" />
                  <span className="ml-1">Steps</span>
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('points')}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Points</span>
                  <SortIcon field="points" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedLogs.map((log) => (
              <tr key={`${log.user.username}-${log.created_at}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {log.user.username}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-center gap-2">
                    {log.workout_completed ? (
                      <>
                        <div className="text-sm text-gray-900 flex items-center gap-2">
                          <Check className="h-5 w-5 text-green-500" />
                          <span>{log.workout_duration}min</span>
                        </div>
                        {log.workout_proof_url ? (
                          <img
                            src={log.workout_proof_url}
                            alt="Workout proof"
                            className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(log.workout_proof_url, '_blank')}
                          />
                        ) : (
                          <div className="text-xs text-gray-500">No photo</div>
                        )}
                        <div className="text-xs text-green-600">
                          {`+${getWorkoutPoints(log)} points`}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center">
                        <X className="h-5 w-5 text-red-500" />
                        <span className="ml-2 text-sm text-gray-500">No workout</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm text-gray-900">
                    {log.sleep_hours ? (
                      <>
                        <span>{log.sleep_hours}h</span>
                        <div className="text-xs text-green-600 mt-1">
                          {log.sleep_hours >= 7 ? '+5 points' : '0 points'}
                        </div>
                      </>
                    ) : (
                      '-'
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div>
                    {log.no_sugar ? (
                      <>
                        <Check className="h-5 w-5 text-green-500 inline" />
                        <div className="text-xs text-green-600 mt-1">+4 points</div>
                      </>
                    ) : (
                      <>
                        <X className="h-5 w-5 text-red-500 inline" />
                        <div className="text-xs text-red-600 mt-1">0 points</div>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm text-gray-900">
                    {log.step_count ? (
                      <>
                        <span>{log.step_count.toLocaleString()}</span>
                        <div className="text-xs text-green-600 mt-1">
                          {log.step_count >= 12000 ? '+5 points' : '0 points'}
                        </div>
                      </>
                    ) : (
                      '-'
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {log.points}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {calculatePointsBreakdown(log)}
                  </div>
                </td>
              </tr>
            ))}
            {sortedLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No logs found for this date
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
