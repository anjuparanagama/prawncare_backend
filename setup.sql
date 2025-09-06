-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS prawncare;

-- Use the database
USE prawncare;

-- Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serviceId VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_email (email(191))
);

-- Create the inventory table if it doesn't exist
CREATE TABLE IF NOT EXISTS Inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the sales table if it doesn't exist
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Order_Date DATE NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    Status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the customer_order table if it doesn't exist
CREATE TABLE IF NOT EXISTS customer_order (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    prawn_type VARCHAR(100),
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Insert some sample sales data
INSERT INTO sales (Order_Date, Amount, Status) VALUES
('2023-01-15', 150.00, 'Completed'),
('2023-02-20', 200.50, 'Completed'),
('2023-03-10', 300.75, 'Delivered'),
('2023-04-05', 250.00, 'Completed'),
('2023-05-12', 175.25, 'Completed'),
('2023-06-18', 400.00, 'Delivered'),
('2023-07-22', 320.50, 'Completed'),
('2023-08-30', 280.75, 'Completed'),
('2023-09-14', 350.00, 'Delivered'),
('2023-10-08', 220.25, 'Completed'),
('2023-11-25', 190.00, 'Completed'),


-- Verify tables were created
SHOW TABLES;
