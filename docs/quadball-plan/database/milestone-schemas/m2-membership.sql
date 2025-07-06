-- Milestone 2: User Profile & Membership Purchase Flow Schema
-- This file contains the database schema changes for Milestone 2

-- ==============================================
-- USER PROFILE EXTENSIONS
-- ==============================================

-- Add profile fields to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS pronouns VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS name_pronunciation VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS demographics JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP WITH TIME ZONE;

-- Add index for profile completion queries
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);

-- ==============================================
-- PAYMENTS TABLE
-- ==============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'CAD',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    provider_id VARCHAR(50) NOT NULL,
    provider_payment_id VARCHAR(255),
    provider_order_id VARCHAR(255),
    checkout_url VARCHAR(500),
    receipt_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for payments
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider_payment_id ON payments(provider_payment_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- ==============================================
-- PAYMENT ITEMS TABLE
-- ==============================================
CREATE TABLE payment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,
    item_id UUID,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price_cents INTEGER NOT NULL,
    total_price_cents INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for payment_items
CREATE INDEX idx_payment_items_payment_id ON payment_items(payment_id);
CREATE INDEX idx_payment_items_item_type ON payment_items(item_type);
CREATE INDEX idx_payment_items_item_id ON payment_items(item_id);

-- ==============================================
-- PRICING RULES TABLE (for future flexibility)
-- ==============================================
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL,
    conditions JSONB NOT NULL DEFAULT '{}',
    action_type VARCHAR(50) NOT NULL,
    action_value INTEGER NOT NULL,
    priority INTEGER DEFAULT 100,
    active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for pricing_rules
CREATE INDEX idx_pricing_rules_rule_type ON pricing_rules(rule_type);
CREATE INDEX idx_pricing_rules_active ON pricing_rules(active);
CREATE INDEX idx_pricing_rules_valid_dates ON pricing_rules(valid_from, valid_to);

-- ==============================================
-- SHOPPING CART TABLE (for multi-item purchases)
-- ==============================================
CREATE TABLE shopping_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for shopping_carts
CREATE INDEX idx_shopping_carts_user_id ON shopping_carts(user_id);
CREATE INDEX idx_shopping_carts_status ON shopping_carts(status);
CREATE INDEX idx_shopping_carts_expires_at ON shopping_carts(expires_at);

-- ==============================================
-- CART ITEMS TABLE
-- ==============================================
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,
    item_id UUID NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price_cents INTEGER NOT NULL,
    total_price_cents INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for cart_items
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_item_type ON cart_items(item_type);
CREATE INDEX idx_cart_items_item_id ON cart_items(item_id);

-- Unique constraint to prevent duplicate items in cart
CREATE UNIQUE INDEX idx_cart_items_unique ON cart_items(cart_id, item_type, item_id);

-- ==============================================
-- WEBHOOK EVENTS TABLE (for processing async events)
-- ==============================================
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255),
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for webhook_events
CREATE INDEX idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);

-- ==============================================
-- FUNCTIONS & TRIGGERS
-- ==============================================

