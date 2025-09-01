-- Enable Row Level Security (RLS) for the courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own courses
CREATE POLICY "Users can view own courses" ON courses
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy: Users can insert their own courses
CREATE POLICY "Users can insert own courses" ON courses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own courses
CREATE POLICY "Users can update own courses" ON courses
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy: Users can delete their own courses
CREATE POLICY "Users can delete own courses" ON courses
    FOR DELETE USING (auth.uid() = user_id);

-- Create policy: Users can only see courses they own
CREATE POLICY "Users can only access own courses" ON courses
    FOR ALL USING (auth.uid() = user_id);

-- Ensure the user_id column is properly set on insert
-- This trigger will automatically set user_id to the authenticated user's ID
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set user_id
CREATE TRIGGER set_user_id_trigger
    BEFORE INSERT ON courses
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON courses TO authenticated;

-- Revoke permissions from anonymous users
REVOKE ALL ON courses FROM anon;

-- Ensure the courses table has the correct structure
-- Add any missing columns if they don't exist
DO $$ 
BEGIN
    -- Add archived column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'archived') THEN
        ALTER TABLE courses ADD COLUMN archived BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'created_at') THEN
        ALTER TABLE courses ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'updated_at') THEN
        ALTER TABLE courses ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'user_id') THEN
        ALTER TABLE courses ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);
CREATE INDEX IF NOT EXISTS idx_courses_archived ON courses(archived);

-- Add comments for documentation
COMMENT ON TABLE courses IS 'Courses table with Row Level Security enabled';
COMMENT ON COLUMN courses.user_id IS 'Foreign key to auth.users, automatically set by trigger';
COMMENT ON COLUMN courses.created_at IS 'Timestamp when the course was created';
COMMENT ON COLUMN courses.updated_at IS 'Timestamp when the course was last updated, automatically updated by trigger';
COMMENT ON COLUMN courses.archived IS 'Whether the course is archived (soft delete)';
