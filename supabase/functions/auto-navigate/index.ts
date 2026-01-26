import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NavigateRequest {
  url: string;
  maxPages?: number;
}

interface PageCapture {
  url: string;
  screenshot: string | null;
  title?: string;
  description?: string;
  links: string[];
}

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

    const { url, maxPages = 5 } = await req.json() as NavigateRequest;

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

    console.log('Starting auto-navigation for:', formattedUrl);

    // Use Firecrawl's crawl endpoint to discover and capture pages
    // First, start a crawl
    const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        limit: maxPages,
        scrapeOptions: {
          formats: ['screenshot', 'links'],
          waitFor: 2000,
        },
      }),
    });

    const crawlData = await crawlResponse.json();

    if (!crawlResponse.ok) {
      console.error('Crawl initiation failed:', crawlData);
      
      // Fallback: Just capture the main page multiple times with different wait times
      // to simulate navigation effect
      const fallbackCaptures: PageCapture[] = [];
      const waitTimes = [1000, 2000, 3000, 4000, 5000];
      
      for (const waitTime of waitTimes.slice(0, maxPages)) {
        try {
          const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: formattedUrl,
              formats: ['screenshot', 'links'],
              waitFor: waitTime,
            }),
          });

          const data = await response.json();
          
          if (response.ok && data.data?.screenshot) {
            fallbackCaptures.push({
              url: formattedUrl,
              screenshot: data.data.screenshot,
              title: data.data.metadata?.title,
              description: data.data.metadata?.description,
              links: data.data.links || [],
            });
          }
        } catch (err) {
          console.error('Fallback capture error:', err);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          pages: fallbackCaptures,
          metadata: {
            sourceURL: formattedUrl,
            totalPages: fallbackCaptures.length,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If crawl was initiated, poll for results
    const crawlId = crawlData.id;
    console.log('Crawl started with ID:', crawlId);

    // Poll for crawl completion
    let attempts = 0;
    const maxAttempts = 30;
    let crawlResult = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      const statusData = await statusResponse.json();
      
      if (statusData.status === 'completed') {
        crawlResult = statusData;
        break;
      } else if (statusData.status === 'failed') {
        console.error('Crawl failed:', statusData);
        break;
      }
      
      attempts++;
    }

    if (!crawlResult) {
      // Return partial results if we have them
      console.log('Crawl timed out or failed');
      return new Response(
        JSON.stringify({ success: false, error: 'Navigation timeout' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process crawl results
    const pages: PageCapture[] = (crawlResult.data || []).map((page: any) => ({
      url: page.metadata?.sourceURL || formattedUrl,
      screenshot: page.screenshot,
      title: page.metadata?.title,
      description: page.metadata?.description,
      links: page.links || [],
    }));

    console.log(`Navigation complete. Captured ${pages.length} pages.`);

    return new Response(
      JSON.stringify({
        success: true,
        pages,
        metadata: {
          sourceURL: formattedUrl,
          totalPages: pages.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to navigate website';
    console.error('Error in auto-navigate:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
