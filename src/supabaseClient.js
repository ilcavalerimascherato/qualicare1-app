import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ibgbejvqujgiovxnhsuz.supabase.co"
const supabaseKey = 'sb_publishable_R58dnnB-Dki55JVYLmqLrA_3SIX4nof'

export const supabase = createClient(supabaseUrl, supabaseKey)