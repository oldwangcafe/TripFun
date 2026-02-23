-- =============================================
-- TripFund Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TRIPS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  trip_currency TEXT NOT NULL DEFAULT 'JPY',
  settlement_currency TEXT NOT NULL DEFAULT 'TWD',
  initial_fund DECIMAL(14, 2) NOT NULL DEFAULT 0,
  current_fund DECIMAL(14, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange_rate DECIMAL(14, 6),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- TRIP MEMBERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS trip_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nickname TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('creator', 'collaborator', 'member')),
  email TEXT,
  per_person_contribution DECIMAL(14, 2) DEFAULT 0
);

-- =============================================
-- EXPENSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  category TEXT NOT NULL CHECK (category IN ('meals', 'transport', 'shopping', 'other')),
  amount DECIMAL(14, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL DEFAULT '',
  paid_by_member_id UUID REFERENCES trip_members(id) ON DELETE SET NULL,
  note TEXT
);

-- =============================================
-- FUND CONTRIBUTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS fund_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  total_amount DECIMAL(14, 2) NOT NULL CHECK (total_amount > 0),
  contributors JSONB DEFAULT '[]'::jsonb,
  note TEXT
);

-- =============================================
-- TRIP INVITES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS trip_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  invite_token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'collaborator' CHECK (role IN ('collaborator')),
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_used BOOLEAN DEFAULT FALSE
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_invites ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is trip member (creator or collaborator)
CREATE OR REPLACE FUNCTION is_trip_member(trip_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_members.trip_id = $1
    AND trip_members.user_id = $2
    AND trip_members.role IN ('creator', 'collaborator')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- TRIPS POLICIES
CREATE POLICY "Users can view trips they are members of"
  ON trips FOR SELECT
  USING (
    creator_id = auth.uid() OR
    id IN (
      SELECT trip_id FROM trip_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create trips"
  ON trips FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creator and collaborators can update trips"
  ON trips FOR UPDATE
  USING (is_trip_member(id, auth.uid()) OR creator_id = auth.uid());

-- TRIP MEMBERS POLICIES
CREATE POLICY "Members can view trip members"
  ON trip_members FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM trips
      WHERE creator_id = auth.uid()
      OR id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Creator and collaborators can manage members"
  ON trip_members FOR ALL
  USING (is_trip_member(trip_id, auth.uid()) OR
    trip_id IN (SELECT id FROM trips WHERE creator_id = auth.uid()));

CREATE POLICY "Anyone can insert their own member record"
  ON trip_members FOR INSERT
  WITH CHECK (true);

-- EXPENSES POLICIES
CREATE POLICY "Trip members can view expenses"
  ON expenses FOR SELECT
  USING (trip_id IN (
    SELECT tm.trip_id FROM trip_members tm
    WHERE tm.user_id = auth.uid()
  ) OR trip_id IN (
    SELECT id FROM trips WHERE creator_id = auth.uid()
  ));

CREATE POLICY "Trip members can insert expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    recorded_by = auth.uid() AND
    is_trip_member(trip_id, auth.uid())
  );

CREATE POLICY "Trip members can delete expenses"
  ON expenses FOR DELETE
  USING (
    recorded_by = auth.uid() OR
    trip_id IN (SELECT id FROM trips WHERE creator_id = auth.uid())
  );

-- FUND CONTRIBUTIONS POLICIES
CREATE POLICY "Trip members can view contributions"
  ON fund_contributions FOR SELECT
  USING (trip_id IN (
    SELECT tm.trip_id FROM trip_members tm WHERE tm.user_id = auth.uid()
  ) OR trip_id IN (
    SELECT id FROM trips WHERE creator_id = auth.uid()
  ));

CREATE POLICY "Trip members can insert contributions"
  ON fund_contributions FOR INSERT
  WITH CHECK (
    recorded_by = auth.uid() AND
    is_trip_member(trip_id, auth.uid())
  );

-- TRIP INVITES POLICIES
CREATE POLICY "Anyone can view invite by token"
  ON trip_invites FOR SELECT
  USING (true);

CREATE POLICY "Creator can manage invites"
  ON trip_invites FOR ALL
  USING (
    trip_id IN (SELECT id FROM trips WHERE creator_id = auth.uid())
  );

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_trip_members_trip_id ON trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_user_id ON trip_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_fund_contributions_trip_id ON fund_contributions(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_invites_token ON trip_invites(invite_token);

-- =============================================
-- REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE trips;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE fund_contributions;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_members;
