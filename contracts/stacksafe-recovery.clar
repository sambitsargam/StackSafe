;; StackSafe Recovery Module — Account Recovery & Emergency Access
;; Allows users to set up recovery guardians and emergency access procedures

(define-constant CONTRACT-OWNER tx-sender)
(define-constant MAX-GUARDIANS u5)
(define-constant RECOVERY-DELAY-BLOCKS u144) ;; ~24 hours on Stacks

;; Data Storage
(define-map user-guardians principal (list 5 principal))
(define-map recovery-requests
  principal
  {
    requester: principal,
    new-passkey: (buff 65),
    confirmed-guardians: (list 5 principal),
    required-confirmations: uint,
    initiated-at-block: uint,
    executed: bool,
    recovery-type: (string-ascii 20)
  }
)
(define-map guardian-confirmations principal (list 10 principal))
(define-map emergency-contacts principal {
  email-hash: (buff 32),
  phone-hash: (buff 32),
  recovery-email: (buff 128),
  last-updated: uint
})

;; Helper Functions
(define-private (has-guardian-confirmed (user principal) (guardian principal))
  (let ((confirmations (default-to (list) (map-get? guardian-confirmations user))))
    (is-some (index-of? confirmations guardian))
  )
)

(define-private (count-unique-guardians (user principal) (confirmations (list 10 principal)))
  (len confirmations)
)

;; Guardian Management
(define-public (add-guardian (guardian principal))
  (let ((current-guardians (default-to (list) (map-get? user-guardians tx-sender))))
    (if (< (len current-guardians) MAX-GUARDIANS)
      (if (is-none (index-of? current-guardians guardian))
        (begin
          (map-set user-guardians tx-sender 
            (unwrap-panic (as-max-len? (append current-guardians guardian) MAX-GUARDIANS))
          )
          (ok true)
        )
        (err u101) ;; Guardian already exists
      )
      (err u102) ;; Max guardians reached
    )
  )
)

(define-public (remove-guardian (guardian principal))
  (let ((current-guardians (default-to (list) (map-get? user-guardians tx-sender))))
    (match (index-of? current-guardians guardian)
      index
        (begin
          (let ((updated-guardians (unwrap-panic (as-max-len? 
            (filter (lambda (g) (not (is-eq g guardian))) current-guardians) 
            MAX-GUARDIANS
          ))))
            (map-set user-guardians tx-sender updated-guardians)
          )
          (ok true)
        )
      (err u103) ;; Guardian not found
    )
  )
)

(define-read-only (get-guardians (user principal))
  (default-to (list) (map-get? user-guardians user))
)

(define-read-only (get-guardian-count (user principal))
  (len (get-guardians user))
)

;; Emergency Contact Management
(define-public (set-emergency-contact 
  (email-hash (buff 32))
  (phone-hash (buff 32))
  (recovery-email (buff 128))
)
  (begin
    (map-set emergency-contacts tx-sender {
      email-hash: email-hash,
      phone-hash: phone-hash,
      recovery-email: recovery-email,
      last-updated: stacks-block-height
    })
    (ok true)
  )
)

(define-read-only (get-emergency-contact (user principal))
  (map-get? emergency-contacts user)
)

;; Recovery Request System
(define-public (initiate-recovery 
  (new-passkey (buff 65))
  (recovery-type (string-ascii 20))
)
  (let (
    (guardians (get-guardians tx-sender))
    (guardian-count (len guardians))
    (required-confirmations (+ (/ guardian-count u2) u1)) ;; Majority required
  )
    (if (> guardian-count u0)
      (begin
        (map-set recovery-requests tx-sender {
          requester: tx-sender,
          new-passkey: new-passkey,
          confirmed-guardians: (list),
          required-confirmations: required-confirmations,
          initiated-at-block: stacks-block-height,
          executed: false,
          recovery-type: recovery-type
        })
        (map-set guardian-confirmations tx-sender (list))
        (ok true)
      )
      (err u201) ;; No guardians configured
    )
  )
)

(define-public (confirm-recovery (user principal))
  (let (
    (guardians (get-guardians user))
    (confirmations (default-to (list) (map-get? guardian-confirmations user)))
  )
    (if (is-some (index-of? guardians tx-sender))
      (if (not (has-guardian-confirmed user tx-sender))
        (begin
          (map-set guardian-confirmations user
            (unwrap-panic (as-max-len? (append confirmations tx-sender) u10))
          )
          (ok true)
        )
        (err u303) ;; Already confirmed
      )
      (err u302) ;; Not a guardian
    )
  )
)

(define-public (execute-recovery (user principal))
  (match (map-get? recovery-requests user)
    request
      (let (
        (guardians (get-guardians user))
        (confirmations (default-to (list) (map-get? guardian-confirmations user)))
        (required-confirmations (get required-confirmations request))
        (blocks-elapsed (- stacks-block-height (get initiated-at-block request)))
      )
        (if (get executed request)
          (err u404) ;; Already executed
          (if (< blocks-elapsed RECOVERY-DELAY-BLOCKS)
            (err u402) ;; Recovery delay not met
            (if (< (len confirmations) required-confirmations)
              (err u403) ;; Not enough confirmations
              (begin
                (map-set recovery-requests user
                  (merge request { executed: true })
                )
                (ok true)
              )
            )
          )
        )
      )
    (err u401) ;; No recovery request found
  )
)

(define-public (cancel-recovery (user principal))
  (if (is-eq tx-sender user)
    (match (map-get? recovery-requests user)
      request
        (if (get executed request)
          (err u501) ;; Already executed
          (begin
            (map-delete recovery-requests user)
            (map-delete guardian-confirmations user)
            (ok true)
          )
        )
      (err u500) ;; No recovery request found
    )
    (err u502) ;; Only user can cancel
  )
)

;; Read-Only Functions
(define-read-only (get-recovery-request (user principal))
  (map-get? recovery-requests user)
)

(define-read-only (get-recovery-confirmations (user principal))
  (default-to (list) (map-get? guardian-confirmations user))
)

(define-read-only (is-recovery-ready (user principal))
  (match (map-get? recovery-requests user)
    request
      (let (
        (confirmations (default-to (list) (map-get? guardian-confirmations user)))
        (required-confirmations (get required-confirmations request))
        (blocks-elapsed (- stacks-block-height (get initiated-at-block request)))
      )
        (and
          (not (get executed request))
          (>= blocks-elapsed RECOVERY-DELAY-BLOCKS)
          (>= (len confirmations) required-confirmations)
        )
      )
    false
  )
)

(define-read-only (get-recovery-progress (user principal))
  (match (map-get? recovery-requests user)
    request
      {
        confirmed: (len (default-to (list) (map-get? guardian-confirmations user))),
        required: (get required-confirmations request),
        blocks-remaining: (let ((blocks-elapsed (- stacks-block-height (get initiated-at-block request))))
          (if (< blocks-elapsed RECOVERY-DELAY-BLOCKS)
            (- RECOVERY-DELAY-BLOCKS blocks-elapsed)
            u0
          )
        ),
        recovery-type: (get recovery-type request),
        executed: (get executed request)
      }
    {
      confirmed: u0,
      required: u0,
      blocks-remaining: u0,
      recovery-type: "",
      executed: false
    }
  )
)
