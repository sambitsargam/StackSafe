;; StackSafe Smart Contract — Passkey-Secured Wallet on Stacks
;; WebAuthn passkey authentication + multi-factor spending rules

(define-constant CONTRACT-OWNER tx-sender)

;; Data Storage
(define-map registered-passkeys principal (list 10 (buff 65)))
(define-map daily-limits principal uint)
(define-data-var proposal-counter uint u0)
(define-map spending-proposals
  uint
  {
    user: principal,
    to: principal,
    amount: uint,
    timelock-block: uint,
    approvals-needed: uint,
    approvals-given: uint,
    proposed-at-block: uint,
    executed: bool
  }
)
(define-map proposal-approvals uint (list 10 principal))

;; Helper Functions
(define-private (get-next-proposal-id)
  (let ((current (var-get proposal-counter)))
    (var-set proposal-counter (+ current u1))
    current
  )
)

(define-private (has-approved (proposal-id uint) (approver principal))
  (let ((approvals (default-to (list) (map-get? proposal-approvals proposal-id))))
    (is-some (index-of? approvals approver))
  )
)

;; Passkey Registration & Authentication
(define-public (register-passkey (pubkey (buff 65)))
  (let ((current-keys (default-to (list) (map-get? registered-passkeys tx-sender))))
    (if (and (> (len pubkey) u0) (<= (len pubkey) u65))
      (begin
        (if (is-none (index-of? current-keys pubkey))
          (begin
            (map-set registered-passkeys tx-sender (unwrap-panic (as-max-len? (append current-keys pubkey) u10)))
            (ok true)
          )
          (err u101)
        )
      )
      (err u100)
    )
  )
)

(define-public (authenticate-challenge 
  (pubkey (buff 65))
  (challenge-bytes (buff 32))
  (signature-bytes (buff 64))
)
  (let ((registered-keys (default-to (list) (map-get? registered-passkeys tx-sender))))
    (if (is-some (index-of? registered-keys pubkey))
      (if (secp256r1-verify pubkey challenge-bytes signature-bytes)
        (ok true)
        (err u201)
      )
      (err u200)
    )
  )
)

;; Daily Spending Limits
(define-public (set-daily-limit (user principal) (limit uint))
  (if (is-eq tx-sender CONTRACT-OWNER)
    (begin
      (map-set daily-limits user limit)
      (ok true)
    )
    (err u300)
  )
)

(define-read-only (get-daily-limit (user principal))
  (default-to u0 (map-get? daily-limits user))
)

;; Spending Proposals
(define-public (propose-spend 
  (to principal)
  (amount uint)
  (timelock-blocks uint)
  (approvals-needed uint)
)
  (let (
    (proposal-id (get-next-proposal-id))
    (timelock-block (+ stacks-block-time timelock-blocks))
    (daily-limit (get-daily-limit tx-sender))
  )
    (if (> amount u0)
      (begin
        (map-set spending-proposals
          proposal-id
          {
            user: tx-sender,
            to: to,
            amount: amount,
            timelock-block: timelock-block,
            approvals-needed: approvals-needed,
            approvals-given: u0,
            proposed-at-block: stacks-block-time,
            executed: false
          }
        )
        (map-set proposal-approvals proposal-id (list))
        (ok proposal-id)
      )
      (err u400)
    )
  )
)

(define-public (approve-spend (proposal-id uint))
  (match (map-get? spending-proposals proposal-id)
    proposal
      (if (get executed proposal)
        (err u502)
        (begin
          (if (has-approved proposal-id tx-sender)
            (err u503)
            (begin
              (map-set spending-proposals
                proposal-id
                (merge proposal {
                  approvals-given: (+ (get approvals-given proposal) u1)
                })
              )
              (let ((current-approvals (default-to (list) (map-get? proposal-approvals proposal-id))))
                (map-set proposal-approvals
                  proposal-id
                  (unwrap-panic (as-max-len? (append current-approvals tx-sender) u10))
                )
              )
              (ok true)
            )
          )
        )
      )
    (err u500)
  )
)

(define-public (execute-spend (proposal-id uint))
  (match (map-get? spending-proposals proposal-id)
    proposal
      (begin
        (if (get executed proposal)
          (err u601)
          (begin
            (if (< stacks-block-time (get timelock-block proposal))
              (err u602)
              (begin
                (if (< (get approvals-given proposal) (get approvals-needed proposal))
                  (err u603)
                  (begin
                    (let ((daily-limit (get-daily-limit (get user proposal))))
                      (if (and (> daily-limit u0) (> (get amount proposal) daily-limit))
                        (err u604)
                        (begin
                          (map-set spending-proposals
                            proposal-id
                            (merge proposal { executed: true })
                          )
                          (ok true)
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    (err u600)
  )
)

;; Read-Only Functions
(define-read-only (get-registered-passkeys (user principal))
  (default-to (list) (map-get? registered-passkeys user))
)

(define-read-only (get-proposal (proposal-id uint))
  (map-get? spending-proposals proposal-id)
)

(define-read-only (is-proposal-ready (proposal-id uint))
  (match (map-get? spending-proposals proposal-id)
    proposal
      (and
        (not (get executed proposal))
        (>= stacks-block-time (get timelock-block proposal))
        (>= (get approvals-given proposal) (get approvals-needed proposal))
      )
    false
  )
)

(define-read-only (get-proposal-approvals (proposal-id uint))
  (default-to (list) (map-get? proposal-approvals proposal-id))
)

(define-read-only (get-next-proposal-id-public)
  (var-get proposal-counter)
)
