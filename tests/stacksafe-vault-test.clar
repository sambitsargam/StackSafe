;; Tests for StackSafe Vault Manager

;; Test: Create Vault
(define-test "create-vault-operating"
  (asserts! (is-ok (contract-call? .stacksafe-vault 
    create-vault 
    "operating"
    "My Operating Account"
    u10000
    "Daily spending account"))
    "Should create operating vault")
)

(define-test "create-vault-savings"
  (asserts! (is-ok (contract-call? .stacksafe-vault 
    create-vault 
    "savings"
    "Emergency Savings"
    u50000
    "Long-term savings"))
    "Should create savings vault")
)

(define-test "create-vault-emergency"
  (asserts! (is-ok (contract-call? .stacksafe-vault 
    create-vault 
    "emergency"
    "Emergency Fund"
    u0
    "Emergency access only"))
    "Should create emergency vault")
)

(define-test "create-vault-invalid-type"
  (asserts! (is-err (contract-call? .stacksafe-vault 
    create-vault 
    "invalid_type"
    "Bad Vault"
    u1000
    "Should fail"))
    "Should reject invalid vault type")
)

;; Test: Get Vault
(define-test "get-vault-info"
  (let ((vault-id-result (contract-call? .stacksafe-vault 
    create-vault 
    "operating"
    "Test Vault"
    u5000
    "Test metadata")))
    (match vault-id-result
      vault-id
        (asserts! (is-some (contract-call? .stacksafe-vault get-vault vault-id))
          "Should retrieve vault info")
      (asserts! false "Should create vault first")
    )
  )
)

;; Test: Deposit to Vault
(define-test "deposit-to-vault"
  (let ((vault-id-result (contract-call? .stacksafe-vault 
    create-vault 
    "operating"
    "Deposit Test"
    u10000
    "")))
    (match vault-id-result
      vault-id
        (asserts! (is-ok (contract-call? .stacksafe-vault deposit-to-vault vault-id u1000))
          "Should deposit to vault")
      (asserts! false "Should create vault")
    )
  )
)

