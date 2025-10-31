import React, { useState, FormEvent } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, User } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from '../services/firebaseService';

interface AuthProps {
    onLoginSuccess: (user: User) => void;
}

const AuthComponent: React.FC<AuthProps> = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [position, setPosition] = useState('');
    const [location, setLocation] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isLogin) {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                if (userCredential.user) {
                    onLoginSuccess(userCredential.user);
                }
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                if (user) {
                    await set(ref(db, `AppUsers/${user.uid}`), {
                        email,
                        firstname: firstName,
                        lastname: lastName,
                        qualification: position // Using position as qualification
                    });
                    onLoginSuccess(user);
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-700 flex items-center justify-center relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 text-white text-6xl">
                    <i className="fas fa-leaf"></i>
                </div>
                <div className="absolute top-20 right-20 text-white text-4xl">
                    <i className="fas fa-tree"></i>
                </div>
                <div className="absolute bottom-20 left-20 text-white text-5xl">
                    <i className="fas fa-seedling"></i>
                </div>
                <div className="absolute bottom-10 right-10 text-white text-3xl">
                    <i className="fas fa-water"></i>
                </div>
                <div className="absolute top-1/2 left-1/4 text-white text-2xl opacity-20">
                    <i className="fas fa-globe-africa"></i>
                </div>
                <div className="absolute top-1/3 right-1/4 text-white text-3xl opacity-15">
                    <i className="fas fa-map-marked-alt"></i>
                </div>
            </div>

            {/* Floating particles effect */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-white rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-white rounded-full opacity-30 animate-pulse delay-1000"></div>
                <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-white rounded-full opacity-25 animate-pulse delay-500"></div>
                <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-white rounded-full opacity-20 animate-pulse delay-1500"></div>
            </div>

            <div className="w-full max-w-md p-8 space-y-8 bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-xl shadow-2xl relative z-10 border border-white/20">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <img src="/xamu-logo.png" alt="XAMU Logo" className="h-16 w-auto" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white">
                        XAMU Field Scientist
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {isLogin ? 'Welcome back! Sign in to your account' : 'Create a new account'}
                    </p>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        Or{' '}
                        <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-green-600 hover:text-green-700 transition-colors">
                            {isLogin ? 'create an account' : 'sign in'}
                        </button>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <>
                            <div className="flex space-x-4">
                                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" required className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
                                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" required className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
                            </div>
                             <input type="text" value={position} onChange={e => setPosition(e.target.value)} placeholder="Position (e.g., Field Scientist)" required className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
                             <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Your Location" required className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
                        </>
                    )}
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
                    
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    
                    <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:from-green-400 disabled:to-green-500 transform transition-all hover:scale-105 active:scale-95">
                        {loading ? (
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <i className={`fas ${isLogin ? 'fa-sign-in-alt' : 'fa-user-plus'} mr-2`}></i>
                                {isLogin ? 'Sign in' : 'Register'}
                            </div>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <div className="flex items-center justify-center mb-4">
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                        <span className="px-4 text-sm text-gray-500 bg-white dark:bg-gray-800">or</span>
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 font-medium">Download our mobile app for the best experience</p>
                    <div className="flex flex-col space-y-3">
                        <button
                            onClick={() => {
                                // Trigger PWA install prompt or show instructions
                                if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
                                    alert('To install the app on your phone:\n1. Open this page in your mobile browser\n2. Tap the "Share" button\n3. Select "Add to Home Screen"');
                                } else {
                                    alert('To install the app:\n• On iOS: Tap Share → Add to Home Screen\n• On Android: Tap Menu → Add to Home Screen');
                                }
                            }}
                            className="w-full flex justify-center py-3 px-4 border-2 border-green-600 rounded-lg shadow-md text-sm font-semibold text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-gray-800 dark:border-green-500 dark:text-green-400 dark:hover:bg-gray-700 transform transition-all hover:scale-105 active:scale-95"
                        >
                            <i className="fas fa-mobile-alt mr-3 text-lg"></i>
                            Download Mobile App
                            <i className="fas fa-download ml-3 text-lg"></i>
                        </button>
                        <button
                            onClick={() => {
                                // Alternative download method or instructions
                                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                                const isAndroid = /Android/.test(navigator.userAgent);

                                if (isIOS) {
                                    alert('On iOS:\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" in the top right');
                                } else if (isAndroid) {
                                    alert('On Android:\n1. Tap the menu button (three dots)\n2. Select "Add to Home Screen"\n3. Tap "Add"');
                                } else {
                                    alert('For the best mobile experience:\n• Use Chrome or Safari on mobile\n• Add this page to your home screen');
                                }
                            }}
                            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 transform transition-all hover:scale-105 active:scale-95"
                        >
                            <i className="fas fa-info-circle mr-3 text-lg"></i>
                            Installation Guide
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthComponent;