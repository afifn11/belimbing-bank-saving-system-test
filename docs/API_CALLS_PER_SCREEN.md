# API Calls Per Screen
> Pemetaan endpoint yang dipanggil oleh setiap halaman frontend.

Base URL: `/api/v1`

---

## 1. Dashboard (`/`)

| Trigger | Method | Endpoint | Tujuan |
|---------|--------|----------|--------|
| On mount | GET | `/customers` | Hitung total customers |
| On mount | GET | `/accounts` | Total accounts, total balance, distribusi per deposito type |
| On mount | GET | `/deposito-types` | Nama & bunga tiap deposito type untuk label distribusi |

**Data yang dihitung di frontend dari response:**
- Total AUM (sum semua `balance`)
- Average balance per akun
- Active rate (akun dengan `balance > 0`)
- Distribusi balance per deposito type
- Top 5 akun berdasarkan balance

---

## 2. Customers (`/customers`)

| Trigger | Method | Endpoint | Tujuan |
|---------|--------|----------|--------|
| On mount | GET | `/customers` | Load semua customers + ringkasan akun |
| Klik "Add Customer" → Submit | POST | `/customers` | Buat customer baru |
| Klik "Edit" → Submit | PUT | `/customers/:id` | Update nama customer |
| Klik "Delete" → Confirm | DELETE | `/customers/:id` | Hapus customer |

---

## 3. Deposito Types (`/deposito-types`)

| Trigger | Method | Endpoint | Tujuan |
|---------|--------|----------|--------|
| On mount | GET | `/deposito-types` | Load semua deposito types |
| Klik "Add Type" → Submit | POST | `/deposito-types` | Buat deposito type baru |
| Klik "Edit" → Submit | PUT | `/deposito-types/:id` | Update nama / yearly return |
| Klik "Delete" → Confirm | DELETE | `/deposito-types/:id` | Hapus deposito type |

---

## 4. Accounts (`/accounts`)

| Trigger | Method | Endpoint | Tujuan |
|---------|--------|----------|--------|
| On mount | GET | `/accounts` | Load semua accounts + customer + deposito type |
| On mount | GET | `/customers` | Populate dropdown pilih customer saat form |
| On mount | GET | `/deposito-types` | Populate dropdown pilih deposito type saat form |
| Klik "Add Account" → Submit | POST | `/accounts` | Buat akun baru |
| Klik "Edit" → Submit | PUT | `/accounts/:id` | Update packet / customer / deposito type |
| Klik "Delete" → Confirm | DELETE | `/accounts/:id` | Hapus akun (cascade transactions) |

---

## 5. Transactions (`/transactions`)

| Trigger | Method | Endpoint | Tujuan |
|---------|--------|----------|--------|
| On mount | GET | `/accounts` | Populate dropdown pilih akun |
| Pilih akun | GET | `/transactions/account/:accountId` | Load riwayat transaksi akun yang dipilih |
| Klik "Deposit" → Submit | POST | `/transactions/deposit` | Tambah saldo |
| Klik "Withdraw" → Submit | POST | `/transactions/withdraw` | Kurangi saldo + hitung bunga |
| Setelah deposit/withdraw | GET | `/transactions/account/:accountId` | Refresh riwayat transaksi |
| Setelah deposit/withdraw | GET | `/accounts` | Refresh saldo terbaru di dropdown |

**Catatan khusus withdraw:** Response dari `POST /transactions/withdraw` langsung mengembalikan rincian kalkulasi bunga (`interest_earned`, `months_held`, `ending_balance`, dll) yang ditampilkan di modal summary — tidak perlu API call tambahan.

---

## Ringkasan per Endpoint

| Endpoint | Digunakan di Screen |
|----------|---------------------|
| GET `/customers` | Dashboard, Customers, Accounts |
| POST `/customers` | Customers |
| PUT `/customers/:id` | Customers |
| DELETE `/customers/:id` | Customers |
| GET `/deposito-types` | Dashboard, Deposito Types, Accounts |
| POST `/deposito-types` | Deposito Types |
| PUT `/deposito-types/:id` | Deposito Types |
| DELETE `/deposito-types/:id` | Deposito Types |
| GET `/accounts` | Dashboard, Accounts, Transactions |
| GET `/accounts/:id` | Accounts (detail) |
| GET `/accounts/customer/:id` | Accounts (filter) |
| POST `/accounts` | Accounts |
| PUT `/accounts/:id` | Accounts |
| DELETE `/accounts/:id` | Accounts |
| GET `/transactions/account/:id` | Transactions |
| POST `/transactions/deposit` | Transactions |
| POST `/transactions/withdraw` | Transactions |
