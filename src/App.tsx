import { useState, useEffect, useRef } from 'react';
import { useGoals } from './hooks';
import { GoalSection } from './GoalSection';
import { getDateInfo } from './dateUtils';
import { Goal, GoalPeriod } from './types';
import { useAuth } from './contexts/AuthContext';
import { InstallPrompt } from './InstallPrompt';

function App() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { goals, addGoal, toggleGoal, editGoal, deleteGoal, moveGoal, migrateLocalStorageToSupabase } = useGoals();
  const dateInfo = getDateInfo();
  const [draggedItem, setDraggedItem] = useState<{ goal: Goal; sourcePeriod: GoalPeriod } | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastColumnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToRight = () => {
      if (lastColumnRef.current) {
        lastColumnRef.current.scrollIntoView({ 
          behavior: 'auto', 
          block: 'nearest',
          inline: 'end'
        });
      }
    };

    // Add a small delay to ensure content is rendered
    const timer = setTimeout(scrollToRight, 150);
    
    return () => clearTimeout(timer);
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
      <div className="max-w-8xl mx-auto px-4 py-4">
        <header className="text-center mb-4">
          <div className="flex justify-center items-center mb-2">
            <div></div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Goal Tracker</h1>
              <div className="flex justify-center items-center gap-3">
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
                    className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors border border-gray-200"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSignInAndSync}
                  disabled={syncStatus === 'syncing'}
                  className="text-blue-600 hover:text-blue-800 focus:outline-none transition-colors flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed underline"
                >
                  {syncStatus === 'syncing' ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      Syncing...
                    </>
                  ) : syncStatus === 'synced' ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Synced
                    </>
                  ) : syncStatus === 'error' ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Retry
                    </>
                  ) : (
                    'Sync with Google'
                  )}
                </button>
              )}
              </div>
            </div>
           
          </div>
        </header>

        <div 
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-8rem)]"
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
          
          <div ref={lastColumnRef} className="flex-shrink-0 w-80">
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
      <InstallPrompt />
    </div>
  );
}

export default App;