;; Test: Withdraw from Vault
(define-test "withdraw-from-vault"
  (let (
    (vault-id-result (contract-call? .stacksafe-vault 
      create-vault 
      "operating"
      "Withdraw Test"
      u10000
      ""))
  )
    (match vault-id-result
      vault-id
        (begin
          (contract-call? .stacksafe-vault deposit-to-vault vault-id u5000)
          (asserts! (is-ok (contract-call? .stacksafe-vault 
            withdraw-from-vault vault-id 'ST1PQHQKV0RB24ZEM2PT8N0PQ8ZEN4AQKAM3PHWQ3 u1000))
            "Should withdraw from vault")
        )
      (asserts! false "Should create vault")
    )
  )
)

;; Test: Set Monthly Limit
(define-test "set-monthly-limit"
  (let ((vault-id-result (contract-call? .stacksafe-vault 
    create-vault 
    "operating"
    "Limit Test"
    u5000
    "")))
    (match vault-id-result
      vault-id
        (asserts! (is-ok (contract-call? .stacksafe-vault set-monthly-limit vault-id u15000))
          "Should update monthly limit")
      (asserts! false "Should create vault")
    )
  )
)

;; Test: Reset Monthly Spent
(define-test "reset-monthly-spent"
  (let ((vault-id-result (contract-call? .stacksafe-vault 
    create-vault 
    "operating"
    "Reset Test"
    u10000
    "")))
    (match vault-id-result
      vault-id
        (asserts! (is-ok (contract-call? .stacksafe-vault reset-monthly-spent vault-id))
          "Should reset monthly spent")
      (asserts! false "Should create vault")
    )
  )
)

;; Test: Toggle Vault Active
(define-test "toggle-vault-active"
  (let ((vault-id-result (contract-call? .stacksafe-vault 
    create-vault 
    "operating"
    "Toggle Test"
    u5000
    "")))
    (match vault-id-result
      vault-id
        (asserts! (is-ok (contract-call? .stacksafe-vault toggle-vault-active vault-id false))
          "Should toggle vault active status")
      (asserts! false "Should create vault")
    )
  )
)

;; Test: Approve Vault Spender
(define-test "approve-vault-spender"
  (let ((vault-id-result (contract-call? .stacksafe-vault 
    create-vault 
    "operating"
    "Spender Test"
    u5000
    "")))
    (match vault-id-result
      vault-id
        (asserts! (is-ok (contract-call? .stacksafe-vault 
          approve-vault-spender 
          vault-id 
          'ST4RVA3FDB4XEWRYC5YCFMYF9RSJJD28KZSXYFQ6
          u1000))
          "Should approve spender")
      (asserts! false "Should create vault")
    )
  )
)

;; Test: Revoke Vault Spender
(define-test "revoke-vault-spender"
  (let ((vault-id-result (contract-call? .stacksafe-vault 
    create-vault 
    "operating"
    "Revoke Test"
    u5000
    "")))
    (match vault-id-result
      vault-id
        (begin
          (contract-call? .stacksafe-vault 
            approve-vault-spender 
            vault-id 
            'ST4RVA3FDB4XEWRYC5YCFMYF9RSJJD28KZSXYFQ6
            u1000)
          (asserts! (is-ok (contract-call? .stacksafe-vault revoke-vault-spender vault-id))
            "Should revoke spender")
        )
      (asserts! false "Should create vault")
    )
  )
)

;; Test: Get User Vaults
(define-test "get-user-vaults"
  (let ((user 'ST1PQHQKV0RB24ZEM2PT8N0PQ8ZEN4AQKAM3PHWQ3))
    (contract-call? .stacksafe-vault create-vault "operating" "Vault 1" u5000 "")
    (contract-call? .stacksafe-vault create-vault "savings" "Vault 2" u10000 "")
    (asserts! (is-list (contract-call? .stacksafe-vault get-user-vaults user))
      "Should return list of vaults")
  )
)

;; Test: Get Vault Status
(define-test "get-vault-status"
  (let ((vault-id-result (contract-call? .stacksafe-vault 
    create-vault 
    "operating"
    "Status Test"
    u10000
    "")))
    (match vault-id-result
      vault-id
        (asserts! (is-some (contract-call? .stacksafe-vault get-vault-status vault-id))
          "Should return vault status")
      (asserts! false "Should create vault")
    )
  )
)

;; Test: Can Spend
(define-test "can-spend-check"
  (let ((vault-id-result (contract-call? .stacksafe-vault 
    create-vault 
    "operating"
    "Can Spend Test"
    u5000
    "")))
    (match vault-id-result
      vault-id
        (begin
          (contract-call? .stacksafe-vault deposit-to-vault vault-id u3000)
          (asserts! (contract-call? .stacksafe-vault can-spend vault-id u2000)
            "Should be able to spend within limit")
        )
      (asserts! false "Should create vault")
    )
  )
)

;; Test: User Total Balance
(define-test "get-user-total-balance"
  (let ((user 'ST1PQHQKV0RB24ZEM2PT8N0PQ8ZEN4AQKAM3PHWQ3))
    (contract-call? .stacksafe-vault create-vault "operating" "Balance Vault 1" u5000 "")
    (contract-call? .stacksafe-vault create-vault "savings" "Balance Vault 2" u10000 "")
    (asserts! (is-some (contract-call? .stacksafe-vault get-user-total-balance user))
      "Should return total balance across vaults")
  )
)

;; Test: Set Vault Allocation
(define-test "set-vault-allocation"
  (asserts! (is-ok (contract-call? .stacksafe-vault 
    set-vault-allocation 
    (list 
      { vault-id: u0, allocation-percent: u60 }
      { vault-id: u1, allocation-percent: u40 }
    )))
    "Should set vault allocations")
)

;; Test: Invalid Allocation Percent
(define-test "invalid-allocation-percent"
  (asserts! (is-err (contract-call? .stacksafe-vault 
    set-vault-allocation 
    (list 
      { vault-id: u0, allocation-percent: u60 }
      { vault-id: u1, allocation-percent: u30 }
    )))
    "Should reject allocations that don't sum to 100%")
)

;; Test: Max Vaults Limit
(define-test "max-vaults-limit"
  (let ((user 'ST1PQHQKV0RB24ZEM2PT8N0PQ8ZEN4AQKAM3PHWQ3))
    (contract-call? .stacksafe-vault create-vault "operating" "V1" u1000 "")
    (contract-call? .stacksafe-vault create-vault "savings" "V2" u1000 "")
    (contract-call? .stacksafe-vault create-vault "emergency" "V3" u1000 "")
    (contract-call? .stacksafe-vault create-vault "investment" "V4" u1000 "")
    (contract-call? .stacksafe-vault create-vault "operating" "V5" u1000 "")
    (contract-call? .stacksafe-vault create-vault "savings" "V6" u1000 "")
    (contract-call? .stacksafe-vault create-vault "emergency" "V7" u1000 "")
    (contract-call? .stacksafe-vault create-vault "investment" "V8" u1000 "")
    (contract-call? .stacksafe-vault create-vault "operating" "V9" u1000 "")
    (contract-call? .stacksafe-vault create-vault "savings" "V10" u1000 "")
    (asserts! (is-err (contract-call? .stacksafe-vault create-vault "emergency" "V11" u1000 ""))
      "Should reject creation when max vaults reached")
  )
)
