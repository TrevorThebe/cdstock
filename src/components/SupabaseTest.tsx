'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function SupabaseTest() {
    useEffect(() => {
        supabase
            .from('user_profiles')
            .select('*')
            .limit(1)
            .then(({ data, error }) => {
                console.log('Connection test:', error ? '❌ Failed' : '✅ Success')
                console.log({ data, error })
            })
    }, [])

    return <div>Check browser console for Supabase connection test</div>
}