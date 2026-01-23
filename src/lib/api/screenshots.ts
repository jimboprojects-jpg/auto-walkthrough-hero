import { supabase } from '@/integrations/supabase/client';

export interface ScreenshotResult {
  success: boolean;
  screenshots?: {
    mobile?: string;
    tablet?: string;
    laptop?: string;
    desktop?: string;
  };
  metadata?: {
    title?: string;
    description?: string;
    sourceURL?: string;
  };
  errors?: Record<string, string>;
  error?: string;
}

export async function captureScreenshots(url: string): Promise<ScreenshotResult> {
  try {
    const { data, error } = await supabase.functions.invoke('capture-screenshots', {
      body: { url },
    });

    if (error) {
      console.error('Error calling capture-screenshots:', error);
      return { success: false, error: error.message };
    }

    return data as ScreenshotResult;
  } catch (error) {
    console.error('Error capturing screenshots:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to capture screenshots' 
    };
  }
}
