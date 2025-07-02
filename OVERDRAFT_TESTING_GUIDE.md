# 🚨 **Edge Case Handling: Overdraft System - Testing Guide**

## 📋 **Overview**

Sistem balance management telah diupdate untuk menangani edge case **balance negatif** dengan 2 pendekatan utama:

### **🎯 Pendekatan yang Diimplementasi:**

1. **Overdraft Limit System** - Mengizinkan balance negatif sampai batas tertentu
2. **Enhanced Alert & Warning System** - Alert yang lebih detail dengan kategorisasi overdraft

---

## 🔧 **Key Features yang Ditambahkan:**

### **1. Overdraft Rules per Benefit Type:**

-   **Medical**: 50% overdraft (emergency situations)
-   **Dental**: 20% overdraft
-   **Maternity**: 30% overdraft
-   **Glasses**: 10% overdraft
-   **Default**: 25% overdraft

### **2. Transaction Control:**

-   `allow_overdraft`: Manual override untuk exceed limit
-   `is_emergency`: Emergency flag untuk medical claims
-   Detailed error messages dengan shortage calculation

### **3. Enhanced Balance Status:**

-   Real-time overdraft information
-   Available credit vs available overdraft
-   Status categorization

### **4. Improved Alert System:**

-   `warning` - 10-20% remaining
-   `high` - 5-10% remaining
-   `critical` - 0-5% remaining
-   `critical_overdrawn` - Balance negatif dalam limit
-   `critical_overdraft_exceeded` - Melebihi overdraft limit

---

## 🧪 **Testing Scenarios**

### **Test 1: Check Balance Status (NEW ENDPOINT)**

```bash
GET /api/v1/employee-balances/status?employee_id=3&benefit_type_id=1&year=2024
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response:**

```json
{
    "status": 200,
    "message": "Balance status retrieved successfully",
    "data": {
        "employee": {
            "id": 3,
            "name": "ERRIN TARUNA",
            "nik": "2340860"
        },
        "benefit_type": {
            "id": 1,
            "name": "medical"
        },
        "balance_info": {
            "initial_budget": 900000,
            "current_balance": -3306463,
            "used_amount": 4206463,
            "overdraft_limit": -450000,
            "available_credit": 0,
            "available_overdraft": 0,
            "status": "overdraft_exceeded",
            "is_overdrawn": true,
            "overdraft_amount": 3306463,
            "usage_percentage": 467.38
        },
        "year": 2024
    }
}
```

### **Test 2: Enhanced Low Balance Alerts**

```bash
GET /api/v1/employee-balances/alerts?threshold_percentage=20&year=2024
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response with Overdraft Info:**

```json
{
    "status": 200,
    "message": "Low balance alerts retrieved successfully",
    "data": {
        "threshold_percentage": 20,
        "alerts": [
            {
                "employee": {
                    "id": 3,
                    "name": "ERRIN TARUNA",
                    "nik": "2340860",
                    "department": "ACC & FIN"
                },
                "benefit_type": {
                    "id": 1,
                    "name": "medical"
                },
                "initial_balance": 900000,
                "current_balance": -3306463,
                "used_amount": 4206463,
                "usage_percentage": 467.38,
                "remaining_percentage": -367.38,
                "alert_level": "critical_overdraft_exceeded",
                "overdraft_info": {
                    "is_overdrawn": true,
                    "overdraft_amount": 3306463,
                    "overdraft_limit": -450000,
                    "exceeds_overdraft_limit": true,
                    "available_overdraft": 0
                }
            }
        ],
        "total_alerts": 7
    }
}
```

### **Test 3: Process Transaction with Overdraft Protection**

#### **3a. Normal Transaction (Should Fail)**

```bash
POST /api/v1/employee-balances/process-transaction
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "employee_id": 5,
  "benefit_type_id": 1,
  "transaction_type": "debit",
  "amount": 100000,
  "reference_type": "claim",
  "description": "Regular medical claim",
  "year": 2024
}
```

**Expected Response (if would exceed overdraft):**

```json
{
    "status": 400,
    "message": "Transaction would exceed overdraft limit. Current balance: 82,154, Overdraft limit: -450,000, Shortage: 17,846",
    "data": null
}
```

#### **3b. Emergency Transaction (Should Pass)**

