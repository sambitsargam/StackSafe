;; StackSafe Vault Manager — Multi-Vault Asset Management
;; Manage multiple vaults with different spending rules and asset types

(define-constant CONTRACT-OWNER tx-sender)
(define-constant MAX-VAULTS u10)
(define-constant VAULT-TYPES (list "operating" "savings" "emergency" "investment"))

;; Data Storage
(define-map user-vaults principal (list 10 uint))
(define-data-var vault-counter uint u0)
(define-map vault-data
  uint
  {
    owner: principal,
    vault-type: (string-ascii 20),
    name: (string-ascii 50),
    balance: uint,
    monthly-limit: uint,
    monthly-spent: uint,
    last-reset-month: uint,
    is-active: bool,
    created-at-block: uint,
    metadata: (string-ascii 256)
  }
)
(define-map vault-transactions
  uint
  (list 100 {
    from-vault: uint,
    to: principal,
    amount: uint,
    tx-type: (string-ascii 20),
    timestamp: uint
  })
)
(define-map vault-permissions
  uint
  {
    spender: principal,
    allowed-amount: uint,
    is-approved: bool
  }
)
(define-map vault-allocations
  principal
  (list 10 {
    vault-id: uint,
    allocation-percent: uint
  })
)

;; Helper Functions
(define-private (get-next-vault-id)
  (let ((current (var-get vault-counter)))
    (var-set vault-counter (+ current u1))
    current
  )
)

(define-private (validate-vault-type (vault-type (string-ascii 20)))
  (or
    (is-eq vault-type "operating")
    (or
      (is-eq vault-type "savings")
      (or
        (is-eq vault-type "emergency")
        (is-eq vault-type "investment")
      )
    )
  )
)

(define-private (can-spend-from-vault (vault-id uint) (amount uint))
  (match (map-get? vault-data vault-id)
    vault
      (and
        (is-eq (get owner vault) tx-sender)
        (get is-active vault)
        (>= (get balance vault) amount)
        (or
          (is-eq (get monthly-limit vault) u0)
          (<= (+ (get monthly-spent vault) amount) (get monthly-limit vault))
        )
      )
    false
  )
)

;; Vault Creation & Management
(define-public (create-vault 
  (vault-type (string-ascii 20))
  (name (string-ascii 50))
  (monthly-limit uint)
  (metadata (string-ascii 256))
)
  (let (
    (vault-id (get-next-vault-id))
    (user-vaults (default-to (list) (map-get? user-vaults tx-sender)))
  )
    (if (and
      (validate-vault-type vault-type)
      (< (len user-vaults) MAX-VAULTS)
      (> (string-len name) u0)
    )
      (begin
        (map-set vault-data vault-id {
          owner: tx-sender,
          vault-type: vault-type,
          name: name,
          balance: u0,
          monthly-limit: monthly-limit,
          monthly-spent: u0,
          last-reset-month: stacks-block-height,
          is-active: true,
          created-at-block: stacks-block-height,
          metadata: metadata
        })
        (map-set user-vaults tx-sender 
          (unwrap-panic (as-max-len? (append user-vaults vault-id) MAX-VAULTS))
        )
        (map-set vault-transactions vault-id (list))
        (ok vault-id)
      )
      (err u101)
    )
  )
)

(define-public (deposit-to-vault (vault-id uint) (amount uint))
  (match (map-get? vault-data vault-id)
    vault
      (if (is-eq (get owner vault) tx-sender)
        (begin
          (map-set vault-data vault-id
            (merge vault {
              balance: (+ (get balance vault) amount)
            })
          )
          (ok true)
        )
        (err u201) ;; Not vault owner
      )
    (err u200) ;; Vault not found
  )
)

(define-public (withdraw-from-vault (vault-id uint) (to principal) (amount uint))
  (if (can-spend-from-vault vault-id amount)
    (match (map-get? vault-data vault-id)
      vault
        (begin
          (map-set vault-data vault-id
            (merge vault {
              balance: (- (get balance vault) amount),
              monthly-spent: (+ (get monthly-spent vault) amount)
            })
          )
          (ok true)
        )
      (err u300)
    )
    (err u301) ;; Cannot withdraw - limit exceeded or insufficient balance
  )
)

