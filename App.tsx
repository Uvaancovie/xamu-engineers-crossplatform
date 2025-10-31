import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, db } from './services/firebaseService';

import type { UserProfile } from './types';
import AuthComponent from './components/Auth';
import Dashboard from './components/Dashboard';
import Spinner from './components/Spinner';
import { LanguageProvider } from './src/LanguageContext';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const fetchUserProfile = useCallback(async (firebaseUser: User) => {
    const userRef = ref(db, `AppUsers/${firebaseUser.uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      setUserProfile({
        id: firebaseUser.uid,
        firstName: data.firstname || '',
        lastName: data.lastname || '',
        position: data.qualification || '',
        location: '',
        email: data.email
      });
    } else {
      // Create default profile if not exists
      const defaultProfile = {
        email: firebaseUser.email || '',
        firstname: firebaseUser.displayName?.split(' ')[0] || '',
        lastname: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
        qualification: ''
      };
      await set(userRef, defaultProfile);
      setUserProfile({
        id: firebaseUser.uid,
        firstName: defaultProfile.firstname,
        lastName: defaultProfile.lastname,
        position: defaultProfile.qualification,
        location: '',
        email: defaultProfile.email
      });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchUserProfile(firebaseUser);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Spinner />
      </div>
    );
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        {user && userProfile ? (
          <Dashboard user={user} userProfile={userProfile} theme={theme} toggleTheme={toggleTheme} />
        ) : (
          <AuthComponent onLoginSuccess={fetchUserProfile} />
        )}
      </div>
    </LanguageProvider>
  );
};

export default App;