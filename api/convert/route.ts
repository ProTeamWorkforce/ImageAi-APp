import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { ImageAnnotatorClient } from '@google-cloud/vision';

// Initialize the Google Cloud Vision client
const client = new ImageAnnotatorClient();

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
  } catch (error: any) {
    console.error('Invalid Firebase token:', error);
    return NextResponse.json({ error: 'Invalid token', details: error.message }, { status: 401 });
  }

  // Process the request
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const conversionType = formData.get('type') as string | null;

  console.log('Conversion type:', conversionType);
  console.log('File received:', file ? file.name : 'No file');

  if (!file || !conversionType) {
    console.log('Missing file or conversion type');
    return NextResponse.json({ error: 'Missing file or conversion type' }, { status: 400 });
  }

  if (conversionType === 'json') {
    try {
      const buffer = await file.arrayBuffer();
      const [result] = await client.annotateImage({
        image: { content: Buffer.from(buffer) },
        features: [
          { type: 'LABEL_DETECTION' },
          { type: 'TEXT_DETECTION' },
          { type: 'FACE_DETECTION' },
          { type: 'LANDMARK_DETECTION' },
          { type: 'LOGO_DETECTION' },
          { type: 'OBJECT_LOCALIZATION' },
        ],
      });

      const jsonResult = {
        labels: result.labelAnnotations,
        text: result.textAnnotations,
        faces: result.faceAnnotations,
        landmarks: result.landmarkAnnotations,
        logos: result.logoAnnotations,
        objects: result.localizedObjectAnnotations,
      };

      console.log('JSON conversion result:', JSON.stringify(jsonResult, null, 2));
      return NextResponse.json(jsonResult);
    } catch (error: any) {
      console.error('Error in JSON conversion:', error);
      return NextResponse.json({ error: 'Failed to convert to JSON', details: error.message }, { status: 500 });
    }
  } else {
    // Handle other conversion types or return an error
    return NextResponse.json({ error: 'Unsupported conversion type' }, { status: 400 });
  }
}