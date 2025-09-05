import { useState, useEffect, useRef } from 'react';
import { useGoals } from './hooks';
import { GoalSection } from './GoalSection';
import { getDateInfo } from './dateUtils';
import { Goal, GoalPeriod } from './types';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { goals, addGoal, toggleGoal, editGoal, deleteGoal, moveGoal, migrateLocalStorageToSupabase } = useGoals();
  const dateInfo = getDateInfo();
  const [draggedItem, setDraggedItem] = useState<{ goal: Goal; sourcePeriod: GoalPeriod } | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, []);

  // Auto-migrate localStorage data when user signs in
  useEffect(() => {
    if (user && syncStatus === 'syncing') {
      migrateLocalStorageToSupabase().then(() => {
        setSyncStatus('synced');
        // Auto-reset to idle after 3 seconds
        setTimeout(() => setSyncStatus('idle'), 3000);
      });
    }
  }, [user, migrateLocalStorageToSupabase, syncStatus]);

  const handleSignInAndSync = async () => {
    try {
      setSyncStatus('syncing');
      await signInWithGoogle();
      // Migration will happen automatically in the hooks after sign in
      setSyncStatus('synced');
    } catch (error) {
      console.error('Error during sign in:', error);
      setSyncStatus('error');
    }
  };

  const handleDragStart = (goal: Goal, sourcePeriod: GoalPeriod) => {
    setDraggedItem({ goal, sourcePeriod });
  };

  const handleDrop = (targetPeriod: GoalPeriod) => {
    if (draggedItem) {
      moveGoal(draggedItem.goal, draggedItem.sourcePeriod, targetPeriod);
      setDraggedItem(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-8xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Goal Tracker</h1>
              <p className="text-gray-600">
                Organize your yearly, quarterly, monthly, weekly, and daily goals
                {!user && (
                  <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    Offline Mode
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {user.user_metadata?.avatar_url && (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <button
                    onClick={signOut}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSignInAndSync}
                  disabled={syncStatus === 'syncing'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncStatus === 'syncing' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Syncing...
                    </>
                  ) : syncStatus === 'synced' ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Synced
                    </>
                  ) : syncStatus === 'error' ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Retry Sync
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sync with Google
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </header>

        <div 
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)] justify-center"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="flex-shrink-0 w-80">
            <GoalSection
              title={dateInfo.yearly}
              period="yearly"
              goals={goals.yearly}
              onAddGoal={addGoal}
              onToggleGoal={toggleGoal}
              onEditGoal={editGoal}
              onDeleteGoal={deleteGoal}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          </div>
          
          <div className="flex-shrink-0 w-80">
            <GoalSection
              title={dateInfo.quarterly}
              period="quarterly"
              goals={goals.quarterly}
              onAddGoal={addGoal}
              onToggleGoal={toggleGoal}
              onEditGoal={editGoal}
              onDeleteGoal={deleteGoal}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          </div>
          
          <div className="flex-shrink-0 w-80">
            <GoalSection
              title={dateInfo.monthly}
              period="monthly"
              goals={goals.monthly}
              onAddGoal={addGoal}
              onToggleGoal={toggleGoal}
              onEditGoal={editGoal}
              onDeleteGoal={deleteGoal}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          </div>
          
          <div className="flex-shrink-0 w-80">
            <GoalSection
              title={dateInfo.weekly}
              period="weekly"
              goals={goals.weekly}
              onAddGoal={addGoal}
              onToggleGoal={toggleGoal}
              onEditGoal={editGoal}
              onDeleteGoal={deleteGoal}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          </div>
          
          <div className="flex-shrink-0 w-80">
            <GoalSection
              title={dateInfo.daily}
              period="daily"
              goals={goals.daily}
              onAddGoal={addGoal}
              onToggleGoal={toggleGoal}
              onEditGoal={editGoal}
              onDeleteGoal={deleteGoal}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;