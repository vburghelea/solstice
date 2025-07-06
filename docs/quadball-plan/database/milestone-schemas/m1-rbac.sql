-- Milestone 1: Core Data Model & RBAC Schema
-- This file contains the database schema changes for Milestone 1

-- ==============================================
-- USER ROLES TABLE
-- ==============================================
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    scope VARCHAR(100) DEFAULT 'global',
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_roles
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_scope ON user_roles(scope);
CREATE INDEX idx_user_roles_expires_at ON user_roles(expires_at);

-- Unique constraint to prevent duplicate role assignments
CREATE UNIQUE INDEX idx_user_roles_unique ON user_roles(user_id, role, scope) 
WHERE expires_at IS NULL;

-- ==============================================
-- USER TAGS TABLE
-- ==============================================
CREATE TABLE user_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    value VARCHAR(255),
    applied_by UUID REFERENCES users(id),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_tags
CREATE INDEX idx_user_tags_user_id ON user_tags(user_id);
CREATE INDEX idx_user_tags_tag ON user_tags(tag);
CREATE INDEX idx_user_tags_applied_by ON user_tags(applied_by);

-- Unique constraint to prevent duplicate tag assignments
CREATE UNIQUE INDEX idx_user_tags_unique ON user_tags(user_id, tag);

-- ==============================================
-- MEMBERSHIP TYPES TABLE
-- ==============================================
CREATE TABLE membership_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL,
    valid_from_date DATE NOT NULL,
    valid_to_date DATE NOT NULL,
    active BOOLEAN DEFAULT true,
    benefits JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for membership_types
CREATE INDEX idx_membership_types_active ON membership_types(active);
CREATE INDEX idx_membership_types_valid_dates ON membership_types(valid_from_date, valid_to_date);

-- ==============================================
-- MEMBERSHIPS TABLE
-- ==============================================
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    membership_type_id UUID NOT NULL REFERENCES membership_types(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_amount_cents INTEGER NOT NULL,
    payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for memberships
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_memberships_expires_at ON memberships(expires_at);
CREATE INDEX idx_memberships_payment_id ON memberships(payment_id);

-- ==============================================
-- TEAMS TABLE
-- ==============================================
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo VARCHAR(255),
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    founded_year INTEGER,
    location VARCHAR(255),
    max_roster_size INTEGER DEFAULT 25,
    associated_team_id UUID REFERENCES teams(id),
    association_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for teams
CREATE INDEX idx_teams_slug ON teams(slug);
CREATE INDEX idx_teams_is_active ON teams(is_active);
CREATE INDEX idx_teams_created_by ON teams(created_by);

-- ==============================================
-- TEAM MEMBERS TABLE
-- ==============================================
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'player',
    jersey_number INTEGER,
    position VARCHAR(50),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for team_members
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_status ON team_members(status);

-- Constraint: Users can only be on one active team at a time
CREATE UNIQUE INDEX idx_one_team_per_user ON team_members(user_id) 
WHERE status = 'active';

-- Constraint to prevent duplicate jersey numbers within a team
CREATE UNIQUE INDEX idx_team_members_jersey_unique ON team_members(team_id, jersey_number) 
WHERE jersey_number IS NOT NULL AND status = 'active';

-- ==============================================
-- AUDIT LOGS TABLE
-- ==============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit_logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ==============================================
-- CONSTANTS/ENUMS
-- ==============================================

-- Role hierarchy (documented for application logic)
-- global_admin (highest)
-- ├── event_coordinator
-- │   └── team_lead
-- │       └── player
-- └── referee
--     └── volunteer

-- Valid role values
-- 'global_admin', 'event_coordinator', 'team_lead', 'player', 'referee', 'volunteer'

-- Valid membership statuses
-- 'pending', 'active', 'expired', 'cancelled', 'refunded'

-- Valid team member roles
-- 'player', 'coach', 'manager', 'captain'

-- Valid team member positions
-- 'chaser', 'beater', 'keeper', 'seeker'

-- Valid team member statuses
-- 'active', 'inactive', 'traded', 'released'

-- Common user tags
-- 'early_bird', 'veteran', 'student', 'volunteer', 'referee', 'coach'

-- ==============================================
-- SEED DATA
-- ==============================================

-- Create default membership types
INSERT INTO membership_types (name, description, price_cents, valid_from_date, valid_to_date) VALUES
('Adult Full Contact', 'Full contact quadball for adults', 5000, '2025-01-01', '2026-12-31'),
('Adult Low Contact', 'Low contact quadball for adults', 4000, '2025-01-01', '2026-12-31'),
('Youth', 'Youth membership (under 18)', 3000, '2025-01-01', '2026-12-31'),
('Referee', 'Referee certification and membership', 3500, '2025-01-01', '2026-12-31'),
('Team Canada-only', 'For Team Canada players in international leagues', 2000, '2025-01-01', '2026-12-31');

-- ==============================================
-- FUNCTIONS & TRIGGERS
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_membership_types_updated_at BEFORE UPDATE ON membership_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to audit sensitive changes
CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
        VALUES (
            COALESCE(NEW.created_by, NEW.user_id),
            'INSERT',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
        VALUES (
            COALESCE(NEW.updated_by, NEW.user_id),
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id,
            jsonb_build_object(
                'old', to_jsonb(OLD),
                'new', to_jsonb(NEW)
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
        VALUES (
            OLD.user_id,
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            to_jsonb(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Audit triggers for sensitive tables
CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION audit_changes();

CREATE TRIGGER audit_memberships AFTER INSERT OR UPDATE OR DELETE ON memberships
    FOR EACH ROW EXECUTE FUNCTION audit_changes();

CREATE TRIGGER audit_team_members AFTER INSERT OR UPDATE OR DELETE ON team_members
    FOR EACH ROW EXECUTE FUNCTION audit_changes();

-- ==============================================
-- COMMENTS
-- ==============================================

COMMENT ON TABLE user_roles IS 'Role-based access control for users';
COMMENT ON TABLE user_tags IS 'Flexible tagging system for users';
COMMENT ON TABLE membership_types IS 'Available membership products';
COMMENT ON TABLE memberships IS 'User membership purchases';
COMMENT ON TABLE teams IS 'Team/organization entities';
COMMENT ON TABLE team_members IS 'Team roster management';
COMMENT ON TABLE audit_logs IS 'Audit trail for sensitive operations';

COMMENT ON COLUMN user_roles.scope IS 'Permission scope: global, team:uuid, event:uuid';
COMMENT ON COLUMN user_roles.expires_at IS 'NULL means permanent role';
COMMENT ON COLUMN user_tags.value IS 'Optional value for parameterized tags';
COMMENT ON COLUMN memberships.status IS 'pending, active, expired, cancelled, refunded';
COMMENT ON COLUMN team_members.position IS 'chaser, beater, keeper, seeker';
COMMENT ON COLUMN team_members.status IS 'active, inactive, traded, released';
COMMENT ON COLUMN teams.associated_team_id IS 'Link to associated team (A/B teams, partners)';
COMMENT ON COLUMN teams.association_type IS 'Type of association: a_b_team, partner, etc.';