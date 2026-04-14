-- Migration 003: Add counselor_note column to appointment table
ALTER TABLE appointment
ADD COLUMN counselor_note TEXT NULL AFTER mode;
