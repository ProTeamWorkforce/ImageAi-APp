'use client'

import { useState } from 'react';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button } from './ui/button';
import { toast } from 'react-toastify';

interface AuthProps {
  onSignIn: () => void;
  onSignUp: () => void;
  onGoogleSignIn: () => void;
  onLogout: () => void;
}

export function Auth({ onSignIn, onSignUp, onGoogleSignIn, onLogout }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, loading, error] = useAuthState(auth);

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Signed in successfully');
      onSignIn();
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(`Failed to sign in: ${error.message}`);
    }
  };

  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success('Signed up successfully');
      onSignUp();
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error(`Failed to sign up: ${error.message}`);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Signed in with Google successfully');
      onGoogleSignIn();
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast.error(`Failed to sign in with Google: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      onLogout();
    } catch (error: any) {
      console.error('Error logging out:', error);
      toast.error(`Failed to log out: ${error.message}`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (user) {
    return (
      <div>
        <p>Welcome, {user.email}!</p>
        <Button onClick={handleLogout}>Log Out</Button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <Button onClick={handleSignIn}>Sign In</Button>
      <Button onClick={handleSignUp}>Sign Up</Button>
      <Button onClick={handleGoogleSignIn}>Sign in with Google</Button>
    </div>
  );
}