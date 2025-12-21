-- =====================================================
-- DETRADES DATABASE SCHEMA - COMPLETE RESET
-- =====================================================
-- This script completely resets and rebuilds the database
-- Run ALL of this in Supabase SQL Editor in one go
-- =====================================================

-- =====================================================
-- STEP 1: DROP EVERYTHING (CLEAN SLATE)
-- =====================================================
-- WARNING: This deletes ALL data!
DROP SCHEMA IF EXISTS public CASCADE;

-- Recreate public schema
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- =====================================================
-- STEP 2: PROFILES TABLE
-- =====================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'mentor')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- STEP 3: TRADES TABLE
-- =====================================================
CREATE TABLE public.trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Trade Details
    pair TEXT NOT NULL,
    trade_date DATE NOT NULL DEFAULT CURRENT_DATE,
    result TEXT NOT NULL CHECK (result IN ('Win', 'Lose')),
    rr DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Analysis
    profiling TEXT,
    description TEXT,
    screenshot_url TEXT,
    
    -- Review System
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'needs_improvement')),
    mentor_score INTEGER CHECK (mentor_score >= 1 AND mentor_score <= 5),
    mentor_feedback TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Policies for trades
CREATE POLICY "Users can view all trades" 
    ON public.trades FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert own trades" 
    ON public.trades FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" 
    ON public.trades FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Mentors can update any trade" 
    ON public.trades FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'mentor'
        )
    );

CREATE POLICY "Users can delete own trades" 
    ON public.trades FOR DELETE 
    USING (auth.uid() = user_id);

-- =====================================================
-- STEP 4: INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_trades_user_id ON public.trades(user_id);
CREATE INDEX idx_trades_trade_date ON public.trades(trade_date);
CREATE INDEX idx_trades_status ON public.trades(status);
CREATE INDEX idx_trades_result ON public.trades(result);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);

-- =====================================================
-- STEP 5: TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trades_updated_at
    BEFORE UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- STEP 6: AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 7: STORAGE BUCKET FOR TRADE SCREENSHOTS
-- =====================================================
-- Delete bucket if exists (ignore error if not exists)
DELETE FROM storage.objects WHERE bucket_id = 'trade-screenshots';
DELETE FROM storage.buckets WHERE id = 'trade-screenshots';

-- Create the bucket (public = viewable by anyone)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'trade-screenshots', 
    'trade-screenshots', 
    true,
    5242880,  -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- =====================================================
-- STEP 8: STORAGE POLICIES
-- =====================================================
-- Anyone can view screenshots (public bucket)
CREATE POLICY "Trade screenshots are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'trade-screenshots');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload screenshots"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'trade-screenshots');

-- Users can update their own screenshots
CREATE POLICY "Users can update own screenshots"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own screenshots
CREATE POLICY "Users can delete own screenshots"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- STEP 9: GRANT PERMISSIONS
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- =====================================================
-- DONE! Now create your first user via the app, then:
-- UPDATE public.profiles SET role = 'mentor' WHERE username = 'YOUR_USERNAME';
-- =====================================================
