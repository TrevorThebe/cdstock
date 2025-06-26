import { createClient } from '@supabase/supabase-js';


// Initialize Supabase client
// Using direct values from project configuration
const supabaseUrl = 'https://zvamtuczyfpbmnfmsijm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2YW10dWN6eWZwYm1uZm1zaWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzAwMjcsImV4cCI6MjA2NTUwNjAyN30.WrgBw-staJ1vE6dDPkR8HvL3nQ7Yi5XC3SOgm1odazE';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };
