-- ==========================================
-- DETRADES JOURNAL - DATABASE SETUP SCRIPT
-- ==========================================
-- Run this script in Supabase Dashboard > SQL Editor
-- This will create all tables, enums, and RLS policies

-- 1. DROP EXISTING (if re-running)
DROP TABLE IF EXISTS public.trades CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS session_type CASCADE;
DROP TYPE IF EXISTS bias_type CASCADE;
DROP TYPE IF EXISTS bias_daily_type CASCADE;
DROP TYPE IF EXISTS framework_type CASCADE;
DROP TYPE IF EXISTS profiling_type CASCADE;
DROP TYPE IF EXISTS entry_model_type CASCADE;
DROP TYPE IF EXISTS result_type CASCADE;
DROP TYPE IF EXISTS mood_type CASCADE;
DROP TYPE IF EXISTS trade_status CASCADE;
DROP TYPE IF EXISTS pair_type CASCADE;

-- 2. CREATE ENUMS (Untuk data konsisten & tidak ada typo)
CREATE TYPE session_type AS ENUM ('London', 'New York');
CREATE TYPE bias_type AS ENUM ('Bullish', 'Bearish');
CREATE TYPE bias_daily_type AS ENUM ('DNT', 'DCM', 'DFM', 'DCC', 'DRM');
CREATE TYPE framework_type AS ENUM ('IRL to ERL', 'OPR', 'OB to Liq', 'ERL to IRL');
CREATE TYPE profiling_type AS ENUM ('6AM Reversal', '6AM Continuation', '10AM Reversal', '10AM Continuation');
CREATE TYPE entry_model_type AS ENUM (
  'Entry Model 1 (DNT)', 'Entry Model 2 (DNT)', 'Entry Model 3 (DNT)',
  'Entry Model 1 (DCM)', 'Entry Model 2 (DCM)'
);
CREATE TYPE result_type AS ENUM ('Win', 'Lose');
CREATE TYPE mood_type AS ENUM ('Calm', 'Anxious', 'Greedy', 'Fear', 'Bored', 'Revenge');
CREATE TYPE trade_status AS ENUM ('submitted', 'revision');
CREATE TYPE pair_type AS ENUM ('NQ', 'ES', 'YM', 'EU', 'GU', 'XAU');

-- 3. CREATE PROFILES TABLE (Role Management)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE,
  role text DEFAULT 'member' CHECK (role IN ('member', 'mentor')),
  created_at timestamptz DEFAULT now()
);

-- 4. CREATE TRADES TABLE (Tabel Utama)
CREATE TABLE public.trades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  -- Data Input Member
  trade_date date NOT NULL,
  session session_type NOT NULL,
  pair pair_type NOT NULL,
  bias bias_type NOT NULL,
  bias_daily bias_daily_type NOT NULL,
  framework framework_type NOT NULL,
  profiling profiling_type NOT NULL,
  entry_model entry_model_type NOT NULL,
  result result_type NOT NULL,
  rr numeric(5, 2) NOT NULL, -- Contoh: 4.50 atau -1.00
  mood mood_type NOT NULL,
  image_url text NOT NULL, -- Mandatory Image
  description text,
  tags text[], -- Array of strings untuk tagging custom
  
  -- Data Status & Mentor Review
  status trade_status DEFAULT 'submitted',
  mentor_score integer CHECK (mentor_score >= 1 AND mentor_score <= 5),
  mentor_notes text,
  is_reviewed boolean DEFAULT false
);

-- 5. CREATE FUNCTION untuk auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (new.id, new.raw_user_meta_data->>'username', 'member');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CREATE TRIGGER untuk auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES untuk Profiles
-- Semua authenticated user bisa lihat semua profiles (untuk leaderboard)
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- User bisa update profilenya sendiri
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- User bisa insert profile sendiri (untuk edge case)
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 9. RLS POLICIES untuk Trades
-- Semua authenticated user bisa lihat semua trades (transparansi tim)
CREATE POLICY "Trades are viewable by authenticated users"
ON public.trades FOR SELECT
TO authenticated
USING (true);

-- User hanya bisa insert trade miliknya sendiri
CREATE POLICY "Users can insert own trades"
ON public.trades FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- User bisa update trade sendiri (untuk edit saat revision atau mentor update)
CREATE POLICY "Users can update own trades"
ON public.trades FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'mentor'
));

-- 10. CREATE STORAGE BUCKET untuk images
-- Jalankan ini di Dashboard > Storage > Create Bucket
-- Nama: trade-images
-- Public: Yes

-- 11. STORAGE POLICIES (jalankan setelah bucket dibuat)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('trade-images', 'trade-images', true);

-- CREATE POLICY "Authenticated users can upload images"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'trade-images');

-- CREATE POLICY "Anyone can view trade images"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'trade-images');

-- ==========================================
-- SETUP COMPLETE!
-- ==========================================
-- Next steps:
-- 1. Go to Storage and create 'trade-images' bucket (public)
-- 2. Create your first user via Supabase Auth
-- 3. Update their role to 'mentor' if needed:
--    UPDATE profiles SET role = 'mentor' WHERE id = 'user-uuid-here';
