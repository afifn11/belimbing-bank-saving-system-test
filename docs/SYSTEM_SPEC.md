# Bank Saving System — System Specification
## Belimbing.ai Engineering Test — Muhammad Afif Naufal

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Specification](#2-system-specification)
   - [2a. Database Design](#2a-database-design)
   - [2b. APIs Needed](#2b-apis-needed)
   - [2c. APIs Call Every Screen](#2c-apis-call-every-screen)
   - [2d. API Documentation](#2d-api-documentation)
   - [2e. API Collection](#2e-api-collection)
   - [2f. UML Sequence Diagram](#2f-uml-sequence-diagram)
   - [2g. Class Diagram](#2g-class-diagram)
   - [2h. Use Case Diagram](#2h-use-case-diagram)
3. [Error Handling & Edge Cases](#3-error-handling--edge-cases)
4. [Business Rules](#4-business-rules)
5. [Tech Stack](#5-tech-stack)

---

## 1. Overview

A web-based Bank Saving System that allows bank staff to manage customers, accounts, deposito types, and financial transactions (deposit/withdraw) with automatic interest calculation.

**Actor:** Bank Staff (internal system — no authentication required)

---

## 2. System Specification

---

### 2a. Database Design

#### Entity Relationship Diagram

![ERD](./diagrams/erd.png)

#### ERD Summary

```
CUSTOMERS ──< ACCOUNTS >── DEPOSITO_TYPES
                │
            TRANSACTIONS
```

#### Table: `customers`

| Column     | Type         | Constraint             |
|------------|--------------|------------------------|
| id         | INT          | PK, AUTO_INCREMENT     |
| name       | VARCHAR(100) | NOT NULL               |
| created_at | TIMESTAMP    | DEFAULT NOW()          |
| updated_at | TIMESTAMP    | ON UPDATE NOW()        |

#### Table: `deposito_types`

| Column        | Type         | Constraint             |
|---------------|--------------|------------------------|
| id            | INT          | PK, AUTO_INCREMENT     |
| name          | VARCHAR(100) | NOT NULL, UNIQUE       |
| yearly_return | DECIMAL(5,2) | NOT NULL (0.01–100)    |
| created_at    | TIMESTAMP    | DEFAULT NOW()          |
| updated_at    | TIMESTAMP    | ON UPDATE NOW()        |

#### Table: `accounts`

| Column           | Type          | Constraint                     |
|------------------|---------------|--------------------------------|
| id               | INT           | PK, AUTO_INCREMENT             |
| packet           | VARCHAR(100)  | NOT NULL                       |
| customer_id      | INT           | FK → customers.id, RESTRICT    |
| deposito_type_id | INT           | FK → deposito_types.id, RESTRICT|
| balance          | DECIMAL(15,2) | DEFAULT 0.00                   |
| created_at       | TIMESTAMP     | DEFAULT NOW()                  |
| updated_at       | TIMESTAMP     | ON UPDATE NOW()                |

#### Table: `transactions`

| Column           | Type          | Constraint                     |
|------------------|---------------|--------------------------------|
| id               | INT           | PK, AUTO_INCREMENT             |
| account_id       | INT           | FK → accounts.id, CASCADE      |
| type             | ENUM          | 'deposit' \| 'withdraw'        |
| amount           | DECIMAL(15,2) | NOT NULL                       |
| transaction_date | DATE          | NOT NULL                       |
| starting_balance | DECIMAL(15,2) | NOT NULL                       |
| ending_balance   | DECIMAL(15,2) | NULL                           |
| interest_earned  | DECIMAL(15,2) | NULL (withdraw only)           |
| months_held      | INT           | NULL (withdraw only)           |
| created_at       | TIMESTAMP     | DEFAULT NOW()                  |

#### Design Decisions

| Decision | Reason |
|----------|--------|
| Store `starting_balance` & `ending_balance` per transaction | Immutable financial audit trail — balance history is preserved even if account balance is recalculated |
| `ON DELETE RESTRICT` — customer → accounts | Prevents accidental deletion of customers who still have active savings |
| `ON DELETE RESTRICT` — deposito_type → accounts | Prevents orphaned accounts with no interest type |
| `ON DELETE CASCADE` — account → transactions | When an account is deleted, its transaction history has no standalone meaning |
| `name UNIQUE` on deposito_types | Prevents duplicate product names (Bronze, Silver, Gold must be distinct) |

---

### 2b. APIs Needed

Base URL: `/api/v1`

#### Customers

| Method | Endpoint           | Description                        |
|--------|--------------------|------------------------------------|
| GET    | /customers         | List all customers + account summary |
| GET    | /customers/:id     | Get one customer + all accounts    |
| POST   | /customers         | Create customer                    |
| PUT    | /customers/:id     | Update customer name               |
| DELETE | /customers/:id     | Delete customer (blocks if has accounts) |

#### Deposito Types

| Method | Endpoint             | Description                          |
|--------|----------------------|--------------------------------------|
| GET    | /deposito-types      | List all deposito types              |
| GET    | /deposito-types/:id  | Get one deposito type                |
| POST   | /deposito-types      | Create deposito type                 |
| PUT    | /deposito-types/:id  | Update name/yearly_return (checks duplicate) |
| DELETE | /deposito-types/:id  | Delete (blocks if in use by accounts) |

#### Accounts

| Method | Endpoint                         | Description                        |
|--------|----------------------------------|------------------------------------|
| GET    | /accounts                        | List all accounts + customer + deposito type |
| GET    | /accounts/:id                    | Get one account detail             |
| GET    | /accounts/customer/:customerId   | All accounts belonging to a customer |
| POST   | /accounts                        | Create account                     |
| PUT    | /accounts/:id                    | Update packet/customer/deposito type |
| DELETE | /accounts/:id                    | Delete account (cascades transactions) |

#### Transactions

| Method | Endpoint                          | Description                        |
|--------|-----------------------------------|------------------------------------|
| GET    | /transactions/account/:accountId  | Full transaction history for account |
| POST   | /transactions/deposit             | Deposit — add balance              |
| POST   | /transactions/withdraw            | Withdraw — deduct balance + calculate interest |

#### Request & Response Examples

**POST /customers**
```json
// Request
{ "name": "Budi Santoso" }

// Response 201
{ "success": true, "message": "Customer created successfully", "data": { "id": 1, "name": "Budi Santoso" } }
```

**POST /transactions/deposit**
```json
// Request
{ "account_id": 1, "amount": 1000000, "transaction_date": "2026-04-22" }

// Response 201
{
  "success": true,
  "message": "Deposit successful",
  "data": {
    "transaction_id": 5,
    "type": "deposit",
    "amount": 1000000,
    "transaction_date": "2026-04-22",
    "starting_balance": 5000000,
    "new_balance": 6000000
  }
}
```

**POST /transactions/withdraw**
```json
// Request
{ "account_id": 1, "amount": 500000, "transaction_date": "2026-04-22" }

// Response 201
{
  "success": true,
  "message": "Withdrawal successful",
  "data": {
    "transaction_id": 6,
    "starting_balance": 5000000,
    "amount_withdrawn": 500000,
    "months_held": 3,
    "yearly_return": 7.00,
    "monthly_return_rate": 0.5833,
    "interest_earned": 87500,
    "balance_before_withdrawal": 5087500,
    "ending_balance": 4587500
  }
}
```

#### Standard Response Format

```json
// Success
{ "success": true,  "message": "Operation successful", "data": { } }

// Error
{ "success": false, "message": "Error description",    "errors": [ ] }
```

---

### 2c. APIs Call Every Screen

#### Dashboard (`/`)

| Trigger   | Method | Endpoint          | Purpose                                     |
|-----------|--------|-------------------|---------------------------------------------|
| On mount  | GET    | `/customers`      | Count total customers                       |
| On mount  | GET    | `/accounts`       | Total balance, active accounts, distribution per deposito type |
| On mount  | GET    | `/deposito-types` | Labels and rates for deposito distribution  |

#### Customers (`/customers`)

| Trigger                    | Method | Endpoint           | Purpose              |
|----------------------------|--------|--------------------|----------------------|
| On mount                   | GET    | `/customers`       | Load customer list   |
| Add Customer → Submit      | POST   | `/customers`       | Create new customer  |
| Edit → Submit              | PUT    | `/customers/:id`   | Update customer name |
| Delete → Confirm           | DELETE | `/customers/:id`   | Remove customer      |

#### Deposito Types (`/deposito-types`)

| Trigger                    | Method | Endpoint               | Purpose                   |
|----------------------------|--------|------------------------|---------------------------|
| On mount                   | GET    | `/deposito-types`      | Load all deposito types   |
| Add Type → Submit          | POST   | `/deposito-types`      | Create new deposito type  |
| Edit → Submit              | PUT    | `/deposito-types/:id`  | Update name / yearly return |
| Delete → Confirm           | DELETE | `/deposito-types/:id`  | Remove deposito type      |

#### Accounts (`/accounts`)

| Trigger                    | Method | Endpoint                       | Purpose                        |
|----------------------------|--------|--------------------------------|--------------------------------|
| On mount                   | GET    | `/accounts`                    | Load account list              |
| On mount                   | GET    | `/customers`                   | Populate customer dropdown     |
| On mount                   | GET    | `/deposito-types`              | Populate deposito type dropdown|
| Add Account → Submit       | POST   | `/accounts`                    | Create new account             |
| Edit → Submit              | PUT    | `/accounts/:id`                | Update account                 |
| Delete → Confirm           | DELETE | `/accounts/:id`                | Remove account                 |

#### Transactions (`/transactions`)

| Trigger                    | Method | Endpoint                           | Purpose                            |
|----------------------------|--------|------------------------------------|------------------------------------|
| On mount                   | GET    | `/accounts`                        | Populate account selector dropdown |
| Select account             | GET    | `/transactions/account/:accountId` | Load transaction history           |
| Deposit → Submit           | POST   | `/transactions/deposit`            | Add balance                        |
| Withdraw → Submit          | POST   | `/transactions/withdraw`           | Deduct balance + calculate interest|
| After deposit/withdraw     | GET    | `/transactions/account/:accountId` | Refresh transaction history        |
| After deposit/withdraw     | GET    | `/accounts`                        | Refresh current balance in dropdown|

---

### 2d. API Documentation

Interactive API documentation is available via **Swagger UI**, self-hosted on the backend.

| Environment | URL |
|-------------|-----|
| Local       | `http://localhost:5000/api/docs` |
| Production  | `https://<your-app>.railway.app/api/docs` |

The documentation covers all 17 endpoints with:
- Full request body schemas
- All possible response codes (200, 201, 400, 404, 422, 500)
- Live "Try it out" for every endpoint
- Interest formula explanation on the withdraw endpoint

Source file: `backend/src/swagger.yaml` (OpenAPI 3.0 specification)

---

### 2e. API Collection

Postman collection and environment files are located in the `docs/` folder.

| File | Description |
|------|-------------|
| `Belimbing_Bank_API.postman_collection.json` | All 17 API requests, organized by resource |
| `Belimbing_Bank.postman_environment.json`    | Environment variables (`base_url`, sample IDs) |

**Import steps:**
1. Open Postman
2. Import → `Belimbing_Bank_API.postman_collection.json`
3. Import → `Belimbing_Bank.postman_environment.json`
4. Set active environment to **Belimbing Bank**
5. Base URL defaults to `http://localhost:5000/api/v1`

---

### 2f. UML Sequence Diagram

> Depicts the full flow of **Withdraw with Interest Calculation** — the most complex operation in the system.

![UML Sequence Diagram](./diagrams/uml_sequence.png)

**Flow summary:**
1. Bank Staff submits withdraw form (account_id, amount, date)
2. Frontend validates client-side, sends POST to `/transactions/withdraw`
3. Backend opens DB transaction
4. Fetches account + deposito type (yearly_return)
5. Validates: account exists, amount > 0, amount ≤ balance
6. Fetches last deposit date to calculate months_held
7. Calculates interest: `balance × months × (yearly_return / 12 / 100)`
8. Updates account balance, inserts transaction record
9. Commits DB transaction
10. Returns full interest breakdown to frontend
11. Frontend displays calculation summary modal

---

### 2g. Class Diagram

![Class Diagram](./diagrams/class_diagram.png)

**Key relationships:**
- `Customer` 1 → N `Account`
- `DepositoType` 1 → N `Account`
- `Account` 1 → N `Transaction`
- Controllers depend on Models (not the other way around)
- `TransactionController` uses `Account`, `Transaction`, and reads `DepositoType.yearly_return`

---

### 2h. Use Case Diagram

![Use Case Diagram](./diagrams/use_case.png)

**Actor:** Bank Staff

**Use case groups:**
- **Customer Management** — Create, View, Edit, Delete Customer
- **Deposito Type Management** — Create, View, Edit, Delete Deposito Type
- **Account Management** — Create, View, Edit, Delete Account, View by Customer
- **Transaction Management** — Deposit, Withdraw, View History
- **Dashboard** — View Summary Statistics

**Extend relationships:**
- Withdraw `<<extend>>` Validate Sufficient Balance
- Withdraw `<<extend>>` Calculate Interest
- Delete Customer `<<extend>>` Check Accounts Exist
- Delete Deposito Type `<<extend>>` Check Deposito In Use

---

## 3. Error Handling & Edge Cases

| HTTP | Case | Response Message |
|------|------|-----------------|
| 400  | Withdraw amount > balance | "Insufficient balance" |
| 400  | Deposit/Withdraw amount ≤ 0 | "Amount must be greater than 0" |
| 400  | Invalid date format | "Invalid date format, use YYYY-MM-DD" |
| 400  | Delete customer with active accounts | "Cannot delete customer with existing accounts" |
| 400  | Delete deposito type in use | "Cannot delete deposito type that is currently used by N account(s)" |
| 400  | Duplicate deposito type name (create or update) | "Deposito type name already exists" |
| 404  | Customer not found | "Customer not found" |
| 404  | Account not found | "Account not found" |
| 404  | Deposito type not found | "Deposito type not found" |
| 422  | Missing required fields | "Validation error" + field list |
| 500  | Server / DB error | "Internal server error" |

**Additional safeguards:**
- All deposit and withdraw operations are wrapped in a **database transaction** — any failure triggers a full rollback, ensuring balance and transaction records never go out of sync
- Duplicate name check on `DepositoType` is done explicitly at the application layer (not just relying on DB UNIQUE constraint) to return a user-friendly 400 instead of a raw DB error

---

## 4. Business Rules

- One customer can have **multiple accounts**
- One account has exactly **one deposito type**
- Balance cannot go below 0
- Deposit and withdrawal dates must be valid `YYYY-MM-DD` format

### Interest Formula (Withdrawal)

```
monthly_return_rate   = yearly_return / 12 / 100
interest_earned       = starting_balance × months_held × monthly_return_rate
balance_with_interest = starting_balance + interest_earned
ending_balance        = balance_with_interest − amount_withdrawn
```

**Example:** Rp 5,000,000 held 3 months at Gold (7%/yr)

```
monthly_rate = 7 / 12 / 100        = 0.005833
interest     = 5,000,000 × 3 × 0.005833 = Rp 87,500
balance+int  = Rp 5,087,500
ending (−500k) = Rp 4,587,500
```

`months_held` is calculated from the **last deposit date** to the withdrawal date. If no prior deposit exists, the account creation date is used as the start reference.

---

## 5. Tech Stack

| Layer      | Technology                        | Notes                          |
|------------|-----------------------------------|--------------------------------|
| Backend    | Node.js + Express.js              | REST API, MVC pattern          |
| ORM        | Sequelize v6                      | MySQL abstraction, associations|
| Database   | MySQL 8                           | Relational, ACID compliant     |
| Frontend   | React.js 18 + React Router v6     | SPA, MVC pattern               |
| HTTP       | Axios                             | With response interceptor      |
| API Docs   | Swagger UI (swagger-ui-express)   | OpenAPI 3.0, self-hosted       |
| API Style  | RESTful JSON                      | Consistent response envelope   |
| Auth       | None                              | Internal system for bank staff |
| Deploy     | Railway (backend) + Vercel (frontend) | Free tier, CI/CD from GitHub |