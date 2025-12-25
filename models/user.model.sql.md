-- MySQL schema for users & tokens
CREATE DATABASE IF NOT EXISTS jwt_auth;
USE jwt_auth;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','user') DEFAULT 'user'
);

CREATE TABLE tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  login_time DATETIME,
  login_address VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
