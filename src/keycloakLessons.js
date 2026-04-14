export const keycloakLessons = [
  {
    time: "Hour 1",
    title: "Introduction to IAM & Keycloak",
    concept: [
      "**Identity and Access Management (IAM)** is a framework of policies and technologies to ensure that the right users have the appropriate access to technology resources. It centralizes authentication (who you are) and authorization (what you can do). Instead of every application managing passwords, an IAM delegates this to a central authority.",
      "**Keycloak** is an open-source IAM solution sponsored by Red Hat. It provides **Single Sign-On (SSO)** out of the box, meaning users authenticate once and can seamlessly access multiple applications. Keycloak supports modern identity protocols like **OAuth 2.0**, **OpenID Connect (OIDC)**, and **SAML 2.0**.",
      "**Core Capabilities:** (1) **Identity Brokering:** Keycloak can delegate authentication to existing corporate directories (LDAP, Active Directory) or social identity providers (Google, GitHub, Facebook). (2) **Standard Protocols:** Relies heavily on OIDC and SAML instead of proprietary mechanisms. (3) **Customization:** Highly customizable themes for login pages, and extensible SPIs (Service Provider Interfaces) for custom authenticators or mappers.",
      "**Architecture:** Keycloak acts as an **Authorization Server**. When an application (the **Client**) needs to authenticate a user (the **Resource Owner**), it redirects them to Keycloak. Keycloak displays the login screen, validates credentials (against its database or federated IDP), and issues tokens. The application then uses these tokens to secure its own resources or call downstream APIs (**Resource Servers**).",
    ],
    code: `// === Keycloak High-Level Architecture ===

// 1. Actors in the IAM Ecosystem

// +-------------------+        1. Request Access          +--------------------+
// |                   | --------------------------------> |                    |
// |   User (Browser)  |                                   |  Client App (SPA)  |
// | (Resource Owner)  | <-------------------------------- |                    |
// |                   |    2. Redirect to Keycloak        +--------------------+
// +-------------------+                                            ^  |
//       |       ^                                                  |  |
//       |       |                                                  |  |
//       |       |                                     5. Send JWT  |  | 6. Call API
//       |       | 4. Issue Tokens                                  |  |    w/ Token
//       V       | (ID Token, Access Token)                         |  V
// +-------------------+                                   +--------------------+
// |                   |                                   |                    |
// |  Keycloak Server  |                                   |  Spring Boot API   |
// |   (Auth Server)   |                                   |  (Resource Server) |
// |                   |                                   |                    |
// +-------------------+                                   +--------------------+
//       |       ^
//       |       | (Identity Federation)
//       V       |
// +-------------------+
// |  Active Directory |
// |   / LDAP / IdP    |
// +-------------------+

// 2. Protocols Breakdown
// - OAuth 2.0: Authorization framework. Solves "how do I grant an app access to my data without giving it my password?"
// - OpenID Connect (OIDC): Authentication layer built ON TOP of OAuth 2.0. Solves "who logged in?"
// - SAML 2.0: Older XML-based protocol, still heavily used in enterprise integrations.`,
    practice: "Identify the roles: In a scenario where a user logs into an Angular SPA which then fetches their billing profile from a Spring Boot backend, identify who acts as the Resource Owner, the Client, the Authorization Server, and the Resource Server.",
    solution: `// Solution

// 1. Resource Owner: The human User accessing the application. They own the billing data.
// 2. Client: The Angular SPA. It is "acting on behalf" of the user to view their data.
// 3. Authorization Server: Keycloak. It authenticates the user and issues the OAuth2 tokens.
// 4. Resource Server: The Spring Boot API. It holds the secured billing data and validates the incoming token.`
  },
  {
    time: "Hour 2",
    title: "OAuth 2.0 & OpenID Connect Fundamentals",
    concept: [
      "**OAuth 2.0** is NOT an authentication protocol; it is for **authorization**. It issues an **Access Token**, which acts like a hotel key card — it lets you into a specific room (API endpoint) but doesn't say who you are. **OpenID Connect (OIDC)** adds authentication by providing an **ID Token** (a JWT representing the user's identity) alongside the Access Token.",
      "**Authorization Code Flow (with PKCE):** The most secure and standard flow for modern web apps (SPAs) and mobile apps. (1) App redirects user to Keycloak with a \`client_id\` and a PKCE code challenge. (2) User logs in. (3) Keycloak redirects back with a short-lived **Authorization Code**. (4) App securely exchanges this code (and the PKCE verifier) for tokens via a back-channel request.",
      "**Client Credentials Flow:** Used for machine-to-machine (M2M) communication where no human user is involved. A backend service uses its own \`client_id\` and \`client_secret\` to request an access token directly from Keycloak. This token is used to call another backend service.",
      "**Scopes & Claims:** A **Scope** represents the level of access requested (e.g., \`openid\`, \`profile\`, \`email\`, \`read:billing\`). The Access Token contains **Claims** — key-value pairs asserting facts about the subject (e.g., \`sub\` for user ID, \`roles\` for permissions).",
    ],
    code: `// === OAuth 2.0 Flows Detail ===

// 1. Authorization Code Flow with PKCE (For Frontend APPs)
// Step 1: App generates Code Verifier (random string) and Code Challenge (SHA256 of verifier).
// Step 2: Redirect to Auth Endpoint:
// GET https://keycloak.example.com/realms/myrealm/protocol/openid-connect/auth
//   ?client_id=my-angular-app
//   &response_type=code
//   &scope=openid profile email
//   &redirect_uri=https://myapp.com/callback
//   &code_challenge=<challenge>
//   &code_challenge_method=S256

// Step 3: User authenticates. Keycloak redirects back:
// GET https://myapp.com/callback?code=SPLIT_SECOND_AUTH_CODE

// Step 4: App exchanges code for tokens (Back-channel HTTP POST):
// POST https://keycloak.example.com/realms/myrealm/protocol/openid-connect/token
// Content-Type: application/x-www-form-urlencoded
//   client_id=my-angular-app
//   &grant_type=authorization_code
//   &code=SPLIT_SECOND_AUTH_CODE
//   &redirect_uri=https://myapp.com/callback
//   &code_verifier=<original_verifier>

// Response:
// {
//   "access_token": "eyJhb...",
//   "id_token": "eyJhb...",
//   "refresh_token": "eyJhb...",
//   "expires_in": 300
// }

// 2. Client Credentials Flow (For M2M / Backend Services)
// POST https://keycloak.example.com/realms/myrealm/protocol/openid-connect/token
// Content-Type: application/x-www-form-urlencoded
// Authorization: Basic <Base64(clientId:clientSecret)>
//
//   grant_type=client_credentials
//   &scope=write:billing`,
    practice: "Explain why the Implicit Flow (an older OAuth2 flow that returned tokens directly in the URL redirect) is now deprecated in favor of the Authorization Code Flow with PKCE for single-page applications.",
    solution: `// Solution

// In the old Implicit Flow, access tokens were appended directly to the redirect URI (e.g., \`#access_token=...\`).
// Because it was in the URL hash, the token was exposed to:
// 1. Browser history.
// 2. Malicious scripts running on the page (XSS).
// 3. Referrer headers if the SPA navigated away.
//
// Authorization Code Flow with PKCE solves this:
// 1. Keycloak returns a short-lived authorization code in the URL.
// 2. The SPA exchanges this code for a real token via a secure POST request.
// 3. Even if an attacker steals the auth code from the URL, they cannot exchange it because they lack the original \`code_verifier\` (PKCE) which was generated dynamically by the SPA.`
  },
  {
    time: "Hour 3",
    title: "JWT Tokens Deep Dive",
    concept: [
      "**JSON Web Token (JWT)** is a compact URL-safe format for representing claims. It consists of three parts separated by dots: **Header.Payload.Signature**. Because it is signed, the Resource Server (Spring Boot) can verify the token's authenticity locally without needing to call Keycloak on every request.",
      "**Header:** Contains metadata about the token, crucially the \`alg\` (algorithm, typically **RS256** — RSA Signature with SHA-256) and the \`kid\` (Key ID). The Resource Server uses the \`kid\` to identify which public key to fetch from Keycloak to verify the signature.",
      "**Payload:** Contains the claims. Important standard claims: \`iss\` (Issuer: who created it), \`sub\` (Subject: the user), \`aud\` (Audience: who the token is intended for), \`exp\` (Expiration Time), and \`iat\` (Issued At). Keycloak also embeds custom claims like \`realm_access.roles\`.",
      "**Signature:** Created by taking the Base64Url encoded Header and Payload, and signing it using Keycloak's private key. Anyone with Keycloak's public key (the JKWs endpoint) can mathematically verify the token wasn't tampered with.",
    ],
    code: `// === Anatomy of a Keycloak JWT ===

// A JWT looks like this: xxxxx.yyyyy.zzzzz
// Let's decode a typical Keycloak Access Token:

// 1. Header (Base64Url Decoded)
// {
//   "alg": "RS256",
//   "typ": "JWT",
//   "kid": "8df...3a2"  <-- Identifies the public key needed for validation
// }

// 2. Payload (Base64Url Decoded)
// {
//   "exp": 1716301200,                // Expiration timestamp
//   "iat": 1716300900,                // Issued at timestamp
//   "jti": "d8e...9f1",               // Unique token identifier
//   "iss": "http://localhost:8080/realms/myrealm", // Issuer
//   "aud": "account",                 // Audience
//   "sub": "user-uuid-1234-5678",     // Subject (User ID)
//   "typ": "Bearer",
//   "azp": "my-angular-app",          // Authorized Party (Client ID)
//   "preferred_username": "jdoe",
//   "email": "jdoe@example.com",
//   
//   // Keycloak specific role mappings
//   "realm_access": {
//     "roles": [
//       "offline_access",
//       "default-roles-myrealm",
//       "admin"                      // Important! We map this in Spring Boot
//     ]
//   },
//   "resource_access": {
//     "my-angular-app": {
//       "roles": [
//         "client_user"
//       ]
//     }
//   }
// }

// 3. Signature
// RSASHA256(
//   base64UrlEncode(header) + "." + base64UrlEncode(payload),
//   KeycloakPrivateKey
// )

// How Spring Boot validates this:
// 1. Spring Boot reads the "iss" (issuer) and fetches the JWKS (JSON Web Key Set) endpoint:
//    http://localhost:8080/realms/myrealm/protocol/openid-connect/certs
// 2. It finds the public key matching the token's "kid".
// 3. It checks the signature using that public key.
// 4. It verifies "exp" hasn't passed and "iss" matches expectations.`,
    practice: "What is the difference between Token Introspection and local JWT validation (using JWKS)? When would you use one over the other?",
    solution: `// Solution

// Local JWT Validation (JWKS):
// - The Resource Server fetches Keycloak's public keys once and caches them.
// - It mathematically validates the token's signature, expiration, and claims locally.
// - Pros: Very fast, no network latency per request, highly scalable.
// - Cons: Cannot immediately detect if a user was deleted or revoked until the token expires.

// Token Introspection:
// - The Resource Server makes an HTTP POST to Keycloak's /introspect endpoint for EVERY incoming request.
// - Keycloak replies with {"active": true} or {"active": false}.
// - Pros: Instant revocation. If a user is banned, their token immediately stops working.
// - Cons: Network overhead, puts massive load on Keycloak.

// Best Practice: Use Local Validation for standard architectures, but keep Access Tokens short-lived (e.g., 5-15 minutes). For high-security environments where instant revocation is critical, use Introspection.`
  },
  {
    time: "Hour 4",
    title: "Keycloak Installation & Deployment",
    concept: [
      "**Containerized Deployment:** The modern and recommended way to deploy Keycloak is using Docker. Keycloak requires a relational database (PostgreSQL, MySQL) for persistent storage of realms, users, and clients.",
      "**Production Configuration:** Keycloak defaults to 'dev' mode (`start-dev`), which uses an in-memory H2 database, HTTP (no HTTPS), and lax strictness. In production, you must use `start`, configure `KC_DB`, `KC_DB_URL`, setup TLS, and set `KC_HOSTNAME` to prevent redirect mismatch errors.",
      "**Key Environment Variables:** `KEYCLOAK_ADMIN` and `KEYCLOAK_ADMIN_PASSWORD` create the initial master admin account (only on first boot). `KC_DB` controls the dialect (e.g., `postgres`). `KC_PROXY` helps Keycloak realize it's behind Nginx/ALB and trust X-Forwarded-Proto headers.",
      "**Realms Mapping:** A **Realm** is a completely isolated tenant. The `master` realm is only for administrating Keycloak itself. You ALWAYS create a new realm (e.g., `corporate-realm`) for your application. Realms do not share users or clients.",
    ],
    code: `// === Keycloak Docker Compose Architecture ===

// docker-compose.yml
//version: '3.8'
//
//services:
//  postgres:
//    image: postgres:15
//    environment:
//      POSTGRES_DB: keycloak
//      POSTGRES_USER: keycloak
//      POSTGRES_PASSWORD: password
//    volumes:
//      - postgres_data:/var/lib/postgresql/data
//    ports:
//      - "5432:5432"
//    networks:
//      - keycloak-net
//
//  keycloak:
//    image: quay.io/keycloak/keycloak:latest
//    command: start-dev    # Use "start" for production requiring HTTPS/optimized build
//    environment:
//      # Admin Credentials
//      KEYCLOAK_ADMIN: admin
//      KEYCLOAK_ADMIN_PASSWORD: admin
//      
//      # Database configuration
//      KC_DB: postgres
//      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
//      KC_DB_USERNAME: keycloak
//      KC_DB_PASSWORD: password
//      
//      # External hostname (vital for redirects)
//      KC_HOSTNAME: localhost # Or your actual domain
//      # KC_PROXY: edge       # If behind a reverse proxy handling TLS
//      
//    ports:
//      - "8080:8080"
//    depends_on:
//      - postgres
//    networks:
//      - keycloak-net
//
//volumes:
//  postgres_data:
//
//networks:
//  keycloak-net:

// In production, Keycloak uses a build step. You must "build" an optimized image 
// containing your DB drivers and features:
//
// FROM quay.io/keycloak/keycloak:latest as builder
// ENV KC_HEALTH_ENABLED=true
// ENV KC_METRICS_ENABLED=true
// ENV KC_DB=postgres
// RUN /opt/keycloak/bin/kc.sh build
//
// FROM quay.io/keycloak/keycloak:latest
// COPY --from=builder /opt/keycloak/ /opt/keycloak/
// ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
// CMD ["start", "--optimized"]`,
    practice: "Explain the purpose of the `KC_PROXY=edge` environment variable when running Keycloak behind an AWS Application Load Balancer (ALB) or NGINX.",
    solution: `// Solution

// When Keycloak is behind a reverse proxy (like NGINX or ALB), the TLS/SSL termination happens at the proxy.
// The proxy handles "https://myapp.com" and then forwards the request internally to Keycloak over plain HTTP.
//
// Without KC_PROXY=edge (or KC_PROXY_HEADERS=xforwarded in newer versions):
// 1. Keycloak thinks it is running on "http://..."
// 2. It generates login links, redirects, and JWKS URIs starting with "http://".
// 3. The browser blocks these as Mixed Content or redirect mismatches.
//
// Setting KC_PROXY=edge tells Keycloak:
// "Trust the X-Forwarded-For and X-Forwarded-Proto headers injected by the proxy, and generate all URLs using those values (i.e., HTTPS)." `
  },
  {
    time: "Hour 5",
    title: "Keycloak Setup & UI Configuration",
    concept: [
      "**Realms vs Clients:** A Realm manages a set of users, credentials, roles, and groups. A **Client** is an entity (application) that requests authentication. An Angular SPA is a 'Public Client', while a Spring Boot Resource Server is a 'Bearer-only Client'.",
      "**Client Configuration:** To set up a frontend app, create a Client, set 'Client Authentication' to False (public client). Configure **Valid Redirect URIs** (e.g., `http://localhost:4200/*`) and **Web Origins** (for CORS). This ensures Keycloak only redirects auth codes to trusted URLs.",
      "**Roles: Realm vs Client:** **Realm Roles** are global to the realm (e.g., `SUPER_ADMIN`). **Client Roles** are specific to a single application in that realm (e.g., `frontend-app` -> `editor`). Generally, mapping everything to Realm Roles is simpler for microservice architectures.",
      "**Protocol Mappers:** By default, Keycloak puts roles in the token payload under `realm_access.roles`. If your downstream app expects roles in a specific claim (like simple `groups` or `roles` array), you use a Mapper in the Client Scope to copy the info to a custom claim.",
    ],
    code: `// === Keycloak Step-by-Step UI Configuration ===

// 1. Initial Login
// - Go to http://localhost:8080/admin
// - Login with admin/admin

// 2. Create the App Realm
// - Hover over "Keycloak" (top left), click "Create Realm".
// - Name: "company-realm". Click Create.
// - (Never deploy your apps against the "master" realm).

// 3. Create the Frontend Client
// - Clients -> Create Client
// - Client ID: "angular-frontend"
// - Client Authentication: OFF (This makes it a Public Client compatible with PKCE)
// - Root URL: http://localhost:4200
// - Valid Redirect URIs: http://localhost:4200/*
// - Web Origins: http://localhost:4200 (Enables CORS)

// 4. Create the Backend Client (Optional but recommended)
// - Client ID: "spring-boot-api"
// - Client Authentication: ON
// - Authorization: ON (This designates it as a Resource Server / Bearer-only)

// 5. Create Realm Roles
// - Realm Roles -> Create Role
// - Role Name: "ROLE_ADMIN"
// - Role Name: "ROLE_USER"
// (Spring Security expects roles to start with 'ROLE_' by default)

// 6. Create Users
// - Users -> Add user
// - Username: "alice", Email: "alice@test.com"
// - Click "Credentials" -> Set Password -> Disable "Temporary".
// - Click "Role Mapping" -> Assign "ROLE_ADMIN".

// 7. Configure Token Lifespans
// - Realm Settings -> Sessions
// - SSO Session Idle: 30 Minutes
// - Access Token Lifespan: 5 Minutes
// - (Frontend will silently refresh tokens using the refresh token before 5 min ends)

// 8. View Generated Endpoints
// - Go to Realm Settings -> General
// - Click "OpenID Endpoint Configuration"
// - This JSON lists your Auth URIs, Token URIs, and JWKS URI used by Spring Boot.`,
    practice: "Your Spring Boot application expects an array of roles at the top level of the JWT under the key `authorities`, but Keycloak puts them under `realm_access.roles`. How do you flatten this using Keycloak UI?",
    solution: `// Solution (Using Protocol Mappers)

// 1. Go to "Client Scopes" -> "roles" -> "Mappers"
// 2. Click "Configure a new mapper" -> "User Realm Role"
// 3. Settings:
//    - Name: "flat_roles"
//    - Multivalued: ON
//    - Token Claim Name: "authorities"
//    - Add to ID token: OFF
//    - Add to access token: ON
//
// Now when Keycloak issues an access token, it will include:
// {
//   ...
//   "authorities": ["ROLE_ADMIN", "ROLE_USER"]
// }
// This completely removes the need for complex custom JwtConverters in Spring Boot!`
  },
  {
    time: "Hour 6",
    title: "TLS/SSL Certificates & HTTPS Configuration",
    concept: [
      "**Why HTTPS is Mandatory:** OAuth2 and OIDC rely on Bearer tokens. If tokens are transmitted over plain HTTP, network eavesdroppers can steal them and impersonate users. Keycloak enforces HTTPS for external redirects by default.",
      "**Keystores & Truststores:** Java applications (like Keycloak and Spring Boot) historically use JKS (Java KeyStore) or PKCS12 files to store cryptographic keys. A **Keystore** holds the private key and the server's certificate. A **Truststore** holds the public certificates of externally trusted entities (e.g., intermediate CAs or self-signed certs of other services).",
      "**Self-Signed vs CA-Signed:** For local development, you generate self-signed certificates. Because browsers and OSs don't inherently trust them, you must configure Spring Boot (the Resource Server) to trust the Keycloak Dev certificate so it can fetch the JWKS endpoint over HTTPS.",
      "**Configuring Keycloak TLS:** In the official Docker image, placing a `cert.pem` and `key.pem` in `/opt/keycloak/conf/` and running `start --https-certificate-file=...` enables HTTPS.",
    ],
    code: `// === Generating and Configuring TLS Certificates ===

// 1. Generate Local Self-Signed Certs for Keycloak Data
// We use OpenSSL to generate a private key and a cert valid for localhost
//
// openssl req -x509 -newkey rsa:4096 -keyout keycloak.key -out keycloak.crt \\
//   -days 365 -nodes -subj "/CN=localhost"

// 2. Start Keycloak with Certificates (Docker Compose mapping)
// volumes:
//   - ./certs/keycloak.crt:/opt/keycloak/conf/server.crt:ro
//   - ./certs/keycloak.key:/opt/keycloak/conf/server.key:ro
// command: start --optimized --https-certificate-file=/opt/keycloak/conf/server.crt --https-certificate-key-file=/opt/keycloak/conf/server.key

// 3. The Spring Boot Trust Problem
// Spring Boot needs to talk to Keycloak to validate JWTs:
// GET https://localhost:8443/realms/company-realm/protocol/openid-connect/certs
// 
// Because Keycloak is using a self-signed cert, Spring Boot's JVM will throw:
// PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException
//
// Solution A (For Dev Only): Disable SSL Verification in Spring (Dangerous)
// Solution B (Correct): Import Keycloak's .crt into Spring Boot's Truststore.

// 4. Create a Truststore for Spring Boot
// keytool -importcert -file keycloak.crt -alias keycloak -keystore truststore.p12 \\
//   -storetype PKCS12 -storepass changeit -noprompt

// 5. Configure Spring Boot to use the Truststore
// Run Spring Boot with JVM arguments:
// -Djavax.net.ssl.trustStore=/path/to/truststore.p12
// -Djavax.net.ssl.trustStorePassword=changeit`,
    practice: "Your Spring Boot application connects to a Keycloak server behind a corporate proxy. The connection fails with `SSLHandshakeException`. What is the underlying cause and how do you resolve it?",
    solution: `// Solution

// Cause: The corporate proxy intercepts traffic by substituting the server's certificate with its own, actively performing SSL inspection. The Spring Boot JVM does not recognize the proxy's root certificate.
//
// Resolution:
// 1. Obtain the Root CA certificate of the corporate proxy.
// 2. Open a terminal and use Java's 'keytool' to import the proxy cert into a local truststore:
//    keytool -import -alias corp-proxy -file proxy-root.cer -keystore myTrustStore.jks -storepass changeit
// 3. Launch the Spring Boot application pointing to this new truststore:
//    java -Djavax.net.ssl.trustStore=myTrustStore.jks -Djavax.net.ssl.trustStorePassword=changeit -jar app.jar
//
// Now Spring Boot trusts the proxy, allowing it to successfully contact Keycloak and fetch the JWKS.`
  },
  {
    time: "Hour 7",
    title: "Spring Boot Resource Server Configuration",
    concept: [
      "**Resource Server:** In OAuth2 terminology, the backend API holding the protected data is the Resource Server. It does not handle logins or issue tokens; it only validates tokens sent in the `Authorization: Bearer <token>` header.",
      "**Spring Security:** Adding `spring-boot-starter-oauth2-resource-server` tells Spring Security to expect JWTs. You configure the `issuer-uri` in `application.yml`, which Spring uses to automatically fetch the public keys (JWKS) on startup.",
      "**SecurityFilterChain:** The core of Spring Security 6+. It defines which endpoints require authentication. You write a Bean that uses a builder pattern to define authorization rules (e.g., `requests.anyRequest().authenticated()`).",
      "**Stateless Sessions:** Because JWTs contain all necessary user info mathematically signed, the backend does not need to store user sessions (no `JSESSIONID`). The Spring Security context is created per-request and destroyed immediately afterward. This makes horizontal scaling trivial.",
    ],
    code: `// === Spring Boot Resource Server Setup ===

// 1. Maven Dependencies (pom.xml)
// <dependency>
//     <groupId>org.springframework.boot</groupId>
//     <artifactId>spring-boot-starter-web</artifactId>
// </dependency>
// <dependency>
//     <groupId>org.springframework.boot</groupId>
//     <artifactId>spring-boot-starter-security</artifactId>
// </dependency>
// <dependency>
//     <groupId>org.springframework.boot</groupId>
//     <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
// </dependency>

// 2. application.yml Configuration
// spring:
//   security:
//     oauth2:
//       resourceserver:
//         jwt:
//           # This URI MUST match the "iss" claim inside the JWT exactly!
//           # Spring will append /.well-known/openid-configuration to fetch the keys
//           issuer-uri: http://localhost:8080/realms/company-realm
//           
//           # (Optional) If you need to map scopes to a specific claim instead of 'scope'
//           # authorities-claim-name: custom_roles

// 3. SecurityFilterChain Configuration (SecurityConfig.java)
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF because we use stateless Bearer tokens, not cookies
            .csrf(csrf -> csrf.disable())
            
            // Set session management to STATELESS
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // Define route rules
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().authenticated()
            )
            
            // Tell Spring to act as an OAuth2 Resource Server reading JWTs
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> {
                    // Custom decoder/converter goes here (Next Lesson)
                })
            );

        return http.build();
    }
}`,
    practice: "Write an exception handler configuration in the SecurityFilterChain that catches `AccessDeniedException` and `AuthenticationException` and returns a cleanly formatted JSON response instead of the default HTML error pages.",
    solution: `// Solution

// Add this to your HttpSecurity builder chain in SecurityConfig.java:
//
// .exceptionHandling(exceptions -> exceptions
//     // AuthenticationException (Missing or invalid token)
//     .authenticationEntryPoint((request, response, ex) -> {
//         response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
//         response.setContentType("application/json");
//         response.getWriter().write("{\\"error\\": \\"Unauthorized\\", \\"message\\": \\"" + ex.getMessage() + "\\"}");
//     })
//     // AccessDeniedException (Valid token, but missing required roles)
//     .accessDeniedHandler((request, response, ex) -> {
//         response.setStatus(HttpServletResponse.SC_FORBIDDEN);
//         response.setContentType("application/json");
//         response.getWriter().write("{\\"error\\": \\"Forbidden\\", \\"message\\": \\"Lacking required permissions\\"}");
//     })
// )`
  },
  {
    time: "Hour 8",
    title: "JWT Validation & Role Mapping",
    concept: [
      "**The Role Mapping Problem:** Spring Security expects roles to be prefixed with `ROLE_` and nested under the `scope` or `scp` claim by default. But Keycloak nests them deeply in JSON under `realm_access.roles`.",
      "**JwtAuthenticationConverter:** An interface in Spring Security that takes a valid `Jwt` and converts it into an `AbstractAuthenticationToken`. By plugging in a custom converter, we can extract the roles from `realm_access`, prefix them with `ROLE_`, and pass them to Spring Security context.",
      "**Configuring the Converter:** The custom converter is set in the `SecurityFilterChain` inside the `.oauth2ResourceServer(oauth -> oauth.jwt(jwt -> ...))` block. Once configured, standard Spring annotations like `@PreAuthorize(\"hasRole('ADMIN')\")` will work.",
      "**CORS (Cross-Origin Resource Sharing):** Because the frontend runs on a different port (e.g., 4200) than the backend (e.g., 8081), you MUST explicitly configure CORS. Spring Security processes CORS before authorization.",
    ],
    code: `// === Custom JWT Role Converter ===

// 1. The Converter Component
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        // Look for the "realm_access" claim which is an object
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        
        if (realmAccess == null || realmAccess.isEmpty()) {
            return Collections.emptyList();
        }

        // Extract the "roles" array
        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) realmAccess.get("roles");
        
        if (roles == null) {
            return Collections.emptyList();
        }

        // Map them to GrantedAuthority objects, prefixing with "ROLE_"
        return roles.stream()
                .map(roleName -> "ROLE_" + roleName)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }
}

// 2. Linking it to Spring Security (SecurityConfig.java)
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
// ... imports

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final KeycloakRoleConverter keycloakRoleConverter;

    public SecurityConfig(KeycloakRoleConverter keycloakRoleConverter) {
        this.keycloakRoleConverter = keycloakRoleConverter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        
        // Define the Authentication Converter Wrapper
        JwtAuthenticationConverter jwtAuthConverter = new JwtAuthenticationConverter();
        jwtAuthConverter.setJwtGrantedAuthoritiesConverter(keycloakRoleConverter);
        // Note: You can also set Principal claim name here (e.g., "preferred_username")

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtAuthConverter) // <-- Inject it here
                )
            );

        return http.build();
    }
    
    // Global CORS Configuration
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:4200")); // Frontend URL
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}`,
    practice: "If you used Keycloak Protocol Mappers (Hour 5) to flatten the roles into a top-level claim called `custom_roles`, write a 3-line `JwtAuthenticationConverter` to read those roles. You don't need a custom Java class, use `JwtGrantedAuthoritiesConverter`.",
    solution: `// Solution

// Inside your SecurityFilterChain Bean where you configure oauth2ResourceServer:

// 1. Create the default converter provided by Spring
// JwtGrantedAuthoritiesConverter authoritiesConverter = new JwtGrantedAuthoritiesConverter();

// 2. Tell it to look at your custom Keycloak mapped claim
// authoritiesConverter.setAuthoritiesClaimName("custom_roles");

// 3. Since Spring expects "ROLE_", ensure the prefix is set (or set to empty string if Keycloak mapped them with ROLE_ already)
// authoritiesConverter.setAuthorityPrefix("ROLE_");

// 4. Wrap and assign
// JwtAuthenticationConverter jwtAuthConverter = new JwtAuthenticationConverter();
// jwtAuthConverter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);
//
// http.oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter)));`
  },
  {
    time: "Hour 9",
    title: "Securing Endpoints & Method Security",
    concept: [
      "**URL-based Security vs Method Security:** URL-based security (`.requestMatchers(\"/api/admin/**\").hasRole(\"ADMIN\")`) intercepts HTTP calls at the Filter layer. **Method Security** (`@PreAuthorize`) uses AOP to proxy actual Java method calls, offering finer-grained access control even internally between services.",
      "**Method Security Activation:** You must annotate a configuration class with `@EnableMethodSecurity`. Then, you can place `@PreAuthorize` on any Spring Component or Controller method.",
      "**SpEL (Spring Expression Language):** `@PreAuthorize` accepts powerful expressions: `hasRole('ADMIN')`, `hasAnyRole('USER', 'ADMIN')`, or checking properties based on the currently logged-in user: `#username == authentication.name`.",
      "**Getting the User (Principal):** You can inject the current user into any Controller method by taking a `JwtAuthenticationToken` parameter, allowing you to read arbitrary claims (e.g., getting their email directly from the parsed token to perform a database lookup).",
    ],
    code: `// === Securing Controllers & Services ===

// 1. Enabling Method Security
// In a @Configuration class (like SecurityConfig):
// @EnableMethodSecurity(prePostEnabled = true)
// public class SecurityConfig { ... }

// 2. Demonstrating Endpoint Security and Principal Injection
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    // 1. Accessible to anyone authenticated
    @GetMapping
    public String getMyOrders(JwtAuthenticationToken authToken) {
        // We can extract attributes directly from the token!
        String userId = authToken.getName(); // Usually the 'sub' claim (UUID)
        
        Jwt jwt = (Jwt) authToken.getCredentials();
        String email = jwt.getClaimAsString("email");
        String username = jwt.getClaimAsString("preferred_username");

        return "Returning orders for: " + username + " (" + email + ")";
    }

    // 2. Role-Based Access Control
    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public String createOrder() {
        return "Order created";
    }

    // 3. Admin Only Route
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public String deleteOrder(@PathVariable String id) {
        return "Order " + id + " deleted";
    }

    // 4. Complex Rules (Only the owner can view the specific resource)
    // Assuming you have an OrderRepository that fetches the order's owner UUID
    @GetMapping("/{id}")
    @PreAuthorize("@orderSecurity.isOwner(authentication, #id) or hasRole('ADMIN')")
    public String viewSpecificOrder(@PathVariable String id) {
        return "Viewing detailed order data";
    }
}

// 3. Custom Security Bean for Complex Authorizations
import org.springframework.stereotype.Component;
import org.springframework.security.core.Authentication;

@Component("orderSecurity")
public class OrderSecurity {
    
    // orderRepository injected here...

    public boolean isOwner(Authentication authentication, String orderId) {
        String currentUserId = authentication.getName(); // UUID from token
        // Example check: return orderRepository.findById(orderId).getOwnerId().equals(currentUserId);
        return true; 
    }
}`,
    practice: "Your API receives requests where a specific user ID is passed in the URL (e.g., `/api/users/1234/profile`). Using `@PreAuthorize`, restrict access to this endpoint so that only the user with that exact ID, OR an administrator with `ROLE_ADMIN`, can access it.",
    solution: `// Solution

// @GetMapping("/api/users/{userId}/profile")
// @PreAuthorize("#userId == authentication.name or hasRole('ADMIN')")
// public UserProfile getProfile(@PathVariable String userId) {
//     return userService.getProfile(userId);
// }

// 'authentication.name' returns the Principal's name, which in an OAuth2 JWT context is usually the 'sub' claim (the Keycloak User ID).
// SpEL dynamically evaluates the parameter '#userId' from the method signature.`
  },
  {
    time: "Hour 10",
    title: "Full Flow: React/Angular Frontend Integration",
    concept: [
      "**OIDC Client Libraries:** Writing OAuth2 Code Flow with PKCE manually is extremely difficult. You should always use a certified library. For Angular/React/Vue, `oidc-client-ts` or framework wrappers like `angular-auth-oidc-client` are standard.",
      "**Frontend Responsibilities:** (1) Redirect unauthenticated users to Keycloak. (2) Receive the callback code and exchange it for tokens. (3) Store the tokens securely (usually in memory paired with a silent-refresh hidden iframe, or LocalStorage if risking XSS). (4) Intercept all outbound HTTP API requests and attach `Authorization: Bearer <token>`.",
      "**Token Refresh Lifecycle:** Access tokens are short-lived. The client library sets a timer to use the long-lived **Refresh Token** to silently request a new Access Token in the background right before it expires.",
      "**Logout Flow:** Logging out of the SPA (deleting the token from memory) is not enough. You must redirect the user to the Keycloak `/logout` endpoint with an `id_token_hint` to terminate their active SSO session on the server.",
    ],
    code: `// === Frontend OIDC Integration (React Example using oidc-client-ts) ===

// 1. Configuration (authConfig.js)
// import { UserManager, WebStorageStateStore } from "oidc-client-ts";

// const config = {
//   authority: "http://localhost:8080/realms/company-realm", // The Issuer URI
//   client_id: "react-frontend",
//   redirect_uri: "http://localhost:3000/callback", // Where Keycloak sends the code
//   response_type: "code",                          // Enforces Authorization Code Flow
//   scope: "openid profile email offline_access",   // What claims we want
//   post_logout_redirect_uri: "http://localhost:3000/",
//   userStore: new WebStorageStateStore({ store: window.localStorage })
// };

// export const userManager = new UserManager(config);


// 2. Login Component
// const Login = () => {
//   return (
//     <button onClick={() => userManager.signinRedirect()}>
//       Login with Keycloak
//     </button>
//   );
// }

// 3. Callback Component (The redirect_uri)
// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
//
// const Callback = () => {
//   const navigate = useNavigate();
//
//   useEffect(() => {
//     userManager.signinCallback().then((user) => {
//       console.log("Logged in!", user);
//       navigate("/dashboard"); // Successful login
//     }).catch(e => console.error("Login failed", e));
//   }, []);
//
//   return <div>Processing login...</div>;
// }

// 4. API Interceptor (Axios Example)
// import axios from "axios";
//
// const api = axios.create({ baseURL: "http://localhost:8081/api" });
//
// api.interceptors.request.use(async (config) => {
//   // Get the current user session
//   const user = await userManager.getUser();
//   
//   if (user?.access_token) {
//     // Inject the Bearer token!
//     config.headers.Authorization = \`Bearer \${user.access_token}\`;
//   }
//   return config;
// });

// 5. Logout Action
// const logout = () => {
//   // This redirects to Keycloak, destroys the central session,
//   // and redirects back to post_logout_redirect_uri.
//   userManager.signoutRedirect();
// }`,
    practice: "When configuring `angular-auth-oidc-client` or `oidc-client-ts`, you must specify a `redirect_uri` array in Keycloak. If a developer sets the Valid Redirect URI in Keycloak to `http://localhost:3000/*` but the app redirects to `http://127.0.0.1:3000/callback`, what error will occur? Why is this restriction important?",
    solution: `// Solution

// Error: Keycloak will present an "Invalid parameter: redirect_uri" error page, and the application will fail to initiate the login flow.
//
// Why: OAuth 2.0 strictly requires an exact match (or structural match if wildcards are used) between the URI provided in the login request and the ones registered for the Client in Keycloak.
//
// Importance: This prevents "Open Redirect" attacks. If Keycloak allowed any redirect URI, a malicious app could trick a user into logging in and then append their own 'redirect_uri=attacker.com/steal-token'. Keycloak would send the highly sensitive Authorization Code to the attacker's server.`
  }
];
