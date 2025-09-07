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
    const endpoint = `/api/convert`;

    const fullUrl = expressServerUrl.replace(/\/$/, "") + endpoint;
    console.log('=== BACKEND REQUEST DETAILS ===');
    console.log('Backend server URL:', expressServerUrl);
    console.log('Endpoint:', endpoint);
    console.log('Complete URL:', fullUrl);
    console.log('Conversion type:', conversionType);
    console.log('File name:', file.name);
    console.log('File type:', file.type);
    console.log('File size:', buffer.length, 'bytes');

    const formDataToSend = new FormData();
    formDataToSend.append('image', new Blob([buffer], { type: file.type }), file.name);
    formDataToSend.append('type', conversionType);

    console.log('FormData contents:');
    for (const [key, value] of Array.from(formDataToSend.entries())) {
      if (value && typeof value === 'object' && 'name' in value) {
        console.log(`  ${key}:`, `File(${(value as any).name})`);
      } else {
        console.log(`  ${key}:`, value);
      }
    }

    const response = await fetch(fullUrl, {
      method: 'POST',
      body: formDataToSend,
    });

    console.log('Express server response status:', response.status);
    console.log('Express server response headers:', Object.fromEntries(response.headers.entries()));

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
      console.log('Result type:', typeof result);
      console.log('Result keys:', Object.keys(result));
      
      // Check if result is base64 encoded
      if (result && result.result && typeof result.result === 'string') {
        try {
          const decoded = atob(result.result);
          console.log('Successfully decoded base64 result, length:', decoded.length);
          console.log('Decoded preview:', decoded.substring(0, 100) + '...');
          
          // Return the decoded result instead of base64
          return NextResponse.json({ result: decoded });
        } catch (decodeError) {
          console.log('Result is not base64 encoded, returning as is');
          return NextResponse.json(result);
        }
      }
      
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