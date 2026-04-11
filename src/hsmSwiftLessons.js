export const hsmSwiftLessons = [
  {
    time: "Hour 1",
    title: "What Is an HSM? — The Unbreakable Safe for Keys",
    concept: [
      "**Hardware Security Module (HSM)** is a physical device — usually a 1U rackmount box — that stores cryptographic keys and performs signing, encryption, and decryption. The critical rule: **private keys are generated inside the HSM and never leave it in plaintext.** Think of it as a bank vault that does math — data goes in, answers come out, but the secret keys never come out.",
      "**Why not just use software?** Software keys sit on a disk somewhere. Anyone with admin access to the server can copy them. An HSM has a **tamper-resistant boundary** — if someone tries to physically open it, drill into it, freeze it, or apply voltage attacks, the HSM automatically **zeroizes** (destroys) all keys inside. This is called tamper detection and response.",
      "**FIPS 140-2 Level 3** is a US government security certification. It means the HSM has been independently tested and proven to resist physical tampering. SWIFT requires this level for protecting signing keys. The Thales Luna Network HSM 7 is the most common HSM used in SWIFT environments.",
      "**How fast is it?** A Luna HSM 7 can do about **1,000 RSA-2048 signatures per second**. That's more than enough for even the busiest banks. For comparison, software signing on a regular server does about 100 ops/sec. The HSM also has a **True Random Number Generator (TRNG)** — real hardware randomness, not pseudo-random software.",
      "**Key specs at a glance:** Up to 100 partitions per appliance, dual Gigabit Ethernet, ~16,000 RSA-2048 key storage capacity, and authentication via password or Luna PED (a physical PIN entry device for multi-factor auth).",
      "**The PKCS#11 API** is the standard interface that applications use to talk to HSMs. It defines functions like `C_Sign()`, `C_Encrypt()`, `C_GenerateKeyPair()`. The beauty of PKCS#11 is that **your code doesn't change** when you switch HSM vendors — only the DLL/library path changes. Our demo uses SoftHSM2 (a software HSM) with the exact same API calls that a real Thales Luna HSM uses.",
    ],
    code: `# PKCS#11 is the universal HSM interface
# The ONLY thing that changes between dev and prod is the DLL path:

# Development (SoftHSM2 — free, software-based)
PKCS11_MODULE = r"C:\\SoftHSM2\\lib\\softhsm2-x64.dll"

# Production (Thales Luna — $20,000-$50,000 hardware)
PKCS11_MODULE = r"C:\\Program Files\\SafeNet\\LunaClient\\lib\\libCryptoki2.dll"

# The API calls are IDENTICAL:
from PyKCS11 import *
lib = PyKCS11Lib()
lib.load(PKCS11_MODULE)          # C_Initialize()
session = lib.openSession(slot)  # C_OpenSession()
session.login("1234")            # C_Login()
keys = session.findObjects(...)  # C_FindObjects()
sig = session.sign(key, data, mechanism)  # C_Sign()
session.logout()                 # C_Logout()`,
    practice: "Research what FIPS 140-2 Level 3 requires vs Level 2. Why does SWIFT mandate Level 3? What specific physical protections does Level 3 add?",
    solution: `FIPS 140-2 Levels:
- Level 1: No physical security. Software only.
- Level 2: Tamper-evident seals (you can SEE if someone tampered, but can't prevent it).
- Level 3: Tamper-resistant + tamper-response. Active circuits detect intrusion and
  automatically ZEROIZE (destroy) all keys. Also requires identity-based authentication
  (not just passwords) and physical separation between interfaces.
- Level 4: Highest. Environmental protections (voltage, temperature).

SWIFT mandates Level 3 because:
1. Keys are legally binding (non-repudiation for $billions in payments)
2. Banks are high-value targets for nation-state attackers
3. Physical access by insiders must not compromise keys`,
  },
  {
    time: "Hour 2",
    title: "Partitions, Roles & Authentication",
    concept: [
      "**Partitions** are like safe deposit boxes inside the vault. A single physical HSM can have up to 100 partitions, each **cryptographically isolated** from the others. Partition A cannot see or access keys in Partition B. Each partition has its own authentication (PIN or PED keys) and its own policies (what algorithms are allowed, whether keys can be exported).",
      "**Why partitions matter for SWIFT:** A bank might have one partition for SWIFT signing keys, another for TLS keys, another for a PKI system, and another for an internal application. If the application using Partition A is compromised, the SWIFT keys in Partition B are completely safe. This is **defense in depth** at the hardware level.",
      "**The HSM has a strict role hierarchy** — no single person can do everything. The **HSM Security Officer (HSM SO)** is like the vault manager: they initialize the HSM, create/delete partitions, set policies, and update firmware — but they **cannot see or use any keys**. The **Partition Security Officer (PO)** manages a specific partition: sets policies, creates the Crypto Officer role — but **cannot generate or use keys**.",
      "**The Crypto Officer (CO)** is the key manager: they generate keys, delete keys, clone keys to backups, and can sign/encrypt. In SWIFT, this is the person who runs the **key ceremony** — a formal, audited event where new signing keys are generated. The **Crypto User (CU)** is the service account — it can use keys (sign, verify, encrypt, decrypt) but **cannot generate, delete, or clone keys**. This is what SNL (SWIFTNet Link) uses at runtime.",
      "**Password vs PED Authentication.** For development and testing, you use a simple PIN string (like `\"1234\"`). For production SWIFT, you use **Luna PED** — a physical PIN Entry Device connected via USB. Each role has a different colored PED key: Blue = HSM SO, Black = Partition SO, Grey = Crypto Officer, White = Crypto User. You must physically insert the key AND enter a PIN on the PED keypad.",
      "**M-of-N Quorum:** For critical operations like generating a new SWIFT signing key, you can require **M out of N** PED key holders to be physically present. Example: 3-of-5 custodians must insert their PED keys. This prevents any single person from generating keys alone — a critical compliance control.",
    ],
    code: `# === SWIFT Role Mapping ===
#
# Luna Role          SWIFT Person              What They Do
# ─────────          ────────────              ────────────
# HSM SO             IT Security / Infra       Rack HSM, network config, firmware
# Partition SO       SWIFT Security Officer    Initialize SWIFT partition, set policies
# Crypto Officer     Key Ceremony team         Generate SWIFT signing keys, create CSRs
# Crypto User        SNL (application)         Sign pacs.008 messages at runtime

# === PED Key Colors ===
# Blue   = HSM SO
# Orange = Cloning Domain
# Black  = Partition SO
# Grey   = Crypto Officer
# White  = Crypto User
# Red    = Cloning Domain (DR)
# Purple = Audit

# === Partition Types ===
# Application Partition — where your keys live (SNL connects here via PKCS#11)
# HSM Admin Partition   — internal, used by HSM SO for appliance management
# Backup Partition      — on a Luna Backup HSM, for key backup/restore

# === Isolation Guarantee ===
# Partition A CANNOT see or access keys in Partition B
# Each partition has its OWN authentication (PIN or PED keys)
# Each partition has its OWN policies (algorithms, export rules)
# A compromised app using Partition A cannot reach Partition B`,
    practice: "Map each Luna HSM role to a real person in a bank. Why can't the HSM SO access the signing keys? What would happen if one person held all roles?",
    solution: `Role separation prevents insider threats:

HSM SO = Infrastructure team (racks the device, configures network)
  → They CANNOT touch keys because they have physical access to the box.
  → If they could also access keys, a rogue admin could export signing keys.

Partition SO = SWIFT Security Officer (manages the SWIFT partition)
  → They set policies but CANNOT generate keys.
  → Separation ensures policy-setters don't have operational access.

Crypto Officer = Key Ceremony team (generates keys during formal ceremonies)
  → They generate keys but need authorization from the Partition SO first.

Crypto User = SNL application (signs messages automatically)
  → Most restricted role. Can only USE existing keys. Cannot create or delete.

If one person held all roles, they could:
1. Create a partition with weak policies
2. Generate a key with CKA_EXTRACTABLE=TRUE
3. Export the signing key
4. Forge payment messages from any bank
This is why SWIFT audits role separation annually.`,
  },
  {
    time: "Hour 3",
    title: "Key Lifecycle & Ceremonies",
    concept: [
      "**A key ceremony** is a formal, audited procedure to generate the bank's SWIFT signing keys. It typically involves 5-6 people: a Key Ceremony Leader (Partition SO), 2-3 Key Custodians (each holding a PED key), a Witness or Auditor, and the entire event is recorded on camera for the audit trail.",
      "**Step by step:** (1) The Partition SO authenticates with the Black PED key and verifies the partition is ready. (2) The Crypto Officer authenticates with the Grey PED key + PIN. (3) The CO issues the key generation command — `RSA-2048`, label `SWIFT-SIGNING-2026`, and critically: `extractable = false` — meaning this key can **never** be exported in plaintext. (4) The CO generates a CSR (Certificate Signing Request) — only the public key goes into the CSR. (5) The CSR is submitted to SWIFT's CA, which issues the signed certificate. (6) The key is cloned to a backup HSM. (7) All PED keys are distributed to separate custodians in separate physical safes.",
      "**What lives in the partition after the ceremony?** Three objects: the **Private Key** (RSA-2048, `CKA_EXTRACTABLE=FALSE`, `CKA_SIGN=TRUE`), the **Public Key** (RSA-2048, `CKA_VERIFY=TRUE`), and the **Certificate** (X.509, issued by SWIFT CA, linking the public key to the bank's BIC code like `DEUTDEFF`).",
      "**CKA_EXTRACTABLE = FALSE** is the most important policy. Once set during key generation, the private key can NEVER be exported from the HSM — not even by the Crypto Officer or HSM SO. It can only be **cloned** (encrypted by the cloning domain secret) to another Luna HSM with the same domain. This is the fundamental security guarantee of the entire system.",
      "**Partition policies** give fine-grained control. You can force all private keys to be `SENSITIVE` (never exposed in plaintext), set minimum PIN lengths, limit failed login attempts (partition locks after 10 failures), allow/deny specific algorithms (RSA on, AES off for signing partitions), and require challenge-response authentication.",
      "**Key rotation:** SWIFT signing keys typically have a 2-3 year lifecycle (matching the certificate validity). When it's time to rotate, you run another key ceremony to generate a new key pair, get a new certificate from SWIFT CA, and then update SNL to use the new key label. The old key remains in the HSM for verifying old signatures.",
    ],
    code: `# === What Happens During the Key Ceremony ===

# Step 1: Partition SO authenticates (Black PED key)
# lunash:> partition show  → verifies partition is ready

# Step 2: Crypto Officer authenticates (Grey PED key + PIN)
# lunacm:> role login -name co

# Step 3: Generate the signing key INSIDE the HSM
# lunacm:> partition generate-key \\
#   --algorithm RSA \\
#   --key-size 2048 \\
#   --label "SWIFT-SIGNING-2026" \\
#   --extractable false    ← KEY NEVER LEAVES HSM
#   --sign true
#   --verify true
#
# Output: Key generated. Handle: 0x0000001A

# Step 4: Generate CSR (public key only leaves the HSM)
# openssl req -new -engine pkcs11 \\
#   -keyform engine \\
#   -key "pkcs11:token=SWIFT-PROD;..." \\
#   -out swift-signing.csr \\
#   -subj "/CN=DEUTDEFF/O=Deutsche Bank/C=DE"

# Step 5: Submit CSR to SWIFT CA → get signed certificate back
# Step 6: Import certificate into partition alongside the key

# Step 7: Backup — clone key to Luna Backup HSM
# lunacm:> partition backup -slot 1

# The partition now contains:
# ┌─ Private Key: "SWIFT-SIGNING-2026" (CKA_EXTRACTABLE=FALSE)
# ├─ Public Key:  "SWIFT-SIGNING-2026"
# └─ Certificate: X.509 from SWIFT CA (CN=DEUTDEFF)`,
    practice: "Why must CKA_EXTRACTABLE be set to FALSE during generation and not after? What happens if it's initially TRUE?",
    solution: `CKA_EXTRACTABLE is a one-way attribute:
- If set to FALSE at generation time, it can NEVER be changed to TRUE later.
- If set to TRUE at generation time, someone COULD export the key before
  changing it to FALSE — the damage would already be done.

SWIFT requires it to be FALSE from birth because:
1. Even a brief window of extractability is a risk
2. Audit logs would show the key was once extractable
3. Compliance auditors would flag this as a control failure

The principle: "Born secure, stays secure."

In PKCS#11 terms:
  CKA_EXTRACTABLE = FALSE  → key CANNOT be wrapped/exported
  CKA_SENSITIVE = TRUE     → key CANNOT be revealed in plaintext
  Both must be set at key generation time for SWIFT compliance.`,
  },
  {
    time: "Hour 4",
    title: "High Availability, Backup & Cloning",
    concept: [
      "**Cloning Domain** is a shared secret that links HSMs together. To replicate keys between HSMs (for HA or backup), both partitions must share the **same cloning domain** — set during partition initialization using the Orange PED key (PED mode) or a domain string (password mode). Keys are encrypted with the domain secret during transfer and are NEVER in plaintext outside the HSM boundary.",
      "**Without matching cloning domains, key replication is impossible** — even if you have admin access to both HSMs. This is a critical safety feature: if an attacker gains access to a second HSM, they cannot pull keys from the production HSM unless they also have the cloning domain secret.",
      "**HA (High Availability) Groups** let you run multiple physical HSMs as one logical HSM. When SNL calls `C_Sign()`, the Luna Client library automatically load-balances across HSM members. If HSM-A fails, traffic seamlessly fails over to HSM-B. The application (SNL) doesn't know or care — it sees one logical partition.",
      "**How HA sync works:** (1) A key is generated on HSM-A. (2) The Luna Client automatically clones the key to HSM-B (same cloning domain). (3) Both HSMs now have identical key material. (4) If HSM-A goes offline, the Luna Client fails over to HSM-B. Typically deployed across **two data centers** for DR. All member partitions must have the same firmware version.",
      "**Backup procedure:** (1) Connect the portable Luna Backup HSM to the production HSM. (2) Crypto Officer authenticates on both source and backup partitions. (3) Execute backup — keys are cloned (encrypted by cloning domain secret). (4) Verify backup by listing objects on the backup partition. (5) Disconnect and store the backup HSM in a **physically separate, secure location** (different building or site).",
      "**Recovery** is the reverse — clone from the backup partition to a new production partition. The new partition must be initialized with the same cloning domain. This is why custodians must guard the Orange PED key (cloning domain) with the same care as the signing keys themselves.",
    ],
    code: `# === HA Group Configuration (Conceptual) ===

# Application (SNL) sees ONE logical partition:
#   lib = PyKCS11Lib()
#   lib.load("libCryptoki2.dll")   ← Luna client library
#   session = lib.openSession(ha_virtual_slot)
#   # Internally: Luna client picks HSM-A or HSM-B

# HA Group: "SWIFT-HA"
# ┌──────────────┐  ┌──────────────┐
# │ HSM-A:Site-1 │  │ HSM-B:Site-2 │
# │ SWIFT-PROD-A │  │ SWIFT-PROD-B │
# │ Status: ✅    │  │ Status: ✅    │
# └──────────────┘  └──────────────┘
# Load Balancing: Round-robin
# Auto-Recovery: If HSM-A fails → all traffic to B
# Key Sync: Automatic cloning between A & B

# === HA Group Requirements ===
# 1. All partitions share the SAME cloning domain
# 2. Same firmware version on all HSMs
# 3. Network connectivity between Luna Client and all HSMs
# 4. Typically 2 data centers for DR

# === Backup to Portable Luna Backup HSM ===
# Step 1: Connect backup HSM (USB or network)
# Step 2: CO authenticates on both source + backup
# Step 3: lunacm:> partition backup -slot 1
#          Keys are cloned (encrypted by domain secret)
# Step 4: Verify: lunacm:> partition list-objects -slot backup
# Step 5: Disconnect. Store in fireproof safe at separate site.

# === Recovery ===
# Reverse the process:
# lunacm:> partition restore -slot backup -target new_prod
# Requires: same cloning domain on the new target partition`,
    practice: "A bank has HSMs in New York and London. Explain step-by-step how they would set up HA between them and what happens when the New York HSM fails.",
    solution: `Setup:
1. Install Luna HSM 7 at both sites (same firmware version)
2. Initialize partition "SWIFT-PROD-NY" on NY HSM
   → Set cloning domain using Orange PED key (e.g., domain = 0xABCD)
3. Initialize partition "SWIFT-PROD-LON" on London HSM
   → Set the SAME cloning domain (0xABCD) using the same Orange PED key
4. Configure Luna Client HA group "SWIFT-HA" with both partitions
5. Generate signing key on NY HSM during key ceremony
6. Luna Client automatically clones key to London HSM
7. Both HSMs now have identical key material

When NY fails:
1. Luna Client detects NY HSM is unreachable (timeout)
2. All PKCS#11 calls automatically route to London HSM
3. SNL continues signing pacs.008 messages without interruption
4. Monitoring alert fires for the NY HSM failure
5. When NY HSM is repaired, it re-joins the HA group
6. Any keys generated during the outage on London are cloned back to NY
7. Load balancing resumes across both sites`,
  },
  {
    time: "Hour 5",
    title: "SWIFT Infrastructure — The Big Picture",
    concept: [
      "**SWIFT (Society for Worldwide Interbank Financial Telecommunication)** is a global messaging network connecting 11,000+ banks in 200+ countries. It doesn't move money — it sends **secure payment instructions** (messages) between banks. The most important message type for cross-border payments is **pacs.008** (FI-to-FI Customer Credit Transfer) in the ISO 20022 format.",
      "**The Payment Hub / Core Banking System** is where everything starts. An operator or API initiates a wire transfer. The system creates the ISO 20022 pacs.008 XML message, populates debtor/creditor info, amounts, BICs, and remittance data. Before the message leaves, it passes through **compliance checks**: AML (Anti-Money Laundering), KYC (Know Your Customer), and sanctions screening (OFAC, EU, UN lists).",
      "**SAA (SWIFT Alliance Access)** is the bank's messaging interface — the bridge between internal systems and SWIFT. It validates the pacs.008 against **CBPR+** rules (Cross-Border Payments and Reporting Plus), checks the **RMA** (Relationship Management Application) — a whitelist ensuring both banks have authorized each other to exchange messages — and wraps the message in a **BizMsg envelope** with an **AppHdr** (Application Header).",
      "**LAU (Local Authentication)** protects the handoff between the Payment Hub and SAA using a shared-secret **HMAC-SHA256**. This ensures the message wasn't tampered with in transit and came from an authorized system. Without LAU, a rogue system could inject unauthorized payment messages.",
      "**SAG (SWIFT Alliance Gateway)** is the secure concentration point that consolidates all traffic from SAA before it enters the SWIFT network. It handles protocol selection — for pacs.008 on CBPR+, it uses **InterAct** (real-time, message-by-message). For batch transfers, it uses **FileAct**. For legacy MT messages, it uses **FIN**.",
      "**The key takeaway:** A pacs.008 message flows through five components before it even reaches the SWIFT network: Payment Hub → (LAU) → SAA → SAG → SNL → HSM. Each component adds a layer of validation, authentication, or security. This defense-in-depth architecture is what makes SWIFT one of the most secure messaging networks in the world.",
    ],
    code: `# === The Component Chain for a pacs.008 ===

# Payment Hub  →  SAA  →  SAG  →  SNL  →  HSM  →  VPN  →  SWIFT
#   (create)    (validate) (route) (sign) (crypto) (encrypt) (deliver)

# === ISO 20022 pacs.008 XML Structure ===
# <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.09">
#   <FIToFICstmrCdtTrf>
#     <GrpHdr>
#       <MsgId>PAY-A1B2C3D4</MsgId>
#       <CreDtTm>2026-04-10T10:00:00Z</CreDtTm>
#       <NbOfTxs>1</NbOfTxs>
#       <SttlmInf><SttlmMtd>INDA</SttlmMtd></SttlmInf>
#     </GrpHdr>
#     <CdtTrfTxInf>
#       <PmtId>
#         <InstrId>PAY-A1B2C3D4</InstrId>
#         <EndToEndId>E2E-PAY-A1B2C3D4</EndToEndId>
#         <UETR>eb6305c9-1f7f-49de-...</UETR>  ← CBPR+ mandatory UUID
#       </PmtId>
#       <IntrBkSttlmAmt Ccy="USD">50000.00</IntrBkSttlmAmt>
#       <ChrgBr>SHAR</ChrgBr>
#       <DbtrAgt><FinInstnId><BICFI>DEUTDEFF</BICFI></FinInstnId></DbtrAgt>
#       <CdtrAgt><FinInstnId><BICFI>CHASUS33</BICFI></FinInstnId></CdtrAgt>
#     </CdtTrfTxInf>
#   </FIToFICstmrCdtTrf>
# </Document>

# === CBPR+ Validation Checks by SAA ===
# ✓ UETR present and valid UUID v4
# ✓ IntrBkSttlmAmt present with currency
# ✓ Debtor BIC valid (DEUTDEFF)
# ✓ Creditor BIC valid (CHASUS33)
# ✓ ChrgBr (charge bearer) specified
# ✓ Structured remittance info`,
    practice: "What is the difference between FIN (MT messages) and InterAct (MX/ISO 20022 messages)? Why is SWIFT migrating from MT to MX?",
    solution: `FIN (MT messages):
- Legacy format from the 1970s
- Proprietary tag-based syntax (e.g., :20: for Transaction Reference)
- Max ~10KB message size
- Limited structured data
- Example: MT103 (customer credit transfer)

InterAct (MX / ISO 20022 messages):
- Modern XML-based format
- Rich, structured data (full addresses, LEI codes, purpose codes)
- Up to 250MB+ message size (via FileAct)
- Standard across the entire financial industry
- Example: pacs.008 (replaces MT103)

Why migrate?
1. Richer data → better compliance (AML, sanctions screening)
2. No truncation → full remittance info flows end-to-end
3. Global standard → interoperable across all payment systems
4. Machine-readable → straight-through processing (STP)
5. Regulatory push → many central banks now require ISO 20022

SWIFT's deadline: All cross-border payments must use ISO 20022
(CBPR+) by November 2025. MT messages will be phased out.`,
  },
  {
    time: "Hour 6",
    title: "SNL, HSM & Certificates — Signing a Message",
    concept: [
      "**SNL (SWIFTNet Link)** is the communication software layer installed at the bank that provides connectivity to SWIFTNet. It establishes TLS/SSL channels, manages PKI certificates, and — most importantly — it's the component that actually **talks to the HSM**. When a pacs.008 needs to be signed, SNL calls the HSM via PKCS#11.",
      "**Three types of keys live in the HSM for SWIFT:** (1) The **Signing key** — for non-repudiation, proves the bank sent the message. Used on every outbound pacs.008. (2) The **TLS key** — for channel authentication during the TLS handshake. Used on every network session. (3) The **Encryption key** — for end-to-end confidentiality on FileAct bulk transfers.",
      "**SWIFT PKI (Public Key Infrastructure):** SWIFT operates its own Certification Authority (CA). Every bank on SWIFT has certificates issued by this CA. The certificate lifecycle is: (1) Bank generates keypair in HSM, (2) Bank creates a CSR, (3) CSR submitted to SWIFT via SWIFTNet, (4) SWIFT CA signs and issues the certificate, (5) Certificate installed on SNL/SAG, (6) Renewed every 1-3 years.",
      "**The XML Digital Signature in the AppHdr:** When a pacs.008 is sent, the Application Header (`<AppHdr>`) contains a `<Sgntr>` block with a full XMLDSig signature. This includes `<ds:SignedInfo>` (what was signed), `<ds:SignatureValue>` (the RSA-SHA256 signature from the HSM), and `<ds:KeyInfo>` with the bank's X.509 certificate embedded.",
      "**SWIFT CSCF mandate:** The SWIFT Customer Security Controls Framework (CSCF) **requires** HSMs for protecting signing keys. This is a mandatory control (5.4 — Physical & Logical Password Storage) audited annually. Banks that fail this audit can be suspended from the SWIFT network.",
      "**Our demo is cryptographically identical to production.** The `sign_mx.py` script calls `CKM_SHA256_RSA_PKCS` on SoftHSM2 via PKCS#11 — the exact same PKCS#11 call that SNL makes to a real Thales Luna HSM. The only differences: we use SoftHSM2 instead of hardware, a self-signed cert instead of SWIFT-issued, and a standalone Document instead of a BizMsg envelope.",
    ],
    code: `# === The Runtime Signing Flow (PKCS#11) ===
# This is exactly what SNL does for every outbound pacs.008:

# SNL (or our sign_mx.py)          Luna HSM (or SoftHSM2)
# ──────────────────────          ──────────────────────
# 1. C_Initialize()         →    Load PKCS#11 library
# 2. C_OpenSession(slot)    →    Open session to SWIFT-PROD partition
# 3. C_Login(CKU_USER, PIN) →    Authenticate as Crypto User
# 4. C_FindObjects(label)   →    Find key "SWIFT-SIGNING-2026"
#                            ←    Returns handle: 0x1A
# 5. C_SignInit(SHA256_RSA)  →    Prepare RSA-SHA256 signing
# 6. C_Sign(SignedInfo)      →    SIGN the canonical SignedInfo bytes
#                            ←    256-byte RSA signature
# 7. C_FindObjects(CERT)    →    Get X.509 certificate for KeyInfo
# 8. C_Logout()             →    End session

# Our Python code maps directly:
# lib.load(dll)          → C_Initialize()
# lib.openSession()      → C_OpenSession()
# session.login(PIN)     → C_Login(CKU_USER, PIN)
# session.findObjects()  → C_FindObjectsInit/Next()
# session.sign(data,mech)→ C_SignInit + C_Sign()  ← THE CORE OPERATION
# session.logout()       → C_Logout()

# === Certificate Types in SWIFT ===
# SWIFTNet PKI cert (signing)     → Non-repudiation on messages
# SWIFTNet PKI cert (encryption)  → Encrypt payload for confidentiality
# Channel certificate              → TLS mutual authentication
# Alliance Connect VPN cert        → IPsec VPN tunnel authentication`,
    practice: "Why does SWIFT require the signing certificate to be embedded in the XMLDSig <KeyInfo> block? What does the receiver do with it?",
    solution: `The certificate in <KeyInfo> serves multiple purposes:

1. IDENTIFICATION: It tells the receiver WHO signed the message
   (CN=DEUTDEFF identifies Deutsche Bank Frankfurt)

2. VERIFICATION: The receiver extracts the public key from the cert
   and uses it to verify the RSA-SHA256 signature. If the signature
   matches, the message is authentic and unmodified.

3. TRUST CHAIN: The receiver validates the cert chain:
   Leaf (DEUTDEFF) → Intermediate (SWIFTNet CA) → Root (SWIFTNet Root CA)
   If the chain is valid, the cert is trusted.

4. NON-REPUDIATION: Because the private key never left the HSM,
   and only DEUTDEFF's HSM has that key, DEUTDEFF cannot deny
   sending the message. This is legally binding.

5. EXPIRY CHECK: The receiver checks the cert hasn't expired.
   Expired certs → reject the message.

Without the embedded cert, the receiver would need to look up the
sender's public key separately, which adds latency and a point of failure.`,
  },
  {
    time: "Hour 7",
    title: "VPN, RMA & SWIFTNet — The Network",
    concept: [
      "**Alliance Connect** provides the secure network connection between the bank and SWIFT's Secure IP Network (SIPN). It uses an **IPsec VPN tunnel** through a managed Customer Premises Equipment (M-CPE) — typically a Juniper SRX appliance managed by SWIFT. The bank doesn't configure it; SWIFT monitors it 24/7.",
      "**Connectivity tiers:** **Bronze** = single VPN, single site (small banks). **Silver** = dual VPN, single site (medium banks). **Gold** = dual VPN, dual site — active/active (large banks, mandatory for systemically important institutions). For cloud deployments on AWS/Azure, SWIFT provides **Alliance Connect Virtual** using virtual appliances (vSRX) in the bank's VPC.",
      "**RMA (Relationship Management Application)** is a whitelist system controlling which banks can exchange messages. Before Bank A can send a pacs.008 to Bank B, **both banks must have an active RMA authorization** for that message type. Without RMA, the message is **rejected by SWIFTNet** before reaching the receiver. Think of it as a bilateral 'friendship request' that both parties must accept.",
      "**SWIFTNet (SIPN)** is SWIFT's private, global messaging network operated from three Operating Centers (OPCs) in the US, EU, and Switzerland. For pacs.008 via InterAct: the sender's SNL sends the signed BizMsg → SWIFTNet validates the digital signature → checks RMA → routes to the receiver's OPC → delivers via the receiver's VPN tunnel. If the receiver is temporarily offline, SWIFTNet **queues** the message (store-and-forward).",
      "**The complete journey has 25 steps** — from the operator pressing 'Send' to the sender receiving the pacs.002 (Payment Status Report) confirmation back. The HSM signing step (#12) is the cryptographic heart. The rest is validation, routing, and delivery. Each step adds a layer of security or compliance checking.",
      "**Deployment options in 2026:** (1) **Full Stack** — all components on-prem (large banks). (2) **Alliance Cloud** — everything in SWIFT's cloud (mid-size banks, lowest ops). (3) **Alliance Lite2** — AutoClient only, minimal footprint (small banks). (4) **Cloud on AWS/Azure** — SAA+SAG in the bank's VPC with Alliance Connect Virtual.",
    ],
    code: `# === Complete pacs.008 Journey — Key Steps ===

#  Step    Component               Action
#  ────    ─────────               ──────
#   1      Payment Hub             Operator initiates wire transfer
#   2      Payment Hub             AML/KYC/Sanctions screening ✓
#   3      Payment Hub             Generates pacs.008 XML
#   4      Payment Hub → SAA       Sends via MQ (protected by LAU HMAC)
#   5      SAA                     Validates against CBPR+ rules
#   6      SAA                     Checks RMA authorization
#   7      SAA                     Wraps in BizMsg envelope with AppHdr
#  ─── HSM SIGNING ───
#  11      SNL → HSM               Sends canonical SignedInfo (PKCS#11)
#  12      HSM                     RSA-SHA256 signs with private key  ★
#  13      SNL                     Assembles XMLDSig in AppHdr
#  14      SNL                     TLS handshake (HSM for client cert)
#  ─── NETWORK ───
#  15      SNL → Alliance Connect  IPsec VPN tunnel (AES-256-GCM)
#  16      → SWIFTNet (SIPN)       Traverses SWIFT's private network
#  17      SWIFTNet                Validates sender's digital signature
#  18      SWIFTNet                Checks RMA authorization
#  19      SWIFTNet → Receiver     Delivers via receiver's VPN tunnel
#  ─── RECEIVER ───
#  20      Receiver SNL            Verifies signature
#  21      Receiver SAA            Validates pacs.008
#  22      Receiver Core Banking   Credits creditor account
#  ─── RESPONSE ───
#  23      Receiver                Generates pacs.002 (status report)
#  24      → Sender                pacs.002 travels back through SWIFT
#  25      Payment COMPLETE        Status: ACCEPTED ✅`,
    practice: "What happens if Bank A tries to send a pacs.008 to Bank B but they don't have an RMA? At which step does the message get rejected?",
    solution: `The message is rejected at TWO possible points:

1. STEP 6 — SAA checks RMA LOCALLY before sending.
   If Bank A's SAA doesn't have Bank B in its RMA list,
   the message is rejected BEFORE it even leaves the bank.
   Error: "RMA authorization not found for CHASUS33"

2. STEP 18 — SWIFTNet checks RMA CENTRALLY.
   Even if Bank A's SAA has Bank B in its RMA list,
   SWIFTNet verifies that Bank B ALSO has Bank A authorized.
   RMA is BILATERAL — both sides must authorize each other.
   If Bank B hasn't authorized Bank A:
   Error: "NAK - Receiver RMA check failed"

This prevents:
- Spam: Random banks can't flood you with messages
- Fraud: Only pre-approved counterparties can send payments
- Compliance: Banks must onboard counterparties through KYC

To set up RMA:
- Both banks exchange RMA keys via SWIFTNet
- Each bank specifies allowed message types (e.g., pacs.*, camt.*)
- RMA must be renewed periodically`,
  },
  {
    time: "Hour 8",
    title: "XML Digital Signatures & PKCS#11 Deep Dive",
    concept: [
      "**The signing process has 6 precise steps.** Step 1: **Canonicalize** the XML using Exclusive XML Canonicalization (exc-c14n). This produces a deterministic byte representation — XML can have insignificant whitespace, different namespace prefixes, or attribute ordering, but c14n always produces the same bytes for semantically identical documents.",
      "**Step 2: Hash** the canonical XML with SHA-256 to produce a 32-byte digest. If even 1 bit of the document changes, the digest is completely different. Step 3: **Build SignedInfo** — an XML structure that says what canonicalization was used, what signature algorithm will be used, and what was digested (including the digest value). The SignedInfo itself is then canonicalized.",
      "**Step 4: Send SignedInfo to the HSM.** The canonical SignedInfo bytes go INTO the HSM via PKCS#11 `C_Sign()`. Inside the HSM's crypto processor: (1) SHA-256 hash of the SignedInfo → 32 bytes, (2) PKCS#1 v1.5 padding to match RSA key size, (3) RSA private key exponentiation (`signature = padded ^ d mod n`) — this takes ~1ms on Luna hardware. The 256-byte signature comes OUT. The private key `d` NEVER leaves the HSM boundary.",
      "**Step 5: Assemble the `<ds:Signature>` block.** The signature bytes (base64 encoded) go into `<ds:SignatureValue>`. The X.509 certificate goes into `<ds:KeyInfo><ds:X509Certificate>`. This entire block is inserted into the `<AppHdr>/<Sgntr>` section of the BizMsg envelope.",
      "**Step 6: Verification** (by SWIFTNet or the receiver). Extract the certificate, verify the cert chain against SWIFT Root CA, extract the public key, perform the RSA public key operation (`decrypted = signature ^ e mod n`), strip PKCS#1 padding, extract the hash, independently compute SHA-256 of the canonical SignedInfo, and COMPARE. Match = authentic + unmodified. Mismatch = reject.",
      "**The PKCS#11 mechanism `CKM_SHA256_RSA_PKCS`** tells the HSM to do both the SHA-256 hashing AND the RSA signing in one operation. This is more secure because the data never needs to be hashed outside the HSM boundary. Our `session.sign(priv_key, signed_info_c14n, mechanism)` call maps directly to the production HSM call.",
    ],
    code: `# === The Complete Signing Process in Python ===
import hashlib, base64
from lxml import etree
from PyKCS11 import *

# Step 1: Canonicalize the XML document
doc = etree.parse("message.xml")
doc_c14n = etree.tostring(doc, method='c14n', exclusive=True)
# Output: deterministic bytes (e.g., 1,247 bytes)

# Step 2: SHA-256 digest of the canonical document
digest = hashlib.sha256(doc_c14n).digest()
digest_b64 = base64.b64encode(digest).decode()
# Output: "k7iFj9B2x3Qp..." (base64-encoded 32-byte hash)

# Step 3: Build XMLDSig SignedInfo structure
# <ds:SignedInfo>
#   <ds:CanonicalizationMethod Algorithm="...exc-c14n#"/>
#   <ds:SignatureMethod Algorithm="...rsa-sha256"/>
#   <ds:Reference URI="">
#     <ds:Transforms>
#       <ds:Transform Algorithm="...enveloped-signature"/>
#       <ds:Transform Algorithm="...exc-c14n#"/>
#     </ds:Transforms>
#     <ds:DigestMethod Algorithm="...sha256"/>
#     <ds:DigestValue>{digest_b64}</ds:DigestValue>
#   </ds:Reference>
# </ds:SignedInfo>

# Canonicalize the SignedInfo itself
si_c14n = etree.tostring(signed_info, method='c14n', exclusive=True)
# Output: 412 bytes — THIS is what gets signed

# Step 4: Send to HSM for signing via PKCS#11
mechanism = Mechanism(CKM.SHA256_RSA_PKCS, None)
signature = session.sign(priv_key, si_c14n, mechanism)
# Inside HSM: SHA-256 → PKCS#1 v1.5 pad → RSA(d, n) → 256 bytes out
# Private key 'd' NEVER leaves the HSM boundary

# Step 5: Base64 encode signature, embed in <ds:Signature>
sig_b64 = base64.b64encode(bytes(signature)).decode()

# Step 6: Verification (receiver side)
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes
public_key.verify(signature, si_c14n, padding.PKCS1v15(), hashes.SHA256())`,
    practice: "Why must the SignedInfo be canonicalized BEFORE signing? What would happen if you signed the raw XML bytes instead?",
    solution: `Canonicalization is critical because XML is NOT byte-stable.
These two documents are SEMANTICALLY identical but have DIFFERENT bytes:

  Version A: <Amount Ccy="USD">50000.00</Amount>
  Version B: <Amount   Ccy="USD">50000.00</Amount>  (extra space)

If you sign the raw bytes of Version A, then Version B would FAIL
verification even though the content is identical. This would cause
millions of legitimate payments to be rejected.

Exclusive c14n solves this by:
1. Removing insignificant whitespace
2. Sorting attributes alphabetically
3. Normalizing namespace declarations
4. Converting to UTF-8
5. Using LF line endings

After c14n, both Version A and Version B produce IDENTICAL bytes.
The signature works regardless of minor formatting differences
introduced by different XML parsers, serializers, or middleware.

This is also why the VERIFIER must c14n the SignedInfo before
checking the signature — they must produce the exact same bytes
that were signed.`,
  },
  {
    time: "Hour 9",
    title: "Three Layers of Crypto — Signing, TLS & IPsec",
    concept: [
      "**A single pacs.008 payment is protected by THREE separate cryptographic layers** — like an onion. Each layer defends against different threats, uses different keys, and is managed by different components. Understanding all three is essential for SWIFT security.",
      "**Layer 1: Message Signing (XMLDSig).** Purpose: prove WHO sent the message (non-repudiation) and that it wasn't modified (integrity). Uses an RSA-2048 key pair stored in the Luna HSM. The private key signs; the public key (in the X.509 cert) verifies. This is legally binding — if the signature is valid, the bank CANNOT deny sending the message. If this key is compromised, an attacker can **forge messages as the bank** — catastrophic.",
      "**Layer 2: Transport Security (Mutual TLS 1.3).** Purpose: encrypt the session between SNL and SWIFTNet servers and authenticate BOTH sides. Uses a separate RSA-2048 or ECDSA key pair, also in the HSM but with a different label. During the TLS handshake, the HSM signs the `CertificateVerify` message to prove the bank owns the TLS key. Session keys are ephemeral (derived via x25519 key exchange) — providing **Perfect Forward Secrecy**: even if the TLS private key is later compromised, past sessions cannot be decrypted.",
      "**Layer 3: Network Encryption (IPsec VPN).** Purpose: encrypt ALL IP traffic between the bank and SWIFT at the network layer. Uses AES-256-GCM symmetric keys negotiated via IKEv2 Diffie-Hellman. These keys live in the Alliance Connect M-CPE appliance (separate hardware from the HSM), re-key every hour, and exist only in memory. An eavesdropper sees only opaque encrypted packets — they cannot see the TLS session, the XML, the payment data, amounts, or BIC codes.",
      "**Why separate keys for each layer?** Different risk profiles (message signing = legal liability, TLS = session security). Different rotation cycles (TLS certs rotate more often). If one layer is compromised, the others still protect the data. Audit logs can distinguish signing operations from TLS operations. SWIFT requires this separation — it's mandatory CSCF controls 2.1 (VPN), 2.4A (TLS), and 2.5A (signing).",
      "**The Onion Model:** The innermost layer is the pacs.008 payload ($50,000 from DEUTDEFF to CHASUS33). It's wrapped in an XMLDSig signature (Layer 1 — non-repudiation). That's wrapped in a TLS 1.3 encrypted session (Layer 2 — session privacy). That's wrapped in an IPsec ESP encrypted tunnel (Layer 3 — network isolation). Three independent layers, three independent key sets, three independent threat models.",
    ],
    code: `# === The Three Layers at a Glance ===

# LAYER 1: XMLDSig — Message Signing
# Protects:    The pacs.008 XML content
# Algorithm:   RSA-SHA256 (CKM_SHA256_RSA_PKCS)
# Key:         RSA-2048 in Luna HSM ("SWIFT-SIGNING-2026")
# Key type:    Asymmetric, permanent (2-3 year cert)
# Threat:      Forgery, tampering, repudiation
# If breached:  CATASTROPHIC — attacker can forge messages as the bank

# LAYER 2: Mutual TLS 1.3 — Transport Security
# Protects:    The session between SNL and SWIFTNet
# Algorithm:   x25519 + AES-256-GCM (TLS 1.3)
# Key:         RSA-2048/ECDSA in Luna HSM ("SWIFT-TLS-2026")
# Key type:    Asymmetric permanent + ephemeral session keys
# Threat:      Eavesdropping, MITM, session hijack
# If breached:  SERIOUS — one session exposed (forward secrecy limits damage)

# LAYER 3: IPsec VPN — Network Encryption
# Protects:    ALL IP traffic between bank and SWIFT
# Algorithm:   IKEv2 + AES-256-GCM (ESP)
# Key:         AES-256 in Alliance Connect M-CPE (negotiated via DH)
# Key type:    Symmetric, ephemeral (re-key hourly)
# Threat:      Network sniffing, DDoS, routing attacks
# If breached:  SERIOUS — attacker sees encrypted TLS packets

# === Key Separation Principle ===
# Signing Key (Layer 1)         vs    TLS Key (Layer 2)
# ─────────────────────               ─────────────────
# Purpose: Sign business msgs         Purpose: Auth TLS sessions
# Key Usage: Digital Signature,        Key Usage: Digital Signature,
#            Non-Repudiation                      Key Encipherment
# Lifetime: 2-3 years                 Lifetime: 1-2 years
# Label: "SWIFT-SIGNING-2026"         Label: "SWIFT-TLS-2026"`,
    practice: "If an attacker compromises the TLS key (Layer 2), can they forge payment messages? What about if they compromise the VPN (Layer 3)?",
    solution: `TLS key compromised (Layer 2):
- The attacker can INTERCEPT one TLS session (if they're MITM)
- But they CANNOT forge payment messages because:
  - Message signing uses a DIFFERENT key (Layer 1)
  - The XMLDSig signature is verified independently
  - SWIFTNet checks the signature against the signing cert, not the TLS cert
- Forward secrecy limits damage: past sessions used ephemeral keys
  derived from x25519 exchange, so historical traffic cannot be decrypted
- Impact: SERIOUS but not catastrophic

VPN compromised (Layer 3):
- The attacker can see encrypted TLS packets — but CAN'T read them
  because TLS (Layer 2) is still encrypting the data
- They CANNOT forge messages (Layer 1 signing key is untouched)
- They might be able to perform traffic analysis (timing, packet sizes)
- Impact: SERIOUS but limited by Layer 2 protection

This is why defense-in-depth works:
- All 3 layers must be compromised simultaneously to fully expose a payment
- Each layer uses independent keys in independent hardware
- SWIFT audits all three layers separately (CSCF controls 2.1, 2.4A, 2.5A)`,
  },
  {
    time: "Hour 10",
    title: "Hands-On: Sign an MX Message with SoftHSM2",
    concept: [
      "**This lesson is a complete, runnable walkthrough** of signing an ISO 20022 MX message using SoftHSM2 on Windows. SoftHSM2 is a free, open-source software HSM that implements the same PKCS#11 API as a real Thales Luna HSM. Your signing code won't change when you switch to production hardware.",
      "**Prerequisites:** Python 3.10+, SoftHSM2 (MSI from github.com/disig/SoftHSM2-for-Windows), OpenSC (for `pkcs11-tool`), and OpenSSL 3.x. The setup script `setup_env.ps1` automates everything: SoftHSM2 config → token initialization → RSA-2048 key generation → X.509 certificate creation → Python venv setup.",
      "**Step 1: Configure SoftHSM2.** Create a token directory and a config file pointing to it. Set the `SOFTHSM2_CONF` environment variable so the DLL knows where to find the config. Step 2: **Initialize a token** — this is like creating a partition on a real HSM. Use `softhsm2-util --init-token --slot 0 --label swift-mx --so-pin 1234 --pin 1234`.",
      "**Step 3: Generate an RSA-2048 keypair** inside the token using `pkcs11-tool`. The private key never leaves the token (even though it's software, the API behavior is identical). Step 4: **Create a self-signed X.509 certificate** with OpenSSL and import it into the token with the same ID as the key — linking them together.",
      "**Step 5: Run `sign_mx.py`.** The script loads `message.xml` (an ISO 20022 pain.001), canonicalizes it, computes a SHA-256 digest, builds the XMLDSig SignedInfo structure, connects to SoftHSM2 via PKCS#11, signs the SignedInfo with `CKM_SHA256_RSA_PKCS`, retrieves the certificate, assembles the complete `<ds:Signature>` block, appends it to the document, writes `message.signed.xml`, and verifies the signature.",
      "**The key insight:** To go from this demo to production, you change exactly TWO things: (1) Replace the DLL path from `softhsm2-x64.dll` to your HSM vendor's PKCS#11 library (e.g., `libCryptoki2.dll` for Thales Luna). (2) Use a SWIFT CA-issued certificate instead of self-signed. The PKCS#11 API calls, the XMLDSig structure, and the cryptographic algorithms are all identical.",
    ],
    code: `# === Complete Setup & Run (PowerShell) ===

# Step 1: Configure SoftHSM2
mkdir -Force "$env:USERPROFILE\\softhsm2\\tokens"
@"
directories.tokendir = $($env:USERPROFILE -replace '\\\\', '/')/softhsm2/tokens
objectstore.backend = file
log.level = INFO
"@ | Out-File -Encoding UTF8 "$env:USERPROFILE\\softhsm2\\softhsm2.conf"
$env:SOFTHSM2_CONF = "$env:USERPROFILE\\softhsm2\\softhsm2.conf"

# Step 2: Initialize a token (= create a partition)
C:\\SoftHSM2\\bin\\softhsm2-util.exe --init-token --slot 0 \`
    --label "swift-mx" --so-pin 1234 --pin 1234

# Step 3: Generate RSA-2048 keypair inside the token
$MODULE = "C:\\SoftHSM2\\lib\\softhsm2-x64.dll"
pkcs11-tool --module $MODULE --login --pin 1234 \`
    --keypairgen --key-type rsa:2048 \`
    --label "mx-signer" --id 01

# Step 4: Create and import X.509 certificate
openssl req -x509 -newkey rsa:2048 \`
    -keyout "$env:TEMP\\mx-temp.key" -out "$env:TEMP\\mx-signer.crt" \`
    -days 365 -nodes \`
    -subj "/CN=MX Signer Test/O=SWIFT MX Demo/C=US"

pkcs11-tool --module $MODULE --login --pin 1234 \`
    --write-object "$env:TEMP\\mx-signer.crt" --type cert \`
    --id 01 --label "mx-signer"

# Step 5: Run the signer!
cd c:\\Users\\forsa\\aws\\hsm
python -m venv venv
.\\venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
python sign_mx.py

# Expected output:
# ✅ Signature verified successfully!
# DONE — SWIFT MX message signed and verified.`,
    practice: "Run the complete setup and signing process. Then examine message.signed.xml and identify the three key parts of the XMLDSig: SignedInfo, SignatureValue, and X509Certificate.",
    solution: `After running sign_mx.py, open message.signed.xml and find:

1. <ds:SignedInfo> — WHAT was signed
   Contains:
   - CanonicalizationMethod: exc-c14n (how XML was normalized)
   - SignatureMethod: rsa-sha256 (how it was signed)
   - Reference URI="" with DigestValue (SHA-256 hash of the document)

2. <ds:SignatureValue> — THE signature itself
   - 256 bytes of RSA-SHA256 signature, base64 encoded
   - Produced by SoftHSM2 via PKCS#11 C_Sign()
   - The private key that created this NEVER left the HSM

3. <ds:KeyInfo> > <ds:X509Certificate> — WHO signed it
   - The signer's X.509 certificate in DER format, base64 encoded
   - Contains the PUBLIC key for verification
   - In production: issued by SWIFTNet CA with CN=BANKBIC

To verify manually:
  openssl verify -CAfile <ca-cert> <signer-cert>
  # Then use the public key from the cert to verify the signature

SoftHSM2 vs Luna comparison:
  SoftHSM2: softhsm2-x64.dll  (free, software, ~100 ops/sec)
  Luna:     libCryptoki2.dll   ($20K-50K, hardware, ~1000 ops/sec)
  API calls: IDENTICAL (PKCS#11 is the abstraction layer)`,
  },
];
