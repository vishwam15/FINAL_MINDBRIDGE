-- ============================================================
-- Migration: Add Mumbai University College System
-- ============================================================

-- 1. Create COLLEGE Table
CREATE TABLE IF NOT EXISTS college (
    college_id INT AUTO_INCREMENT PRIMARY KEY,
    college_name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(100),
    address VARCHAR(255),
    contact_number VARCHAR(15),
    email VARCHAR(100),
    website VARCHAR(255),
    principal_name VARCHAR(50),
    principal_email VARCHAR(100),
    established_year INT,
    counseling_center_phone VARCHAR(15),
    counseling_center_email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create COLLEGE_CONFIG Table (for branding)
CREATE TABLE IF NOT EXISTS college_config (
    config_id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL UNIQUE,
    primary_color VARCHAR(7) DEFAULT '#2c3e50',
    secondary_color VARCHAR(7) DEFAULT '#3498db',
    logo_url VARCHAR(255),
    banner_url VARCHAR(255),
    custom_header_text VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (college_id) REFERENCES college(college_id) ON DELETE CASCADE
);

-- 3. Create DEPARTMENT Table
CREATE TABLE IF NOT EXISTS department (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    dept_name VARCHAR(100) NOT NULL,
    dept_code VARCHAR(10),
    head_of_dept VARCHAR(50),
    contact_email VARCHAR(100),
    established_year INT,
    FOREIGN KEY (college_id) REFERENCES college(college_id) ON DELETE CASCADE,
    UNIQUE KEY unique_dept (college_id, dept_name)
);

-- 4. Update STUDENT Table to add college affiliation
ALTER TABLE student ADD COLUMN college_id INT AFTER email;
ALTER TABLE student ADD COLUMN department_id INT AFTER college_id;
ALTER TABLE student ADD CONSTRAINT fk_student_college 
    FOREIGN KEY (college_id) REFERENCES college(college_id) ON DELETE SET NULL;
ALTER TABLE student ADD CONSTRAINT fk_student_dept 
    FOREIGN KEY (department_id) REFERENCES department(department_id) ON DELETE SET NULL;

-- 5. Create COLLEGE_RESOURCE Table (college-specific resources)
CREATE TABLE IF NOT EXISTS college_resource (
    resource_id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50),
    url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES college(college_id) ON DELETE CASCADE
);

