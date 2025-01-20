import React, { useState } from 'react';
import { Dumbbell, Info, UserPlus, Users, Plus } from 'lucide-react';
import ParticipantList from '../components/ParticipantList';
import RulesModal from '../components/RulesModal';
import DailyLogForm from '../components/DailyLogForm';
import CalendarView from '../components/CalendarView';
import { useParticipants } from '../hooks/useParticipants';

export default function Dashboard() {
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);
  const { participants, loading, hasJoined, handleJoinChallenge, isJoining, refreshData } = useParticipants();

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Dumbbell className="h-8 w-8 text-indigo-600" />
            Fitness Challenge
          </h1>
          <div className="flex gap-3">
            {!hasJoined && (
              <button
                onClick={handleJoinChallenge}
                disabled={isJoining}
                className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                {isJoining ? 'Joining...' : 'Join Challenge'}
              </button>
            )}
            {hasJoined && (
              <button
                onClick={() => setIsLogFormOpen(true)}
                className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Daily Log
              </button>
            )}
            <button
              onClick={() => setIsRulesModalOpen(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Info className="h-5 w-5 mr-2" />
              Rules & Guidelines
            </button>
          </div>
        </div>

        {isLogFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="relative bg-white rounded-lg w-full max-w-2xl my-8">
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
                <h2 className="text-2xl font-bold text-gray-900">Add Daily Log</h2>
              </div>
              <div className="px-6 py-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
                <DailyLogForm
                  onSuccess={() => {
                    setIsLogFormOpen(false);
                    refreshData(); // Refresh data instead of reloading
                  }}
                  onCancel={() => setIsLogFormOpen(false)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Challenge Period</h2>
              <p className="text-gray-600">January 20 - March 1, 2025</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">6 Weeks Total</p>
              <p className="text-sm font-medium text-indigo-600">
                Week 1 of 6
              </p>
            </div>
          </div>
        </div>

        {hasJoined && (
          <div className="mb-8">
            <CalendarView key={`calendar-${Date.now()}`} /> {/* Force re-render on data refresh */}
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Participants
              <span className="text-sm font-normal text-gray-500">
                ({loading ? '...' : participants.length} active)
              </span>
            </h2>
          </div>
          <ParticipantList />
        </section>

        <RulesModal
          isOpen={isRulesModalOpen}
          onClose={() => setIsRulesModalOpen(false)}
        />
      </div>
    </div>
  );
}