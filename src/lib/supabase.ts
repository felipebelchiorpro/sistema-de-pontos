// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;
let initializationError: string | null = null;

function getSupabaseConfig(): { url: string | null; anonKey: string | null; error: string | null } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const missingVars = [];
    if (!url) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!anonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return {
      url: null,
      anonKey: null,
      error: `Configuração do Supabase incompleta. As seguintes variáveis de ambiente não foram encontradas: ${missingVars.join(', ')}. Verifique suas configurações na Vercel ou no arquivo .env.local.`
    };
  }

  return { url, anonKey, error: null };
}

// Initialize on module load
const { url, anonKey, error } = getSupabaseConfig();
if (url && anonKey) {
  try {
    supabase = createClient(url, anonKey);
  } catch (e: any) {
    console.error('Supabase initialization error:', e.message);
    initializationError = `Falha ao inicializar o Supabase: ${e.message}`;
  }
} else {
  initializationError = error;
}

/**
 * Gets the Supabase client instance.
 * @returns An object with the Supabase client instance or an error message.
 */
export const getSupabase = (): { supabase: SupabaseClient | null; error: string | null } => {
  if (initializationError) {
    return { supabase: null, error: initializationError };
  }
  if (!supabase) {
    return {
      supabase: null,
      error: "A conexão com o Supabase não foi inicializada por um motivo desconhecido. Verifique os logs do servidor."
    };
  }
  return { supabase, error: null };
};
