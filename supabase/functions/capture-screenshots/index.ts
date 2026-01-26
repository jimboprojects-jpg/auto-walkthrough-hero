import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CaptureRequest {
  url: string;
}

interface ViewportConfig {
  name: string;
  width: number;
  height: number;
}

const viewports: ViewportConfig[] = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'desktop', width: 1920, height: 1080 },
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error('Invalid token:', claimsError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log('Authenticated user:', userId);

    const { url } = await req.json() as CaptureRequest;

    if (!url) {
      console.error('No URL provided');
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Capturing screenshots for:', formattedUrl);

    // Capture screenshots for all viewports in parallel
    // Note: Firecrawl v1 scrape API doesn't support custom viewports per request
    // We'll capture the page once and return the same screenshot for all device types
    // The frontend will handle displaying them in different device frames
    const capturePromises = viewports.map(async (viewport) => {
      console.log(`Capturing ${viewport.name} (${viewport.width}x${viewport.height})...`);
      
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: formattedUrl,
            formats: ['screenshot'],
            waitFor: 3000,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(`Error capturing ${viewport.name}:`, data);
          return { name: viewport.name, screenshot: null, error: data.error || 'Failed to capture' };
        }

        // Firecrawl returns screenshot in data.data.screenshot or data.screenshot
        const screenshot = data.data?.screenshot || data.screenshot;
        console.log(`Successfully captured ${viewport.name}`);
        
        return { 
          name: viewport.name, 
          screenshot,
          metadata: data.data?.metadata || data.metadata,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error capturing ${viewport.name}:`, errorMessage);
        return { name: viewport.name, screenshot: null, error: errorMessage };
      }
    });

    const results = await Promise.all(capturePromises);

    // Build response object
    const screenshots: Record<string, string | null> = {};
    const errors: Record<string, string> = {};
    let metadata = null;

    for (const result of results) {
      screenshots[result.name] = result.screenshot;
      if (result.error) {
        errors[result.name] = result.error;
      }
      if (result.metadata && !metadata) {
        metadata = result.metadata;
      }
    }

    console.log('All captures complete');

    return new Response(
      JSON.stringify({
        success: true,
        screenshots,
        metadata,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to capture screenshots';
    console.error('Error in capture-screenshots:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