```bash
POST /api/v1/employee-balances/process-transaction
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "employee_id": 5,
  "benefit_type_id": 1,
  "transaction_type": "debit",
  "amount": 200000,
  "reference_type": "claim",
  "description": "Emergency medical claim",
  "year": 2024,
  "is_emergency": true
}
```

**Expected Response:**

```json
{
    "status": 200,
    "message": "Balance transaction processed successfully",
    "data": {
        "transaction_id": "TXN-20241216-001",
        "employee": {
            "id": 5,
            "name": "FELYA GABI MEGAN",
            "nik": "1540763"
        },
        "transaction_type": "debit",
        "amount": 200000,
        "balance_before": 82154,
        "balance_after": -117846,
        "description": "Emergency medical claim"
    }
}
```

#### **3c. Manual Override Transaction**

```bash
POST /api/v1/employee-balances/process-transaction
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "employee_id": 8,
  "benefit_type_id": 1,
  "transaction_type": "debit",
  "amount": 500000,
  "reference_type": "claim",
  "description": "Special approved claim",
  "year": 2024,
  "allow_overdraft": true
}
```

### **Test 4: Multiple Scenario Testing**

#### **Create Test Transactions to Verify Limits:**

1. **Employee dengan balance positif** - Test normal flow
2. **Employee dengan balance negatif dalam limit** - Test overdraft allowed
3. **Employee yang exceed overdraft limit** - Test protection

---

## 📊 **Overdraft Limits Reference**

| Benefit Type | Initial Budget | Overdraft Limit | Max Negative Balance |
| ------------ | -------------- | --------------- | -------------------- |
| Medical      | 900,000        | -450,000        | -450,000             |
| Medical      | 1,125,000      | -562,500        | -562,500             |
| Medical      | 1,250,000      | -625,000        | -625,000             |
| Dental       | Any amount     | -20% of budget  | Calculated           |
| Maternity    | Any amount     | -30% of budget  | Calculated           |
| Glasses      | Any amount     | -10% of budget  | Calculated           |

---

## 🚀 **Testing Flow Recommendations**

### **Step 1: Check Current Status**

```bash
# Check employee with negative balance
GET /api/v1/employee-balances/status?employee_id=3&benefit_type_id=1&year=2024

# Check employee with low balance
GET /api/v1/employee-balances/status?employee_id=5&benefit_type_id=1&year=2024
```

### **Step 2: Test Protection Mechanisms**

```bash
# Try to process transaction that would exceed limit (should fail)
POST /api/v1/employee-balances/process-transaction
{
  "employee_id": 3,
  "benefit_type_id": 1,
  "transaction_type": "debit",
  "amount": 1000000,
  "reference_type": "claim",
  "year": 2024
}
```

### **Step 3: Test Emergency Override**

```bash
# Same transaction with emergency flag (should pass)
POST /api/v1/employee-balances/process-transaction
{
  "employee_id": 3,
  "benefit_type_id": 1,
  "transaction_type": "debit",
  "amount": 500000,
  "reference_type": "claim",
  "year": 2024,
  "is_emergency": true
}
```

### **Step 4: Verify Enhanced Alerts**

```bash
# Check if alerts show proper overdraft information
GET /api/v1/employee-balances/alerts?threshold_percentage=20&year=2024
```

---

## ✅ **Expected Behaviors**

### **🟢 PASS Scenarios:**

-   Emergency medical claims even if exceed overdraft
-   Manual override with `allow_overdraft: true`
-   Credit transactions (always allowed)
-   Debit transactions within overdraft limits

### **🔴 FAIL Scenarios:**

-   Regular debit exceeding overdraft limit
-   Non-emergency claims without override
-   Transactions that would create excessive debt

### **📊 ENHANCED Scenarios:**

-   Better alert categorization
-   Detailed overdraft information in responses
-   Clear error messages with shortage amounts
-   Real-time balance status with overdraft details

---

## 🎯 **Key Benefits of This Implementation**

1. **🛡️ Protection**: Prevents unlimited debt with configurable limits
2. **🚨 Flexibility**: Emergency override untuk situasi urgent
3. **📈 Visibility**: Enhanced alerts dan status information
4. **⚖️ Balance**: Antara business flexibility dan financial control
5. **🔍 Transparency**: Clear error messages dan detailed responses

---

Sistem ini memberikan solusi terbaik untuk menangani edge case balance negatif sambil menjaga kontrol finansial yang baik! 🎉
