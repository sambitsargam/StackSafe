;; StackSafe Contract Tests
;; Tests for passkey registration, authentication, spending proposals, and approvals

(use-trait sip-010-trait 'SP3FBR2AGJ5H58LH7DF32GPFTNJFYFSG4YAJQ4VGX.sip-010-trait-ft-standard.sip-010-trait)

(define-constant test-user 'ST1SJ3DTE5DN7X54YDH5D64R3BJB2RRPZT2AQQER4)
(define-constant test-recipient 'ST2CY5V39NUAR67PVW2YZJK72UJJGD2ZCPGD4C4K5)
(define-constant test-approver 'ST2NEB84ASENDXKYGJPQW5QF6PK2MSQTZBBZUYY56)

;; Test: Register a passkey
(define-private (test-register-passkey)
  (let (
    (pubkey 0x037a6b62e3c8b14f1b5933f5d5ab0509a8e7d95a111b8d3b264d95bfa753b00296)
  )
    (asserts! (is-ok (contract-call? .stacksafe register-passkey pubkey)) "failed to register passkey")
    (asserts! (>= (len (contract-call? .stacksafe get-registered-passkeys test-user)) u1) "passkey not registered")
    true
  )
)

;; Test: Authenticate with challenge signature
(define-private (test-authenticate-challenge)
  (let (
    (pubkey 0x037a6b62e3c8b14f1b5933f5d5ab0509a8e7d95a111b8d3b264d95bfa753b00296)
    (challenge 0x033510403a646d23ee4f005061c2ca6af5da7c32c83758e8e9b6ac4cc1c2153c)
    (signature 0x9608dc164b76d2e19365ffa67b48981e441d323c3109718aee245d6ac8ccd21ddadadb94303c922c0d79d131ea59a0b6ba83e1157695db01189bb4b7e9f14b72)
  )
    (asserts! (is-ok (contract-call? .stacksafe register-passkey pubkey)) "failed to register")
    (asserts! (is-ok (contract-call? .stacksafe authenticate-challenge pubkey challenge signature)) "authentication failed")
    true
  )
)

;; Test: Set and get daily limit
(define-private (test-daily-limit)
  (let (
    (limit u10000000)
  )
    (asserts! (is-ok (contract-call? .stacksafe set-daily-limit test-user limit)) "failed to set limit")
    (asserts! (is-eq (contract-call? .stacksafe get-daily-limit test-user) limit) "limit not set correctly")
    true
  )
)

;; Test: Propose spend transaction
(define-private (test-propose-spend)
  (let (
    (amount u5000000)
    (timelock u0)
    (approvals u0)
  )
    (asserts! (is-ok (contract-call? .stacksafe propose-spend test-recipient amount timelock approvals)) "failed to propose")
    (asserts! (is-eq (contract-call? .stacksafe get-next-proposal-id-public) u1) "proposal ID not incremented")
    true
  )
)

;; Test: Approve spending proposal
(define-private (test-approve-spend)
  (let (
    (amount u5000000)
    (timelock u10)
    (approvals u1)
    (proposal-id u0)
  )
    (asserts! (is-ok (contract-call? .stacksafe propose-spend test-recipient amount timelock approvals)) "failed to propose")
    (asserts! (is-ok (contract-call? .stacksafe approve-spend proposal-id)) "failed to approve")
    (asserts! (is-some (contract-call? .stacksafe get-proposal proposal-id)) "proposal not found")
    true
  )
)

;; Test: Execute spend (timelock must pass)
(define-private (test-execute-spend)
  (let (
    (amount u1000000)
    (timelock u0)
    (approvals u0)
    (proposal-id u0)
  )
    (asserts! (is-ok (contract-call? .stacksafe propose-spend test-recipient amount timelock approvals)) "failed to propose")
    (asserts! (is-ok (contract-call? .stacksafe execute-spend proposal-id)) "failed to execute")
    true
  )
)

;; Test: Reject spend exceeding daily limit
(define-private (test-reject-over-limit)
  (let (
    (limit u1000000)
    (amount u5000000)
    (timelock u0)
    (approvals u0)
    (proposal-id u0)
  )
    (asserts! (is-ok (contract-call? .stacksafe set-daily-limit test-user limit)) "failed to set limit")
    (asserts! (is-ok (contract-call? .stacksafe propose-spend test-recipient amount timelock approvals)) "failed to propose")
    (asserts! (is-err (contract-call? .stacksafe execute-spend proposal-id)) "should reject over limit")
    true
  )
)

;; Run all tests
(print (test-register-passkey))
(print (test-authenticate-challenge))
(print (test-daily-limit))
(print (test-propose-spend))
(print (test-approve-spend))
(print (test-execute-spend))
(print (test-reject-over-limit))