(define-public (set-monthly-limit (vault-id uint) (new-limit uint))
  (match (map-get? vault-data vault-id)
    vault
      (if (is-eq (get owner vault) tx-sender)
        (begin
          (map-set vault-data vault-id
            (merge vault { monthly-limit: new-limit })
          )
          (ok true)
        )
        (err u401)
      )
    (err u400)
  )
)

(define-public (reset-monthly-spent (vault-id uint))
  (match (map-get? vault-data vault-id)
    vault
      (if (is-eq (get owner vault) tx-sender)
        (begin
          (map-set vault-data vault-id
            (merge vault {
              monthly-spent: u0,
              last-reset-month: stacks-block-height
            })
          )
          (ok true)
        )
        (err u501)
      )
    (err u500)
  )
)

(define-public (toggle-vault-active (vault-id uint) (is-active bool))
  (match (map-get? vault-data vault-id)
    vault
      (if (is-eq (get owner vault) tx-sender)
        (begin
          (map-set vault-data vault-id
            (merge vault { is-active: is-active })
          )
          (ok true)
        )
        (err u601)
      )
    (err u600)
  )
)

;; Vault Permissions
(define-public (approve-vault-spender (vault-id uint) (spender principal) (allowed-amount uint))
  (match (map-get? vault-data vault-id)
    vault
      (if (is-eq (get owner vault) tx-sender)
        (begin
          (map-set vault-permissions vault-id {
            spender: spender,
            allowed-amount: allowed-amount,
            is-approved: true
          })
          (ok true)
        )
        (err u701)
      )
    (err u700)
  )
)

(define-public (revoke-vault-spender (vault-id uint))
  (match (map-get? vault-data vault-id)
    vault
      (if (is-eq (get owner vault) tx-sender)
        (begin
          (map-delete vault-permissions vault-id)
          (ok true)
        )
        (err u801)
      )
    (err u800)
  )
)

(define-read-only (get-vault-spender-permission (vault-id uint))
  (map-get? vault-permissions vault-id)
)

;; Asset Allocation
(define-public (set-vault-allocation (allocations (list 10 {vault-id: uint, allocation-percent: uint})))
  (let ((total-percent (fold + (map (lambda (a) (get allocation-percent a)) allocations) u0)))
    (if (or (is-eq total-percent u100) (is-eq total-percent u0))
      (begin
        (map-set vault-allocations tx-sender allocations)
        (ok true)
      )
      (err u901) ;; Allocations must sum to 100% or 0%
    )
  )
)

(define-read-only (get-vault-allocation (user principal))
  (default-to (list) (map-get? vault-allocations user))
)

;; Read-Only Functions
(define-read-only (get-vault (vault-id uint))
  (map-get? vault-data vault-id)
)

(define-read-only (get-user-vaults (user principal))
  (default-to (list) (map-get? user-vaults user))
)

(define-read-only (get-vault-count (user principal))
  (len (get-user-vaults user))
)

(define-read-only (get-user-total-balance (user principal))
  (let (
    (vault-ids (get-user-vaults user))
    (balances (map 
      (lambda (id) 
        (match (map-get? vault-data id)
          vault (get balance vault)
          u0
        )
      )
      vault-ids
    ))
  )
    (fold + balances u0)
  )
)

(define-read-only (get-vault-status (vault-id uint))
  (match (map-get? vault-data vault-id)
    vault
      {
        balance: (get balance vault),
        monthly-limit: (get monthly-limit vault),
        monthly-spent: (get monthly-spent vault),
        remaining-this-month: (if (> (get monthly-limit vault) u0)
          (- (get monthly-limit vault) (get monthly-spent vault))
          u0
        ),
        is-active: (get is-active vault),
        vault-type: (get vault-type vault),
        name: (get name vault)
      }
    {
      balance: u0,
      monthly-limit: u0,
      monthly-spent: u0,
      remaining-this-month: u0,
      is-active: false,
      vault-type: "",
      name: ""
    }
  )
)

(define-read-only (can-spend (vault-id uint) (amount uint))
  (can-spend-from-vault vault-id amount)
)

(define-read-only (get-next-vault-id-public)
  (var-get vault-counter)
)
