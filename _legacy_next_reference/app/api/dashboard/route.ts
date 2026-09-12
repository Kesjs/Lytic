import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  try {
    const [brandsRes, runsRes, questionsRes, competitorsRes, opportunitiesRes] = await Promise.all([
      supabaseAdmin.from('brands').select('*').limit(5),
      supabaseAdmin.from('measurement_runs').select('*').order('created_at', { ascending: false }).limit(10),
      supabaseAdmin.from('questions').select('*').limit(10),
      supabaseAdmin.from('competitors').select('*').limit(10),
      supabaseAdmin.from('opportunities').select('*').limit(10),
    ])

    const hasPermissionError = !!(brandsRes.error && brandsRes.error.code === '42501')

    return NextResponse.json({
      connected: true,
      tablesAccessible: !hasPermissionError,
      brands: brandsRes.data || [],
      runs: runsRes.data || [],
      questions: questionsRes.data || [],
      competitors: competitorsRes.data || [],
      opportunities: opportunitiesRes.data || [],
      error: brandsRes.error ? brandsRes.error.message : null,
      errorHint: brandsRes.error?.hint || null,
    })
  } catch (err) {
    return NextResponse.json({
      connected: false,
      tablesAccessible: false,
      error: err && err.message,
    })
  }
}
