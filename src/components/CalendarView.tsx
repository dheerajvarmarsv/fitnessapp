import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ParticipantLogTable from './ParticipantLogTable';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

interface DailyLog {
  date: string;
  workout_completed: boolean;
  workout_duration: number | null;
  sleep_hours: number | null;
  screen_time_hours: number | null;
  no_sugar: boolean;
  points: number;
  step_count: number | null;
  created_at: string;
  user: {
    username: string;
  };
}

export default function CalendarView() {
  const { session } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const challengeStart = new Date(2025, 0, 19); // January 19, 2025
  const challengeEnd = new Date(2025, 2, 1);    // March 1, 2025

  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
  });

  useEffect(() => {
    const fetchLogs = async () => {
      if (!session?.user) return;

      try {
        const { data, error } = await supabase
          .from('daily_logs')
          .select(`
            *,
            user:users(username)
          `)
          .gte('date', format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
          .lte('date', format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
          .order('date', { ascending: true });

        if (error) throw error;
        setLogs(data || []);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [session, selectedDate]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? subWeeks(currentWeekStart, 1)
      : addWeeks(currentWeekStart, 1);
    
    if (isWithinInterval(newDate, { start: challengeStart, end: challengeEnd })) {
      setCurrentWeekStart(newDate);
      setSelectedDate(newDate);
    }
  };

  const isDateInChallenge = (date: Date) => {
    return isWithinInterval(date, { start: challengeStart, end: challengeEnd });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 flex items-center justify-between border-b">
          <button
            onClick={() => navigateWeek('prev')}
            disabled={!isDateInChallenge(subWeeks(currentWeekStart, 1))}
            className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <h2 className="text-lg font-semibold">
            {format(currentWeekStart, 'MMMM d')} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'MMMM d, yyyy')}
          </h2>
          
          <button
            onClick={() => navigateWeek('next')}
            disabled={!isDateInChallenge(addWeeks(currentWeekStart, 1))}
            className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {weekDays.map((day) => (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              disabled={!isDateInChallenge(day)}
              className={`
                p-4 bg-white hover:bg-gray-50 transition-colors relative
                ${isSameDay(day, selectedDate) ? 'ring-2 ring-indigo-500 z-10' : ''}
                ${!isDateInChallenge(day) ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="text-sm font-medium text-gray-900">
                {format(day, 'EEE')}
              </div>
              <div className="mt-1">
                <span className="text-2xl font-semibold">{format(day, 'd')}</span>
              </div>
              {logs.some(log => isSameDay(parseISO(log.date), day)) && (
                <div className="absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {!loading && (
        <ParticipantLogTable
          date={selectedDate}
          logs={logs.filter(log => isSameDay(parseISO(log.date), selectedDate))}
        />
      )}
    </div>
  );
}