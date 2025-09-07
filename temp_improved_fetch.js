    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response;
    try {
      console.log('Attempting to fetch from:', fullUrl);
      
      response = await fetch(fullUrl, {
        method: 'POST',
        body: formDataToSend,
        signal: controller.signal,
        headers: {
          'User-Agent': 'ImageAI-App/1.0',
        },
      });
      
      clearTimeout(timeoutId);
      console.log('Express server response status:', response.status);
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          error: 'Request timeout',
          details: 'The request to the backend server timed out after 30 seconds',
          backend_url: fullUrl
        }, { status: 504 });
      }
      
      return NextResponse.json({
        error: 'Connection failed',
        details: `Failed to connect to backend server: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
        backend_url: fullUrl
      }, { status: 500 });
    }
