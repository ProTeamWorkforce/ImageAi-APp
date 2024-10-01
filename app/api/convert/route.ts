import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  console.log('Received request in Next.js API route');

  // Verify Firebase ID token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Unauthorized: No valid Authorization header');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    await auth.verifyIdToken(idToken);
    console.log('Firebase token verified successfully');
  } catch (error: unknown) {
    console.error('Invalid Firebase token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Invalid token', details: errorMessage }, { status: 401 });
  }

  // Process the request
  try {
    const formData = await req.formData();
    console.log('FormData received');

    const file = formData.get('file') as File | null;
    const conversionType = formData.get('type') as string | null;

    console.log('Conversion type:', conversionType);
    console.log('File received:', file ? file.name : 'No file');

    if (!file || !conversionType) {
      console.log('Missing file or conversion type');
      return NextResponse.json({ error: 'Missing file or conversion type' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('File size:', buffer.length, 'bytes');

    const expressServerUrl = process.env.EXPRESS_SERVER_URL || 'http://localhost:3000';
    const endpoint = `/api/convert/${conversionType}`;

    const fullUrl = `${expressServerUrl}${endpoint}`;
    console.log('Sending request to Express server:', fullUrl);

    const formDataToSend = new FormData();
    formDataToSend.append('file', new Blob([buffer], { type: file.type }), file.name);
    formDataToSend.append('type', conversionType);

    const response = await fetch(fullUrl, {
      method: 'POST',
      body: formDataToSend,
    });

    console.log('Express server response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Express server error:', errorText);
      return NextResponse.json({ error: 'Conversion failed', details: errorText }, { status: response.status });
    }

    if (conversionType === 'excel') {
      // For Excel, return the binary data directly
      const excelBuffer = await response.arrayBuffer();
      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename=converted.xlsx',
        },
      });
    } else {
      // For other types, parse as JSON
      const result = await response.json();
      console.log('Received result from Express server:', result);
      return NextResponse.json(result);
    }
  } catch (error: unknown) {
    console.error('Error in Next.js API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Internal server error',
      details: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}