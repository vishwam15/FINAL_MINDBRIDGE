-- ============================================================
-- Migration: Create NOTIFICATION Table
-- ============================================================

CREATE TABLE IF NOT EXISTS notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_role ENUM('student', 'counselor', 'admin') NOT NULL,
    message TEXT NOT NULL,
    type ENUM('appointment', 'assessment', 'system') DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster retrieval of unread notifications for a specific user
CREATE INDEX idx_user_unread ON notification(user_id, user_role, is_read);