-- Function to calculate cart total
CREATE OR REPLACE FUNCTION calculate_cart_total(cart_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total INTEGER DEFAULT 0;
BEGIN
    SELECT COALESCE(SUM(total_price_cents), 0)
    INTO total
    FROM cart_items
    WHERE cart_id = cart_uuid;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-expire carts
CREATE OR REPLACE FUNCTION expire_abandoned_carts()
RETURNS void AS $$
BEGIN
    UPDATE shopping_carts
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'active'
      AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update cart item total when quantity changes
CREATE OR REPLACE FUNCTION update_cart_item_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_price_cents = NEW.quantity * NEW.unit_price_cents;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for cart item total calculation
CREATE TRIGGER calculate_cart_item_total 
    BEFORE INSERT OR UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_cart_item_total();

-- Function to update profile completion status
CREATE OR REPLACE FUNCTION check_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if all required fields are filled
    IF NEW.name IS NOT NULL 
       AND NEW.email IS NOT NULL 
       AND NEW.birth_date IS NOT NULL 
       AND NEW.phone IS NOT NULL 
       AND NEW.emergency_contact IS NOT NULL 
       AND NEW.emergency_contact != '{}' THEN
        
        -- Mark profile as completed if not already
        IF NEW.profile_completed = false THEN
            NEW.profile_completed = true;
            NEW.profile_completed_at = NOW();
        END IF;
    ELSE
        NEW.profile_completed = false;
        NEW.profile_completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profile completion
CREATE TRIGGER check_profile_completion_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION check_profile_completion();

-- Update triggers for updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON pricing_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_carts_updated_at BEFORE UPDATE ON shopping_carts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_events_updated_at BEFORE UPDATE ON webhook_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- MEMBERSHIP PURCHASE FLOW VIEWS
-- ==============================================

-- View for active memberships with user info
CREATE VIEW active_memberships AS
SELECT 
    m.*,
    u.name as user_name,
    u.email as user_email,
    mt.name as membership_type_name,
    mt.description as membership_type_description
FROM memberships m
JOIN users u ON m.user_id = u.id
JOIN membership_types mt ON m.membership_type_id = mt.id
WHERE m.status = 'active'
  AND m.expires_at > NOW();

-- View for payment summary
CREATE VIEW payment_summary AS
SELECT 
    p.*,
    u.name as user_name,
    u.email as user_email,
    COALESCE(SUM(pi.total_price_cents), 0) as calculated_total
FROM payments p
JOIN users u ON p.user_id = u.id
LEFT JOIN payment_items pi ON p.id = pi.payment_id
GROUP BY p.id, u.name, u.email;

-- ==============================================
-- CONSTANTS & ENUMS
-- ==============================================

-- Payment statuses
-- 'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'

-- Payment methods
-- 'card', 'bank_transfer', 'paypal', 'apple_pay', 'google_pay'

-- Payment providers
-- 'square', 'stripe', 'paypal'

-- Item types
-- 'membership', 'event_fee', 'merchandise', 'donation'

-- Cart statuses
-- 'active', 'checkout', 'completed', 'expired', 'abandoned'

-- Webhook event statuses
-- 'pending', 'processing', 'completed', 'failed', 'cancelled'

-- Pricing rule types
-- 'discount', 'fee', 'tax', 'early_bird', 'bulk_discount'

-- Pricing rule actions
-- 'percentage', 'fixed_amount', 'free', 'multiply'

-- ==============================================
-- DISCOUNT CODES TABLE
-- ==============================================
CREATE TABLE discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    amount_cents INTEGER NOT NULL,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_to TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for discount_codes
CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(active);
CREATE INDEX idx_discount_codes_valid_dates ON discount_codes(valid_from, valid_to);

-- Update trigger for discount_codes
CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON discount_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- SAMPLE DISCOUNT CODES
-- ==============================================

-- Sample discount codes (admin-created)
INSERT INTO discount_codes (code, amount_cents, max_uses, created_by, valid_from, valid_to) VALUES
('WELCOME10', 1000, 100, NULL, '2025-01-01', '2025-12-31'),
('MEMBER25', 2500, 50, NULL, '2025-01-01', '2025-06-30');

-- ==============================================
-- COMMENTS
-- ==============================================

COMMENT ON TABLE payments IS 'Payment transactions from external providers';
COMMENT ON TABLE payment_items IS 'Line items for each payment transaction';
COMMENT ON TABLE pricing_rules IS 'Flexible pricing rules for discounts and fees';
COMMENT ON TABLE discount_codes IS 'Admin-created discount codes for fixed amount off';
COMMENT ON TABLE shopping_carts IS 'Shopping cart sessions for users';
COMMENT ON TABLE cart_items IS 'Items in shopping carts';
COMMENT ON TABLE webhook_events IS 'Async events from payment providers';

COMMENT ON COLUMN payments.provider_payment_id IS 'External payment ID from provider';
COMMENT ON COLUMN payments.provider_order_id IS 'External order ID from provider';
COMMENT ON COLUMN payments.checkout_url IS 'URL to redirect user for payment';
COMMENT ON COLUMN payments.receipt_url IS 'URL to payment receipt';
COMMENT ON COLUMN pricing_rules.conditions IS 'JSON conditions for rule application';
COMMENT ON COLUMN pricing_rules.action_value IS 'Value for action (percentage or cents)';
COMMENT ON COLUMN cart_items.metadata IS 'Additional item configuration';
COMMENT ON COLUMN webhook_events.retry_count IS 'Number of processing attempts';
COMMENT ON COLUMN discount_codes.amount_cents IS 'Fixed dollar amount off in cents';
COMMENT ON COLUMN discount_codes.current_uses IS 'How many times code has been used';

-- ==============================================
-- PERMISSIONS & SECURITY
-- ==============================================

-- Only payment processors should access webhook_events
-- Only users should access their own cart data
-- Only admins should access pricing_rules

-- Example row-level security (to be implemented)
-- ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY cart_owner_policy ON shopping_carts FOR ALL USING (user_id = auth.uid());

-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY payment_owner_policy ON payments FOR ALL USING (user_id = auth.uid());