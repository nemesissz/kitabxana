-- Vergi Database Schema

CREATE DATABASE IF NOT EXISTS vergi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vergi_db;

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    position VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role TINYINT DEFAULT 1 COMMENT '1=User, 2=Admin, 3=Supadmin',
    is_verified BOOLEAN DEFAULT FALSE,
    edu_email BOOLEAN DEFAULT FALSE,
    profile_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PDFs Table
CREATE TABLE IF NOT EXISTS pdfs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    language ENUM('az', 'ru', 'az-ru') NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    cover_image_path VARCHAR(500),
    price DECIMAL(10,2) DEFAULT 0.00,
    downloads INT DEFAULT 0,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_language (language),
    INDEX idx_category (category_id),
    INDEX idx_price (price)
);

-- News Table
CREATE TABLE IF NOT EXISTS news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image VARCHAR(500),
    language ENUM('az', 'ru', 'en') NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_language (language),
    INDEX idx_category (category_id)
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan ENUM('1m', '3m', '6m') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NOT NULL,
    status ENUM('active', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_end_date (end_date)
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type ENUM('subscription', 'single-pdf') NOT NULL,
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_type (type)
);

-- Audit Logs Table (opsional)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_table_name (table_name)
);

-- Insert default categories
INSERT IGNORE INTO categories (id, name) VALUES 
(1, 'Vergi Qanunvericiliyi'),
(2, 'Gömrük'),
(3, 'Mühasibat'),
(4, 'Hüquq'),
(5, 'İqtisadiyyat');

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO user_profiles (id, full_name, phone, company, position) VALUES 
(1, 'System Admin', '+994501234567', 'Vergi.az', 'Super Administrator');

INSERT IGNORE INTO users (id, email, password, role, is_verified, edu_email, profile_id) VALUES 
(1, 'admin@vergi.az', '$2b$10$rOzKqKXCjKgHGZ4HZJxR6eR1V6QXz8CxWGJ.Px6JfTjf2tgKfGJAe', 3, TRUE, FALSE, 1);
