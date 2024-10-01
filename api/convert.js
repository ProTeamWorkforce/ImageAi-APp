const express = require('express');
const router = express.Router();
const vision = require('@google-cloud/vision');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Set up Google Cloud Vision client
let client;
try {
  const keyFilename = path.join(process.cwd(), 'imageai-437222-b38703ef4cc2.json');
  
  console.log('Attempting to read credentials file:', keyFilename);
  console.log('Process environment:', process.env);
console.log('Current working directory:', process.cwd());
console.log('Files in current directory:', fs.readdirSync(process.cwd()));
  
  if (fs.existsSync(keyFilename)) {
    const credentials = JSON.parse(fs.readFileSync(keyFilename, 'utf8'));
    console.log('Credentials file found and parsed');
    
    if (!credentials.client_email) {
      throw new Error('client_email is missing from the credentials file');
    }
    
    client = new vision.ImageAnnotatorClient({ keyFilename });
    console.log('Google Cloud Vision client initialized with credentials file');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('Using GOOGLE_APPLICATION_CREDENTIALS environment variable');
    client = new vision.ImageAnnotatorClient();
  } else {
    throw new Error('Google Cloud credentials not found');
  }
} catch (error) {
  console.error('Error initializing Google Cloud Vision client:', error);
}

// Middleware to check if the client is initialized
const checkVisionClient = (req, res, next) => {
  if (!client) {
    return res.status(500).json({ error: 'Google Cloud Vision client not initialized' });
  }
  next();
};

// Extract Text
router.post('/text', checkVisionClient, async (req, res) => {
  console.log('Received request for text extraction');
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    console.log('File received:', req.file.originalname);
    
    const [result] = await client.textDetection(req.file.buffer);
    console.log('Text detection result:', JSON.stringify(result, null, 2));

    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      return res.status(400).json({ error: 'No text detected in the image' });
    }
    const text = detections[0].description;
    console.log('Extracted text:', text.substring(0, 100) + '...');
    res.json({ result: text });
  } catch (error) {
    console.error('Error in text extraction:', error);
    res.status(500).json({ error: 'Failed to extract text', details: error.message });
  }
});

// Convert to Excel
router.post('/excel', checkVisionClient, async (req, res) => {
    console.log('Received request for Excel conversion');
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      console.log('File received:', req.file.originalname);
  
      const [result] = await client.textDetection(req.file.buffer);
      console.log('Text detection result:', JSON.stringify(result, null, 2));
  
      const detections = result.textAnnotations;
      if (!detections || detections.length === 0) {
        return res.status(400).json({ error: 'No text detected in the image' });
      }
      const text = detections[0].description;
      console.log('Extracted text:', text);
  
      // Improved text parsing
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const headers = lines[0].split(/\s+/);
      const rows = lines.slice(1).map(line => {
        const values = line.split(/\s+/);
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index] || '';
          return obj;
        }, {});
      });
  
      // Create a new workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);
  
      // Auto-size columns
      const max_width = rows.reduce((w, r) => Math.max(w, Object.keys(r).length), 0);
      const colWidths = new Array(max_width).fill({ wch: 15 }); // Set default width to 15 characters
      worksheet['!cols'] = colWidths;
  
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      console.log('Excel buffer created, size:', excelBuffer.length, 'bytes');
  
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=converted.xlsx');
      res.send(excelBuffer);
    } catch (error) {
      console.error('Error in Excel conversion:', error);
      res.status(500).json({ error: 'Failed to convert to Excel', details: error.message });
    }
  });

// Image Search and Label Detection
router.post('/search', checkVisionClient, async (req, res) => {
  console.log('Received request for image search and label detection');
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    console.log('File received:', req.file.originalname);

    // Perform both web detection and label detection
    const [webDetectionResult, labelDetectionResult] = await Promise.all([
      client.webDetection(req.file.buffer),
      client.labelDetection(req.file.buffer)
    ]);

    console.log('Web detection result:', JSON.stringify(webDetectionResult, null, 2));
    console.log('Label detection result:', JSON.stringify(labelDetectionResult, null, 2));

    const webDetection = webDetectionResult[0].webDetection;
    const labelAnnotations = labelDetectionResult[0].labelAnnotations;

    // Process web detection results
    const searchResults = [];
    if (webDetection && webDetection.visuallySimilarImages) {
      searchResults.push(...webDetection.visuallySimilarImages.map(image => ({
        type: 'similar',
        url: image.url,
        score: image.score
      })));
    }

    // Process label detection results
    const labels = labelAnnotations ? labelAnnotations.map(label => ({
      description: label.description,
      score: label.score
    })) : [];

    // Sort and limit search results
    searchResults.sort((a, b) => b.score - a.score);
    const topSearchResults = searchResults.slice(0, 10);

    // Sort labels by score
    labels.sort((a, b) => b.score - a.score);

    res.json({ 
      searchResults: topSearchResults,
      labels: labels
    });
  } catch (error) {
    console.error('Error in image search and label detection:', error);
    res.status(500).json({ error: 'Failed to perform image search and label detection', details: error.message });
  }
});

// New route: Convert to JSON
router.post('/json', checkVisionClient, async (req, res) => {
  console.log('Received request for JSON conversion');
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    console.log('File received:', req.file.originalname);

    const [result] = await client.annotateImage({
      image: { content: req.file.buffer },
      features: [
        { type: 'LABEL_DETECTION' },
        { type: 'TEXT_DETECTION' },
        { type: 'FACE_DETECTION' },
        { type: 'LANDMARK_DETECTION' },
        { type: 'LOGO_DETECTION' },
        { type: 'OBJECT_LOCALIZATION' },
      ],
    });

    console.log('Google Vision API result:', JSON.stringify(result, null, 2));

    const jsonResult = {
      labels: result.labelAnnotations,
      text: result.textAnnotations,
      faces: result.faceAnnotations,
      landmarks: result.landmarkAnnotations,
      logos: result.logoAnnotations,
      objects: result.localizedObjectAnnotations,
    };

    res.json(jsonResult);
  } catch (error) {
    console.error('Error in JSON conversion:', error);
    res.status(500).json({ error: 'Failed to convert to JSON', details: error.message, stack: error.stack });
  }
});

module.exports = router;