;; Tests for StackSafe Recovery Module

(use-trait ft-trait 'ST1HTBVD3JG9C05J7QQ0JMQFTW756V5SM2ZKHC66D.sip-010-trait-ft-standard.sip-010-trait)

;; Test: Add Guardian
(define-test "add-guardian-success"
  (let ((user 'ST1PQHQKV0RB24ZEM2PT8N0PQ8ZEN4AQKAM3PHWQ3))
    (asserts! (is-ok (contract-call? .stacksafe-recovery add-guardian 'ST4RVA3FDB4XEWRYC5YCFMYF9RSJJD28KZSXYFQ6))
      "Should successfully add guardian")
  )
)

;; Test: Remove Guardian
(define-test "remove-guardian-success"
  (let (
    (user 'ST1PQHQKV0RB24ZEM2PT8N0PQ8ZEN4AQKAM3PHWQ3)
    (guardian 'ST4RVA3FDB4XEWRYC5YCFMYF9RSJJD28KZSXYFQ6)
  )
    (contract-call? .stacksafe-recovery add-guardian guardian)
    (asserts! (is-ok (contract-call? .stacksafe-recovery remove-guardian guardian))
      "Should successfully remove guardian")
  )
)

;; Test: Get Guardians
(define-test "get-guardians"
  (let ((user 'ST1PQHQKV0RB24ZEM2PT8N0PQ8ZEN4AQKAM3PHWQ3))
    (asserts! (is-list (contract-call? .stacksafe-recovery get-guardians user))
      "Should return list of guardians")
  )
)

;; Test: Set Emergency Contact
(define-test "set-emergency-contact"
  (let ((user 'ST1PQHQKV0RB24ZEM2PT8N0PQ8ZEN4AQKAM3PHWQ3))
    (asserts! (is-ok (contract-call? .stacksafe-recovery 
      set-emergency-contact 
      0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
      0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321
      u"recovery@example.com"))
      "Should successfully set emergency contact")
  )
)

;; Test: Initiate Recovery
(define-test "initiate-recovery-with-guardians"
  (let ((user 'ST1PQHQKV0RB24ZEM2PT8N0PQ8ZEN4AQKAM3PHWQ3))
    (contract-call? .stacksafe-recovery add-guardian 'ST4RVA3FDB4XEWRYC5YCFMYF9RSJJD28KZSXYFQ6)
    (asserts! (is-ok (contract-call? .stacksafe-recovery 
      initiate-recovery 
      0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab
      "passkey_recovery"))
      "Should successfully initiate recovery")
  )
)

;; Test: Confirm Recovery (as Guardian)
(define-test "confirm-recovery-as-guardian"
  (let ((user 'ST1PQHQKV0RB24ZEM2PT8N0PQ8ZEN4AQKAM3PHWQ3))
    (contract-call? .stacksafe-recovery add-guardian 'ST4RVA3FDB4XEWRYC5YCFMYF9RSJJD28KZSXYFQ6)
    (contract-call? .stacksafe-recovery initiate-recovery 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab "passkey_recovery")
    ;; Note: This test should be run as the guardian principal
    (asserts! (is-ok (contract-call? .stacksafe-recovery confirm-recovery user))
      "Guardian should successfully confirm recovery")
  )
)

;; Test: Get Recovery Request
(define-test "get-recovery-request"
  (let ((user 'ST1PQHQKV0RB24ZEM2PT8N0PQ8ZEN4AQKAM3PHWQ3))
    (contract-call? .stacksafe-recovery add-guardian 'ST4RVA3FDB4XEWRYC5YCFMYF9RSJJD28KZSXYFQ6)
    (contract-call? .stacksafe-recovery initiate-recovery 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab "passkey_recovery")
    (asserts! (is-some (contract-call? .stacksafe-recovery get-recovery-request user))
      "Should return recovery request")
  )
)

;; Test: Get Recovery Progress
(define-test "get-recovery-progress"
  (let ((user 'ST1PQHQKV0RB24ZEM2PT8N0PQ8ZEN4AQKAM3PHWQ3))
    (contract-call? .stacksafe-recovery add-guardian 'ST4RVA3FDB4XEWRYC5YCFMYF9RSJJD28KZSXYFQ6)
    (contract-call? .stacksafe-recovery initiate-recovery 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab "passkey_recovery")
    (asserts! (is-some (contract-call? .stacksafe-recovery get-recovery-progress user))
      "Should return recovery progress")
  )
)

;; Test: Cancel Recovery
(define-test "cancel-recovery"
  (let ((user 'ST1PQHQKV0RB24ZEM2PT8N0PQ8ZEN4AQKAM3PHWQ3))
    (contract-call? .stacksafe-recovery add-guardian 'ST4RVA3FDB4XEWRYC5YCFMYF9RSJJD28KZSXYFQ6)
    (contract-call? .stacksafe-recovery initiate-recovery 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab "passkey_recovery")
    (asserts! (is-ok (contract-call? .stacksafe-recovery cancel-recovery user))
      "User should successfully cancel recovery")
  )
)

;; Test: Max Guardians Limit
(define-test "max-guardians-limit"
  (let ((user 'ST1PQHQKV0RB24ZEM2PT8N0PQ8ZEN4AQKAM3PHWQ3))
    (contract-call? .stacksafe-recovery add-guardian 'ST4RVA3FDB4XEWRYC5YCFMYF9RSJJD28KZSXYFQ6)
    (contract-call? .stacksafe-recovery add-guardian 'ST2NZM6VZW9JPG70MVDH34X9PSWYP78PPQG40NEK)
    (contract-call? .stacksafe-recovery add-guardian 'ST1JNKPEWCYVS3BZX2P9PQ7H30XQKZN5ZPVGQTM0S)
    (contract-call? .stacksafe-recovery add-guardian 'ST34P23M6N2Z1J5K8Q9XHVP1C5Z0A5B7D2E3F4G5H)
    (contract-call? .stacksafe-recovery add-guardian 'ST45R56T67U78V89W90X12Y34Z56A78B90C12D34E)
    (asserts! (is-err (contract-call? .stacksafe-recovery add-guardian 'ST56S67T78U89V90W01X23Y45Z67A89B01C23D45F))
      "Should fail when max guardians limit reached")
  )
)