-- 6. Create COLLEGE_COUNSELOR_ASSIGNMENT Table (for tracking which counselors serve which colleges)
CREATE TABLE IF NOT EXISTS college_counselor_assignment (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    counselor_id INT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    specialization VARCHAR(100),
    office_location VARCHAR(255),
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES college(college_id) ON DELETE CASCADE,
    FOREIGN KEY (counselor_id) REFERENCES counselor(counselor_id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (college_id, counselor_id)
);

-- ============================================================
-- Seed Data: Mumbai University Colleges
-- ============================================================

-- 1. Xavier Institute of Engineering (Xavier's)
INSERT INTO college (college_name, location, address, contact_number, email, website, principal_name, principal_email, established_year, counseling_center_phone, counseling_center_email) 
VALUES (
    'Xavier Institute of Engineering',
    'Mahim, Mumbai',
    'Navi Mumbai, Mahim Road, Mahim, Mumbai - 400016',
    '02224134167',
    'info@xavier.ac.in',
    'https://www.xavier.ac.in',
    'Fr. Agnelo Gracias',
    'principal@xavier.ac.in',
    1964,
    '02224134167',
    'counseling@xavier.ac.in'
);

-- 2. DJSCE (DJ Sanghavi College of Engineering)
INSERT INTO college (college_name, location, address, contact_number, email, website, principal_name, principal_email, established_year, counseling_center_phone, counseling_center_email)
VALUES (
    'DJ Sanghavi College of Engineering',
    'Vile Parle, Mumbai',
    'Vile Parle, Mumbai - 400056',
    '02232916000',
    'info@djscoe.ac.in',
    'https://www.djscoe.ac.in',
    'Dr. Meera Rao',
    'principal@djscoe.ac.in',
    2007,
    '02232916000',
    'counseling@djscoe.ac.in'
);

-- 3. Terna Engineering College
INSERT INTO college (college_name, location, address, contact_number, email, website, principal_name, principal_email, established_year, counseling_center_phone, counseling_center_email)
VALUES (
    'Terna Engineering College',
    'Nerul, Navi Mumbai',
    'Nerul, Navi Mumbai - 400706',
    '02227615500',
    'info@terna.ac.in',
    'https://www.terna.ac.in',
    'Dr. R.C. Patel',
    'principal@terna.ac.in',
    2000,
    '02227615500',
    'counseling@terna.ac.in'
);

-- 4. St. John College of Engineering
INSERT INTO college (college_name, location, address, contact_number, email, website, principal_name, principal_email, established_year, counseling_center_phone, counseling_center_email)
VALUES (
    'St. John College of Engineering',
    'Khaira, Pune Road',
    'Khaira, Palghar - 401404',
    '02148999111',
    'info@sjcoepalghar.ac.in',
    'https://www.sjcoepalghar.ac.in',
    'Dr. Ashish More',
    'principal@sjcoepalghar.ac.in',
    2009,
    '02148999111',
    'counseling@sjcoepalghar.ac.in'
);

-- 5. Pillai College of Engineering
INSERT INTO college (college_name, location, address, contact_number, email, website, principal_name, principal_email, established_year, counseling_center_phone, counseling_center_email)
VALUES (
    'Pillai College of Engineering',
    'Panvel, Navi Mumbai',
    'Panvel, Navi Mumbai - 410206',
    '02224158024',
    'info@pce.ac.in',
    'https://www.pce.ac.in',
    'Dr. Sangita Godse',
    'principal@pce.ac.in',
    2000,
    '02224158024',
    'counseling@pce.ac.in'
);

-- ============================================================
-- Add Departments for Xavier Institute
-- ============================================================

INSERT INTO department (college_id, dept_name, dept_code, head_of_dept, contact_email, established_year)
SELECT college_id, 'Computer Science', 'CSE', 'Dr. Rajesh Kumar', 'cse@xavier.ac.in', 1964 FROM college WHERE college_name = 'Xavier Institute of Engineering'
UNION ALL
SELECT college_id, 'Information Technology', 'IT', 'Prof. Anjali Sharma', 'it@xavier.ac.in', 1964 FROM college WHERE college_name = 'Xavier Institute of Engineering'
UNION ALL
SELECT college_id, 'Electronics & Telecom', 'ET', 'Dr. Suresh Patel', 'et@xavier.ac.in', 1964 FROM college WHERE college_name = 'Xavier Institute of Engineering'
UNION ALL
SELECT college_id, 'Mechanical Engineering', 'ME', 'Prof. Vikram Singh', 'me@xavier.ac.in', 1964 FROM college WHERE college_name = 'Xavier Institute of Engineering'
UNION ALL
SELECT college_id, 'Civil Engineering', 'CE', 'Dr. Priya Desai', 'ce@xavier.ac.in', 1964 FROM college WHERE college_name = 'Xavier Institute of Engineering'
UNION ALL
SELECT college_id, 'Chemical Engineering', 'CH', 'Prof. Arun Verma', 'ch@xavier.ac.in', 1964 FROM college WHERE college_name = 'Xavier Institute of Engineering'
UNION ALL
SELECT college_id, 'Biomedical Engineering', 'BM', 'Dr. Neha Gupta', 'bm@xavier.ac.in', 2015 FROM college WHERE college_name = 'Xavier Institute of Engineering';

-- ============================================================
-- Add Departments for DJSCE
-- ============================================================

INSERT INTO department (college_id, dept_name, dept_code, head_of_dept, contact_email, established_year)
SELECT college_id, 'Computer Science', 'CSE', 'Dr. Mohan Rao', 'cse@djscoe.ac.in', 2007 FROM college WHERE college_name = 'DJ Sanghavi College of Engineering'
UNION ALL
SELECT college_id, 'Information Technology', 'IT', 'Prof. Sneha Joshi', 'it@djscoe.ac.in', 2007 FROM college WHERE college_name = 'DJ Sanghavi College of Engineering'
UNION ALL
SELECT college_id, 'Electronics Engineering', 'EC', 'Dr. Abhijit Nair', 'ec@djscoe.ac.in', 2007 FROM college WHERE college_name = 'DJ Sanghavi College of Engineering'
UNION ALL
SELECT college_id, 'Mechanical Engineering', 'ME', 'Prof. Rohit Desai', 'me@djscoe.ac.in', 2007 FROM college WHERE college_name = 'DJ Sanghavi College of Engineering';

-- ============================================================
-- College Branding Configuration
-- ============================================================

INSERT INTO college_config (college_id, primary_color, secondary_color, logo_url, custom_header_text, is_active)
VALUES 
(1, '#8B4513', '#D2691E', 'https://www.xavier.ac.in/logo.png', 'Xavier Institute of Engineering - Mental Health Support', TRUE),
(2, '#1E90FF', '#00BFFF', 'https://www.djscoe.ac.in/logo.png', 'DJSCE - Student Mental Wellness', TRUE),
(3, '#228B22', '#32CD32', 'https://www.terna.ac.in/logo.png', 'Terna Engineering - Wellness Hub', TRUE),
(4, '#DC143C', '#FF6347', 'https://www.sjcoepalghar.ac.in/logo.png', 'St. John Engineering - Care Center', TRUE),
(5, '#FFD700', '#FFA500', 'https://www.pce.ac.in/logo.png', 'Pillai College - Counseling Services', TRUE);

-- ============================================================
-- Add College-Specific Resources (Sample)
-- ============================================================

INSERT INTO college_resource (college_id, title, description, resource_type, url)
SELECT college_id, 'Xavier Health Center', 'On-campus medical and wellness facility', 'Facility', 'https://www.xavier.ac.in/health' FROM college WHERE college_name = 'Xavier Institute of Engineering'
UNION ALL
SELECT college_id, 'Xavier Student Mentoring Program', 'Peer mentoring for academic and personal support', 'Program', 'https://www.xavier.ac.in/mentoring' FROM college WHERE college_name = 'Xavier Institute of Engineering'
UNION ALL
SELECT college_id, 'DJSCE Wellness Portal', 'Complete student wellness resources', 'Portal', 'https://www.djscoe.ac.in/wellness' FROM college WHERE college_name = 'DJ Sanghavi College of Engineering'
UNION ALL
SELECT college_id, 'Terna Counseling Services', 'Professional counseling at campus', 'Service', 'https://www.terna.ac.in/counseling' FROM college WHERE college_name = 'Terna Engineering College';

-- ============================================================
-- Assign Counselors to Colleges (Shared Pool)
-- ============================================================

INSERT INTO college_counselor_assignment (college_id, counselor_id, is_available, specialization, office_location)
SELECT college_id, 1, TRUE, 'Anxiety & Depression', 'Central Counseling Hub - Building A' FROM college WHERE college_name = 'Xavier Institute of Engineering'
UNION ALL
SELECT college_id, 1, TRUE, 'Anxiety & Depression', 'Central Counseling Hub - Building A' FROM college WHERE college_name = 'DJ Sanghavi College of Engineering'
UNION ALL
SELECT college_id, 2, TRUE, 'Stress & Burnout', 'Central Counseling Hub - Building B' FROM college WHERE college_name = 'Terna Engineering College'
UNION ALL
SELECT college_id, 2, TRUE, 'Stress & Burnout', 'Central Counseling Hub - Building B' FROM college WHERE college_name = 'Xavier Institute of Engineering'
UNION ALL
SELECT college_id, 3, TRUE, 'Academic Stress', 'Central Counseling Hub - Building C' FROM college WHERE college_name = 'St. John College of Engineering'
UNION ALL
SELECT college_id, 3, TRUE, 'Academic Stress', 'Central Counseling Hub - Building C' FROM college WHERE college_name = 'Pillai College of Engineering';
