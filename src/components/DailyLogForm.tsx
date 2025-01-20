import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import PhotoUpload from './PhotoUpload';
import { format, isToday, parseISO } from 'date-fns';

interface DailyLogFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DailyLogForm({ onSuccess, onCancel }: DailyLogFormProps) {
  const { session } = useAuthStore();
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutProofUrl, setWorkoutProofUrl] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [screenTimeHours, setScreenTimeHours] = useState('');
  const [noSugar, setNoSugar] = useState(false);
  const [stepCount, setStepCount] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingLog, setExistingLog] = useState<any>(null);

  useEffect(() => {
    const checkExistingLog = async () => {
      if (!session?.user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing log:', error);
        return;
      }

      // Validate if the existing log is from today
      if (data && !isToday(parseISO(data.date))) {
        setError('You can only edit logs for the current date.');
        return;
      }

      if (data) {
        setExistingLog(data);
        setWorkoutCompleted(data.workout_completed);
        setWorkoutDuration(data.workout_duration?.toString() || '');
        setWorkoutProofUrl(data.workout_proof_url || '');
        setSleepHours(data.sleep_hours?.toString() || '');
        setScreenTimeHours(data.screen_time_hours?.toString() || '');
        setNoSugar(data.no_sugar);
        setStepCount(data.step_count?.toString() || '');
      }
    };

    checkExistingLog();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;

    setSubmitting(true);
    try {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');

      // Validate that we're only logging for today
      if (existingLog && !isToday(parseISO(existingLog.date))) {
        throw new Error('You can only edit logs for the current date.');
      }

      const logData = {
        user_id: session.user.id,
        date: todayStr,
        workout_completed: workoutCompleted,
        workout_duration: workoutDuration ? parseInt(workoutDuration) : null,
        workout_proof_url: workoutProofUrl,
        sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
        screen_time_hours: screenTimeHours ? parseFloat(screenTimeHours) : null,
        no_sugar: noSugar,
        step_count: stepCount ? parseInt(stepCount) : null
      };

      const { error } = await supabase
        .from('daily_logs')
        .upsert([logData], {
          onConflict: 'user_id,date'
        });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error submitting daily log:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit log. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {existingLog && (
        <div className="bg-blue-50 text-blue-600 p-3 rounded-md text-sm">
          Updating today's existing log
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={workoutCompleted}
            onChange={(e) => setWorkoutCompleted(e.target.checked)}
            className="h-5 w-5 text-indigo-600 rounded"
          />
          <span className="text-gray-700 text-lg">Workout Completed</span>
        </label>
      </div>

      {workoutCompleted && (
        <div className="space-y-6 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={workoutDuration}
              onChange={(e) => setWorkoutDuration(e.target.value)}
              min="0"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter workout duration"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proof of Workout
            </label>
            <PhotoUpload
              onUploadComplete={(url) => setWorkoutProofUrl(url)}
              onError={setError}
            />
            {workoutProofUrl && !workoutProofUrl.startsWith('blob:') && (
              <img
                src={workoutProofUrl}
                alt="Existing workout proof"
                className="mt-2 w-full h-64 object-cover rounded-lg"
              />
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sleep Hours
          </label>
          <input
            type="number"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            step="0.5"
            min="0"
            max="24"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Hours of sleep"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Screen Time Hours
          </label>
          <input
            type="number"
            value={screenTimeHours}
            onChange={(e) => setScreenTimeHours(e.target.value)}
            step="0.5"
            min="0"
            max="24"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Hours of screen time"
          />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Step Count
        </label>
        <input
          type="number"
          value={stepCount}
          onChange={(e) => setStepCount(e.target.value)}
          min="0"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Number of steps today"
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={noSugar}
            onChange={(e) => setNoSugar(e.target.checked)}
            className="h-5 w-5 text-indigo-600 rounded"
          />
          <span className="text-gray-700 text-lg">No Sugar Today</span>
        </label>
      </div>

      <div className="sticky bottom-0 bg-white py-4 border-t border-gray-200 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : (existingLog ? 'Update Log' : 'Submit Log')}
        </button>
      </div>
    </form>
  );
}