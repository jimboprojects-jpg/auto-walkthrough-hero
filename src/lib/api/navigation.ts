import { supabase } from '@/integrations/supabase/client';

export interface PageCapture {
  url: string;
  screenshot: string | null;
  title?: string;
  description?: string;
  links: string[];
}

export interface NavigationResult {
  success: boolean;
  pages?: PageCapture[];
  metadata?: {
    sourceURL: string;
    totalPages: number;
  };
  error?: string;
}

export async function autoNavigate(url: string, maxPages: number = 5): Promise<NavigationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('auto-navigate', {
      body: { url, maxPages },
    });

    if (error) {
      console.error('Error calling auto-navigate:', error);
      return { success: false, error: error.message };
    }

    return data as NavigationResult;
  } catch (error) {
    console.error('Error during auto-navigation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to auto-navigate',
    };
  }
}
