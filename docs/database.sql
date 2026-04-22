-- ============================================================
-- Belimbing Bank — Database Setup Script
-- Run this in MySQL after creating the database
-- ============================================================

CREATE DATABASE IF NOT EXISTS belimbing_bank CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE belimbing_bank;

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Deposito Types
CREATE TABLE IF NOT EXISTS deposito_types (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL UNIQUE,
  yearly_return DECIMAL(5,2) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  packet           VARCHAR(100) NOT NULL,
  customer_id      INT NOT NULL,
  deposito_type_id INT NOT NULL,
  balance          DECIMAL(15,2) DEFAULT 0.00,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id)      REFERENCES customers(id)      ON DELETE RESTRICT,
  FOREIGN KEY (deposito_type_id) REFERENCES deposito_types(id) ON DELETE RESTRICT
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  account_id       INT NOT NULL,
  type             ENUM('deposit','withdraw') NOT NULL,
  amount           DECIMAL(15,2) NOT NULL,
  transaction_date DATE NOT NULL,
  starting_balance DECIMAL(15,2) NOT NULL,
  ending_balance   DECIMAL(15,2),
  interest_earned  DECIMAL(15,2),
  months_held      INT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- ── Seed Data ────────────────────────────────────────────────

INSERT INTO deposito_types (name, yearly_return) VALUES
  ('Deposito Bronze', 3.00),
  ('Deposito Silver', 5.00),
  ('Deposito Gold',   7.00);

INSERT INTO customers (name) VALUES
  ('Budi Santoso'),
  ('Siti Rahayu'),
  ('Ahmad Fauzi');

INSERT INTO accounts (packet, customer_id, deposito_type_id, balance) VALUES
  ('Tabungan Reguler',  1, 1, 5000000.00),
  ('Tabungan Premium',  1, 3, 20000000.00),
  ('Tabungan Harian',   2, 2, 10000000.00),
  ('Tabungan Berjangka',3, 3, 15000000.00);
