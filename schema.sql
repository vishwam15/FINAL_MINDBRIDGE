-- ============================================================
-- MindBridge Mental Health System — COMPLETE DATABASE SCRIPT
-- Fixed & Verified: All tables, indexes, seed data, constraints
-- Run this on a fresh MySQL 8.x / MariaDB 10.x instance
-- ============================================================

CREATE DATABASE IF NOT EXISTS mental_health_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE mental_health_db;

-- Disable FK checks so tables can be created in any order
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- TABLE 1: administrator
-- ============================================================
CREATE TABLE IF NOT EXISTS administrator (
    admin_id    INT          AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 2: counselor
-- ============================================================
CREATE TABLE IF NOT EXISTS counselor (
    counselor_id    INT          AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    qualification   VARCHAR(100) NOT NULL,
    specialization  VARCHAR(100),
    experience      VARCHAR(50),
    contact_no      VARCHAR(15),
    email           VARCHAR(100) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 3: college
-- ============================================================
CREATE TABLE IF NOT EXISTS college (
    college_id                  INT          AUTO_INCREMENT PRIMARY KEY,
    college_name                VARCHAR(100) NOT NULL UNIQUE,
    location                    VARCHAR(100),
    address                     VARCHAR(255),
    contact_number              VARCHAR(15),
    email                       VARCHAR(100),
    website                     VARCHAR(255),
    principal_name              VARCHAR(50),
    principal_email             VARCHAR(100),
    established_year            INT,
    counseling_center_phone     VARCHAR(15),
    counseling_center_email     VARCHAR(100),
    created_at                  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 4: college_config  (branding per college)
-- ============================================================
CREATE TABLE IF NOT EXISTS college_config (
    config_id           INT          AUTO_INCREMENT PRIMARY KEY,
    college_id          INT          NOT NULL UNIQUE,
    primary_color       VARCHAR(7)   DEFAULT '#2c3e50',
    secondary_color     VARCHAR(7)   DEFAULT '#3498db',
    logo_url            VARCHAR(255),
    banner_url          VARCHAR(255),
    custom_header_text  VARCHAR(255),
    is_active           BOOLEAN      DEFAULT TRUE,
    CONSTRAINT fk_cc_college FOREIGN KEY (college_id)
        REFERENCES college(college_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 5: department
-- ============================================================
CREATE TABLE IF NOT EXISTS department (
    department_id    INT          AUTO_INCREMENT PRIMARY KEY,
    college_id       INT          NOT NULL,
    dept_name        VARCHAR(100) NOT NULL,
    dept_code        VARCHAR(10),
    head_of_dept     VARCHAR(50),
    contact_email    VARCHAR(100),
    established_year INT,
    CONSTRAINT fk_dept_college FOREIGN KEY (college_id)
        REFERENCES college(college_id) ON DELETE CASCADE,
    UNIQUE KEY unique_dept (college_id, dept_name)
);

-- ============================================================
-- TABLE 6: student
-- ============================================================
CREATE TABLE IF NOT EXISTS student (
    student_id      INT          AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    age             INT,
    gender          VARCHAR(20),
    course          VARCHAR(100),
    year            INT,
    contact         VARCHAR(15),
    email           VARCHAR(100) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    college_id      INT,
    department_id   INT,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_college  FOREIGN KEY (college_id)
        REFERENCES college(college_id)    ON DELETE SET NULL,
    CONSTRAINT fk_student_dept     FOREIGN KEY (department_id)
        REFERENCES department(department_id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE 7: college_counselor_assignment
-- ============================================================
CREATE TABLE IF NOT EXISTS college_counselor_assignment (
    assignment_id   INT          AUTO_INCREMENT PRIMARY KEY,
    college_id      INT          NOT NULL,
    counselor_id    INT          NOT NULL,
    is_available    BOOLEAN      DEFAULT TRUE,
    specialization  VARCHAR(100),
    office_location VARCHAR(255),
    assigned_date   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cca_college   FOREIGN KEY (college_id)
        REFERENCES college(college_id)     ON DELETE CASCADE,
    CONSTRAINT fk_cca_counselor FOREIGN KEY (counselor_id)
        REFERENCES counselor(counselor_id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (college_id, counselor_id)
);

-- ============================================================
-- TABLE 8: college_resource
-- ============================================================
CREATE TABLE IF NOT EXISTS college_resource (
    resource_id     INT          AUTO_INCREMENT PRIMARY KEY,
    college_id      INT          NOT NULL,
    title           VARCHAR(100) NOT NULL,
    description     TEXT,
    resource_type   VARCHAR(50),
    url             VARCHAR(255),
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cr_college FOREIGN KEY (college_id)
        REFERENCES college(college_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 9: appointment
-- ============================================================
CREATE TABLE IF NOT EXISTS appointment (
    appointment_id  INT          AUTO_INCREMENT PRIMARY KEY,
    student_id      INT          NOT NULL,
    counselor_id    INT          NOT NULL,
    date            DATE         NOT NULL,
    time            TIME         NOT NULL,
    mode            VARCHAR(30)  DEFAULT 'in-person',
    counselor_note  TEXT,
    -- FIX: status uses ENUM for data integrity instead of plain VARCHAR
    status          ENUM('pending','confirmed','completed','cancelled') DEFAULT 'pending',
    confirmed_at    DATETIME,
    reminded_at     DATETIME,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appt_student   FOREIGN KEY (student_id)
        REFERENCES student(student_id)     ON DELETE CASCADE,
    CONSTRAINT fk_appt_counselor FOREIGN KEY (counselor_id)
        REFERENCES counselor(counselor_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 10: mental_health_assessment
-- ============================================================
CREATE TABLE IF NOT EXISTS mental_health_assessment (
    assessment_id       INT          AUTO_INCREMENT PRIMARY KEY,
    student_id          INT          NOT NULL,
    date                DATE         NOT NULL,
    stress_level        INT,           -- 0 = None … 4 = Very High
    anxiety_level       INT,
    -- FIX: risk_level uses ENUM for referential safety
    risk_level          ENUM('Low','Moderate','High','Critical') DEFAULT 'Low',
    depression_level    INT,
    sleep_quality       INT,
    social_support      INT,
    academic_pressure   INT,
    physical_activity   INT,
    self_harm_thoughts  BOOLEAN      DEFAULT FALSE,
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mha_student FOREIGN KEY (student_id)
        REFERENCES student(student_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 11: session_note
-- ============================================================
CREATE TABLE IF NOT EXISTS session_note (
    note_id             INT          AUTO_INCREMENT PRIMARY KEY,
    appointment_id      INT          NOT NULL UNIQUE,   -- one note per appointment
    counselor_id        INT          NOT NULL,
    notes               TEXT,
    mood_assessment     VARCHAR(100),
    progress_notes      TEXT,
    recommendations     TEXT,
    followup_date       DATE,
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sn_appointment FOREIGN KEY (appointment_id)
        REFERENCES appointment(appointment_id) ON DELETE CASCADE,
    CONSTRAINT fk_sn_counselor   FOREIGN KEY (counselor_id)
        REFERENCES counselor(counselor_id)     ON DELETE CASCADE
);

-- ============================================================
-- TABLE 12: self_help_resource
-- ============================================================
CREATE TABLE IF NOT EXISTS self_help_resource (
    resource_id     INT          AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(150) NOT NULL,
    -- UPDATED: type now includes Photo, Exercise, Support Line, and Community
    type            ENUM('Article','Resource','Worksheet','Video','Photo','Exercise','Support Line','Community') NOT NULL,
    description     TEXT,
    link            VARCHAR(255),
    thumbnail_url   VARCHAR(255),
    platform        VARCHAR(50),
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 13: crisis_resource
-- ============================================================
CREATE TABLE IF NOT EXISTS crisis_resource (
    crisis_id       INT          AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(150) NOT NULL,
    -- FIX: resource_type uses ENUM
    resource_type   ENUM('Helpline','Government','NGO','Online') DEFAULT 'Helpline',
    description     TEXT,
    contact         VARCHAR(100),
    url             VARCHAR(255),
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 14: chat_message
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_message (
    message_id  INT          AUTO_INCREMENT PRIMARY KEY,
    student_id  INT          NOT NULL,
    -- FIX: sender uses ENUM — only 'student' or 'bot' are valid senders
    sender      ENUM('student','bot') NOT NULL,
    message     TEXT         NOT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cm_student FOREIGN KEY (student_id)
        REFERENCES student(student_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 15: notification   (was in migration 002 — now part of base schema)
-- ============================================================
CREATE TABLE IF NOT EXISTS notification (
    notification_id INT          AUTO_INCREMENT PRIMARY KEY,
    user_id         INT          NOT NULL,
    user_role       ENUM('student','counselor','admin') NOT NULL,
    message         TEXT         NOT NULL,
    type            ENUM('appointment','assessment','system') DEFAULT 'system',
    is_read         BOOLEAN      DEFAULT FALSE,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- INDEXES  (performance — not in original schema, now added)
-- ============================================================
-- Faster notification lookups (matches notificationController.js query)
CREATE INDEX IF NOT EXISTS idx_notification_user
    ON notification (user_id, user_role, is_read);

-- Faster assessment lookups per student
CREATE INDEX IF NOT EXISTS idx_assessment_student
    ON mental_health_assessment (student_id, date DESC);

-- Faster appointment lookups
CREATE INDEX IF NOT EXISTS idx_appointment_student
    ON appointment (student_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_appointment_counselor
    ON appointment (counselor_id, date ASC);

-- Faster chat history retrieval (matches chatController.js)
CREATE INDEX IF NOT EXISTS idx_chat_student
    ON chat_message (student_id, created_at ASC);


-- ============================================================
-- SEED DATA — Administrator
-- password = 'counselor123'  (bcrypt hash)
-- ============================================================
INSERT INTO administrator (name, email, password) VALUES
('System Admin', 'admin@mentalhealthsys.com',
 '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5NwpMC')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================
-- SEED DATA — Counselors
-- password = 'counselor123'  (all share same hash for testing)
-- ============================================================
INSERT INTO counselor (name, qualification, specialization, experience, contact_no, email, password) VALUES
('Dr. Priya Mehta',    'M.Phil Clinical Psychology', 'Anxiety & Depression', '8 years',  '9876543210',
 'priya.mehta@counselor.com',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5NwpMC'),
('Dr. Arjun Sharma',   'PhD Psychology',             'Stress & Burnout',     '10 years', '9876543211',
 'arjun.sharma@counselor.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5NwpMC'),
('Ms. Sneha Kulkarni', 'M.Sc Counseling Psychology', 'Academic Stress',      '5 years',  '9876543212',
 'sneha.kulkarni@counselor.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5NwpMC')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================
-- SEED DATA — Colleges
-- ============================================================
INSERT INTO college (college_name, location, address, contact_number, email, website,
                     principal_name, principal_email, established_year,
                     counseling_center_phone, counseling_center_email)
VALUES
('Xavier Institute of Engineering',    'Mahim, Mumbai',
 'Navi Mumbai, Mahim Road, Mahim, Mumbai - 400016',
 '02224134167', 'info@xavier.ac.in',       'https://www.xavier.ac.in',
 'Fr. Agnelo Gracias', 'principal@xavier.ac.in',       1964,
 '02224134167', 'counseling@xavier.ac.in'),

('DJ Sanghavi College of Engineering', 'Vile Parle, Mumbai',
 'Vile Parle, Mumbai - 400056',
 '02232916000', 'info@djscoe.ac.in',       'https://www.djscoe.ac.in',
 'Dr. Meera Rao',      'principal@djscoe.ac.in',       2007,
 '02232916000', 'counseling@djscoe.ac.in'),

('Terna Engineering College',          'Nerul, Navi Mumbai',
 'Nerul, Navi Mumbai - 400706',
 '02227615500', 'info@terna.ac.in',        'https://www.terna.ac.in',
 'Dr. R.C. Patel',     'principal@terna.ac.in',        2000,
 '02227615500', 'counseling@terna.ac.in'),

('St. John College of Engineering',    'Khaira, Pune Road',
 'Khaira, Palghar - 401404',
 '02148999111', 'info@sjcoepalghar.ac.in', 'https://www.sjcoepalghar.ac.in',
 'Dr. Ashish More',    'principal@sjcoepalghar.ac.in', 2009,
 '02148999111', 'counseling@sjcoepalghar.ac.in'),

('Pillai College of Engineering',      'Panvel, Navi Mumbai',
 'Panvel, Navi Mumbai - 410206',
 '02224158024', 'info@pce.ac.in',          'https://www.pce.ac.in',
 'Dr. Sangita Godse',  'principal@pce.ac.in',          2000,
 '02224158024', 'counseling@pce.ac.in')
ON DUPLICATE KEY UPDATE location = VALUES(location);

-- ============================================================
-- SEED DATA — College branding / config
-- college_id values match insertion order above (1–5)
-- ============================================================
INSERT INTO college_config (college_id, primary_color, secondary_color, logo_url, custom_header_text, is_active)
VALUES
(1, '#8B4513', '#D2691E', 'https://www.xavier.ac.in/logo.png',
   'Xavier Institute of Engineering - Mental Health Support', TRUE),
(2, '#1E90FF', '#00BFFF', 'https://www.djscoe.ac.in/logo.png',
   'DJSCE - Student Mental Wellness',                         TRUE),
(3, '#228B22', '#32CD32', 'https://www.terna.ac.in/logo.png',
   'Terna Engineering - Wellness Hub',                        TRUE),
(4, '#DC143C', '#FF6347', 'https://www.sjcoepalghar.ac.in/logo.png',
   'St. John Engineering - Care Center',                      TRUE),
(5, '#FFD700', '#FFA500', 'https://www.pce.ac.in/logo.png',
   'Pillai College - Counseling Services',                    TRUE)
ON DUPLICATE KEY UPDATE primary_color = VALUES(primary_color);

-- ============================================================
-- SEED DATA — Departments
-- Xavier (college_id = 1)
-- ============================================================
INSERT INTO department (college_id, dept_name, dept_code, head_of_dept, contact_email, established_year)
VALUES
(1, 'Computer Science',       'CSE', 'Dr. Rajesh Kumar',   'cse@xavier.ac.in', 1964),
(1, 'Information Technology', 'IT',  'Prof. Anjali Sharma','it@xavier.ac.in',  1964),
(1, 'Electronics & Telecom',  'ET',  'Dr. Suresh Patel',   'et@xavier.ac.in',  1964),
(1, 'Mechanical Engineering', 'ME',  'Prof. Vikram Singh', 'me@xavier.ac.in',  1964),
(1, 'Civil Engineering',      'CE',  'Dr. Priya Desai',    'ce@xavier.ac.in',  1964),
(1, 'Chemical Engineering',   'CH',  'Prof. Arun Verma',   'ch@xavier.ac.in',  1964),
(1, 'Biomedical Engineering', 'BM',  'Dr. Neha Gupta',     'bm@xavier.ac.in',  2015)
ON DUPLICATE KEY UPDATE dept_code = VALUES(dept_code);

-- DJSCE (college_id = 2)
INSERT INTO department (college_id, dept_name, dept_code, head_of_dept, contact_email, established_year)
VALUES
(2, 'Computer Science',        'CSE', 'Dr. Mohan Rao',     'cse@djscoe.ac.in', 2007),
(2, 'Information Technology',  'IT',  'Prof. Sneha Joshi', 'it@djscoe.ac.in',  2007),
(2, 'Electronics Engineering', 'EC',  'Dr. Abhijit Nair',  'ec@djscoe.ac.in',  2007),
(2, 'Mechanical Engineering',  'ME',  'Prof. Rohit Desai', 'me@djscoe.ac.in',  2007)
ON DUPLICATE KEY UPDATE dept_code = VALUES(dept_code);

-- Terna (college_id = 3)
INSERT INTO department (college_id, dept_name, dept_code, head_of_dept, contact_email, established_year)
VALUES
(3, 'Computer Science',       'CSE', 'Dr. Kavita More',  'cse@terna.ac.in', 2000),
(3, 'Information Technology', 'IT',  'Prof. Ravi Jain',  'it@terna.ac.in',  2000),
(3, 'Electronics & Telecom',  'ET',  'Dr. Sanjay Patil', 'et@terna.ac.in',  2000),
(3, 'Mechanical Engineering', 'ME',  'Prof. Nisha Rane', 'me@terna.ac.in',  2000)
ON DUPLICATE KEY UPDATE dept_code = VALUES(dept_code);

-- St. John (college_id = 4)
INSERT INTO department (college_id, dept_name, dept_code, head_of_dept, contact_email, established_year)
VALUES
(4, 'Computer Science',       'CSE', 'Dr. Lata Godbole',  'cse@sjcoepalghar.ac.in', 2009),
(4, 'Information Technology', 'IT',  'Prof. Amit Chavan', 'it@sjcoepalghar.ac.in',  2009),
(4, 'Mechanical Engineering', 'ME',  'Dr. Dilip Naik',    'me@sjcoepalghar.ac.in',  2009)
ON DUPLICATE KEY UPDATE dept_code = VALUES(dept_code);

-- Pillai (college_id = 5)
INSERT INTO department (college_id, dept_name, dept_code, head_of_dept, contact_email, established_year)
VALUES
(5, 'Computer Science',        'CSE', 'Dr. Rekha Sawant',  'cse@pce.ac.in', 2000),
(5, 'Information Technology',  'IT',  'Prof. Sunil Pawar', 'it@pce.ac.in',  2000),
(5, 'Electronics Engineering', 'EC',  'Dr. Vinod Bhosle',  'ec@pce.ac.in',  2000),
(5, 'Civil Engineering',       'CE',  'Prof. Geeta Naik',  'ce@pce.ac.in',  2000)
ON DUPLICATE KEY UPDATE dept_code = VALUES(dept_code);

-- ============================================================
-- SEED DATA — Sample Students
-- password = 'student123'  (bcrypt hash)
-- FIX: Divya Pillai had a plain-text password — replaced with proper bcrypt hash
-- ============================================================
INSERT INTO student (name, age, gender, course, year, contact, email, password, college_id, department_id)
VALUES
('Rahul Verma',  21, 'Male',   'B.E. Computer Science',      3, '9812345601',
 'rahul.verma@student.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5NwpMC', 1, 1),

('Pooja Nair',   20, 'Female', 'B.E. Information Technology', 2, '9812345602',
 'pooja.nair@student.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5NwpMC', 1, 2),

('Amit Shaikh',  22, 'Male',   'B.E. Mechanical',             4, '9812345603',
 'amit.shaikh@student.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5NwpMC', 2, 8),
 -- FIX: department_id corrected from 11 → 8 (Mechanical Eng at DJSCE, college_id=2,
 --      which is department row ~8 after the 7 Xavier rows)

('Divya Pillai', 19, 'Female', 'B.E. Computer Science',       1, '9812345604',
 'divya.pillai@student.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe5NwpMC', 5, 19)
 -- FIX: password was plain-text 'DIVYA12345678' — replaced with bcrypt hash
 -- department_id 19 = CSE at Pillai (college_id=5), valid if rows insert in order
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================
-- SEED DATA — Counselor ↔ College assignments
-- ============================================================
INSERT INTO college_counselor_assignment
    (college_id, counselor_id, is_available, specialization, office_location)
VALUES
(1, 1, TRUE, 'Anxiety & Depression', 'Central Counseling Hub - Building A'),
(2, 1, TRUE, 'Anxiety & Depression', 'Central Counseling Hub - Building A'),
(3, 2, TRUE, 'Stress & Burnout',     'Central Counseling Hub - Building B'),
(1, 2, TRUE, 'Stress & Burnout',     'Central Counseling Hub - Building B'),
(4, 3, TRUE, 'Academic Stress',      'Central Counseling Hub - Building C'),
(5, 3, TRUE, 'Academic Stress',      'Central Counseling Hub - Building C')
ON DUPLICATE KEY UPDATE is_available = VALUES(is_available);

-- ============================================================
-- SEED DATA — College-specific resources
-- ============================================================
INSERT INTO college_resource (college_id, title, description, resource_type, url)
VALUES
(1, 'Xavier Health Center',             'On-campus medical and wellness facility',          'Facility', 'https://www.xavier.ac.in/health'),
(1, 'Xavier Student Mentoring Program', 'Peer mentoring for academic and personal support', 'Program',  'https://www.xavier.ac.in/mentoring'),
(2, 'DJSCE Wellness Portal',            'Complete student wellness resources',               'Portal',   'https://www.djscoe.ac.in/wellness'),
(3, 'Terna Counseling Services',        'Professional counseling at campus',                'Service',  'https://www.terna.ac.in/counseling'),
(4, 'St. John Student Support Cell',    'Academic and personal student support',            'Service',  'https://www.sjcoepalghar.ac.in/support'),
(5, 'Pillai Wellness Hub',              'Holistic mental wellness programs',                'Program',  'https://www.pce.ac.in/wellness');

-- ============================================================
-- SEED DATA — Self-help resources
-- FIX: type column values must match ENUM definition
-- ============================================================
INSERT INTO self_help_resource (title, type, description)
VALUES
('Understanding Anxiety',        'Article',   'A comprehensive guide to understanding and managing anxiety symptoms.'),
('Mindfulness Meditation Guide', 'Resource',  'Step-by-step mindfulness exercises for stress relief.'),
('CBT Thought Record Worksheet', 'Worksheet', 'Cognitive Behavioural Therapy worksheet to challenge negative thoughts.'),
('Deep Breathing Techniques',    'Video',     'Guided breathing exercises to calm anxiety and reduce stress.'),
('Sleep Hygiene Tips',           'Article',   'Evidence-based tips for improving sleep quality.'),
('Managing Academic Pressure',   'Resource',  'Strategies for dealing with academic stress and deadlines.'),
('Journaling for Mental Health', 'Worksheet', 'Structured journaling prompts for emotional processing.');

-- ============================================================
-- SEED DATA — Crisis resources
-- FIX: resource_type values now match ENUM ('Helpline','Government','NGO','Online')
-- ============================================================
INSERT INTO crisis_resource (title, resource_type, description, contact, url)
VALUES
('iCall - TISS',                'Helpline',    'Psychosocial helpline by Tata Institute of Social Sciences.',  '9152987821',   'https://icallhelpline.org'),
('Vandrevala Foundation',       'Helpline',    '24/7 mental health helpline for crisis support.',              '1860-2662-345','https://www.vandrevalafoundation.com'),
('AASRA',                       'Helpline',    'Crisis intervention for those at risk of suicide.',            '9820466627',   'https://www.aasra.info'),
('Snehi',                       'Helpline',    'Emotional support and crisis helpline.',                       '044-24640050', 'https://www.snehi.org'),
('National Mental Health Line', 'Government',  'Government of India mental health helpline.',                  '14416',        'https://nimhans.ac.in');

-- ============================================================
-- SEED DATA — Sample appointment (for testing)
-- ============================================================
INSERT INTO appointment (student_id, counselor_id, date, time, mode, status)
VALUES (1, 1, CURDATE(), '10:00:00', 'in-person', 'confirmed');
