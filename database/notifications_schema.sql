-- =====================================================
-- NOTIFICATION SYSTEM FOR ALRA CARE
-- =====================================================
-- This schema creates the notification system tables
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User identification (using phone number since we don't have user accounts)
    user_phone VARCHAR(20) NOT NULL,
    
    -- Notification details
    type VARCHAR(50) NOT NULL, -- 'booking_confirmed', 'booking_reminder', 'booking_completed', 'reschedule_approved', 'reschedule_rejected', 'general'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related booking (optional)
    booking_id VARCHAR(50),
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for better query performance
    CONSTRAINT fk_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_notifications_user_phone ON notifications(user_phone);
CREATE INDEX idx_notifications_booking_id ON notifications(booking_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Create composite index for common queries
CREATE INDEX idx_notifications_user_unread ON notifications(user_phone, is_read, is_deleted) WHERE is_deleted = FALSE;

-- Enable Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can view their own notifications (by phone number)
CREATE POLICY "Users can view own notifications"
    ON notifications
    FOR SELECT
    USING (user_phone = current_setting('app.user_phone', TRUE));

-- Policy: Allow service role to insert notifications
CREATE POLICY "Service role can insert notifications"
    ON notifications
    FOR INSERT
    WITH CHECK (TRUE);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON notifications
    FOR UPDATE
    USING (user_phone = current_setting('app.user_phone', TRUE));

-- Policy: Users can soft delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON notifications
    FOR DELETE
    USING (user_phone = current_setting('app.user_phone', TRUE));

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_phone VARCHAR(20),
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_booking_id VARCHAR(50) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (user_phone, type, title, message, booking_id)
    VALUES (p_user_phone, p_type, p_title, p_message, p_booking_id)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_phone VARCHAR(20))
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE user_phone = p_user_phone AND is_read = FALSE AND is_deleted = FALSE;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_count(p_user_phone VARCHAR(20))
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM notifications
    WHERE user_phone = p_user_phone AND is_read = FALSE AND is_deleted = FALSE;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old notifications (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notifications
    SET is_deleted = TRUE
    WHERE created_at < NOW() - INTERVAL '90 days' AND is_deleted = FALSE;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Auto-create notification when booking is confirmed
CREATE OR REPLACE FUNCTION trigger_booking_confirmed_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        PERFORM create_notification(
            NEW.patient_phone,
            'booking_confirmed',
            'Booking Dikonfirmasi',
            'Booking Anda dengan nomor ' || NEW.id || ' telah dikonfirmasi. Tanggal: ' || 
            TO_CHAR(NEW.appointment_datetime, 'DD Mon YYYY') || ' jam ' || NEW.appointment_time,
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_confirmed_notification
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_booking_confirmed_notification();

-- Trigger: Auto-create notification when booking is completed
CREATE OR REPLACE FUNCTION trigger_booking_completed_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        PERFORM create_notification(
            NEW.patient_phone,
            'booking_completed',
            'Perawatan Selesai',
            'Terima kasih telah menggunakan layanan Alra Care. Booking ' || NEW.id || ' telah selesai. Semoga Anda puas dengan layanan kami!',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_completed_notification
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_booking_completed_notification();

-- Trigger: Auto-create notification when booking is rescheduled
CREATE OR REPLACE FUNCTION trigger_booking_rescheduled_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.appointment_datetime != OLD.appointment_datetime AND NEW.status = 'pending' THEN
        PERFORM create_notification(
            NEW.patient_phone,
            'reschedule_approved',
            'Reschedule Berhasil',
            'Booking ' || NEW.id || ' telah di-reschedule. Jadwal baru: ' || 
            TO_CHAR(NEW.appointment_datetime, 'DD Mon YYYY') || ' jam ' || NEW.appointment_time || 
            '. Menunggu konfirmasi dari klinik.',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_rescheduled_notification
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_booking_rescheduled_notification();

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================

-- Insert sample notifications (uncomment to test)
/*
INSERT INTO notifications (user_phone, type, title, message, booking_id) VALUES
('081234567890', 'booking_confirmed', 'Booking Dikonfirmasi', 'Booking Anda dengan nomor BK123 telah dikonfirmasi. Tanggal: 20 Jan 2025 jam 10:00', 'BK123'),
('081234567890', 'booking_reminder', 'Pengingat Booking', 'Pengingat: Anda memiliki appointment besok tanggal 20 Jan 2025 jam 10:00 di Alra Care.', 'BK123'),
('081234567890', 'general', 'Promo Spesial', 'Dapatkan diskon 20% untuk perawatan kecantikan di bulan Januari!', NULL);
*/

-- =====================================================
-- CLEANUP (if needed)
-- =====================================================

-- To drop all notification-related objects (use with caution):
/*
DROP TRIGGER IF EXISTS booking_confirmed_notification ON bookings;
DROP TRIGGER IF EXISTS booking_completed_notification ON bookings;
DROP TRIGGER IF EXISTS booking_rescheduled_notification ON bookings;
DROP FUNCTION IF EXISTS trigger_booking_confirmed_notification();
DROP FUNCTION IF EXISTS trigger_booking_completed_notification();
DROP FUNCTION IF EXISTS trigger_booking_rescheduled_notification();
DROP FUNCTION IF EXISTS create_notification(VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR);
DROP FUNCTION IF EXISTS mark_notification_read(UUID);
DROP FUNCTION IF EXISTS mark_all_notifications_read(VARCHAR);
DROP FUNCTION IF EXISTS get_unread_count(VARCHAR);
DROP FUNCTION IF EXISTS cleanup_old_notifications();
DROP TABLE IF EXISTS notifications CASCADE;
*/

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Run this script in Supabase SQL Editor
-- 2. Make sure bookings table exists before running this
-- 3. Triggers will automatically create notifications for:
--    - Booking confirmed
--    - Booking completed
--    - Booking rescheduled
-- 4. Use create_notification() function to manually create notifications
-- 5. Use cleanup_old_notifications() to clean up notifications older than 90 days
-- 6. RLS policies ensure users can only see their own notifications