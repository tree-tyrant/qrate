/* Key-Value Store for Supabase
 * Provides persistent storage fallback when SQLite is not available
 * 
 * Table schema (create in Supabase SQL Editor):
 * CREATE TABLE kv_store_6d46752d (
 *   key TEXT NOT NULL PRIMARY KEY,
 *   value JSONB NOT NULL
 * );
 */

import { createClient } from "@supabase/supabase-js";

// Use environment variables (set in Supabase Edge Functions secrets)
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

// Fallback to service role key if anon key not available (for edge functions)
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || supabaseKey;

const client = () => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase credentials not configured - KV store will not work');
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey || supabaseKey);
};

// Set stores a key-value pair in the database.
export const set = async (key: string, value: any): Promise<void> => {
  const supabase = client();
  if (!supabase) {
    console.warn('KV store not available - skipping set operation');
    return;
  }
  
  const { error } = await supabase.from("kv_store_6d46752d").upsert({
    key,
    value
  });
  
  if (error) {
    console.error('KV store set error:', error);
    throw new Error(error.message);
  }
};

// Get retrieves a key-value pair from the database.
export const get = async (key: string): Promise<any> => {
  const supabase = client();
  if (!supabase) {
    console.warn('KV store not available - returning null');
    return null;
  }
  
  const { data, error } = await supabase
    .from("kv_store_6d46752d")
    .select("value")
    .eq("key", key)
    .maybeSingle();
    
  if (error) {
    console.error('KV store get error:', error);
    throw new Error(error.message);
  }
  
  return data?.value;
};

// Delete deletes a key-value pair from the database.
export const del = async (key: string): Promise<void> => {
  const supabase = client();
  if (!supabase) {
    console.warn('KV store not available - skipping delete operation');
    return;
  }
  
  const { error } = await supabase
    .from("kv_store_6d46752d")
    .delete()
    .eq("key", key);
    
  if (error) {
    console.error('KV store delete error:', error);
    throw new Error(error.message);
  }
};

// Sets multiple key-value pairs in the database.
export const mset = async (keys: string[], values: any[]): Promise<void> => {
  const supabase = client();
  if (!supabase) {
    console.warn('KV store not available - skipping mset operation');
    return;
  }
  
  if (keys.length !== values.length) {
    throw new Error('Keys and values arrays must have the same length');
  }
  
  const { error } = await supabase
    .from("kv_store_6d46752d")
    .upsert(keys.map((k, i) => ({ key: k, value: values[i] })));
    
  if (error) {
    console.error('KV store mset error:', error);
    throw new Error(error.message);
  }
};

// Gets multiple key-value pairs from the database.
export const mget = async (keys: string[]): Promise<any[]> => {
  const supabase = client();
  if (!supabase) {
    console.warn('KV store not available - returning empty array');
    return [];
  }
  
  const { data, error } = await supabase
    .from("kv_store_6d46752d")
    .select("value")
    .in("key", keys);
    
  if (error) {
    console.error('KV store mget error:', error);
    throw new Error(error.message);
  }
  
  return data?.map((d) => d.value) ?? [];
};

// Deletes multiple key-value pairs from the database.
export const mdel = async (keys: string[]): Promise<void> => {
  const supabase = client();
  if (!supabase) {
    console.warn('KV store not available - skipping mdel operation');
    return;
  }
  
  const { error } = await supabase
    .from("kv_store_6d46752d")
    .delete()
    .in("key", keys);
    
  if (error) {
    console.error('KV store mdel error:', error);
    throw new Error(error.message);
  }
};

// Search for key-value pairs by prefix.
export const getByPrefix = async (prefix: string): Promise<any[]> => {
  const supabase = client();
  if (!supabase) {
    console.warn('KV store not available - returning empty array');
    return [];
  }
  
  const { data, error } = await supabase
    .from("kv_store_6d46752d")
    .select("key, value")
    .like("key", prefix + "%");
    
  if (error) {
    console.error('KV store getByPrefix error:', error);
    throw new Error(error.message);
  }
  
  return data?.map((d) => d.value) ?? [];
};







