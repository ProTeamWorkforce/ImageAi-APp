import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Simple Diagnostic - No Firebase',
    environment: {
      EXPRESS_SERVER_URL: process.env.EXPRESS_SERVER_URL || 'not set',
      NODE_ENV: process.env.NODE_ENV || 'not set',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'not set',
    },
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
} 