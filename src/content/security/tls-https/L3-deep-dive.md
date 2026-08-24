---
title: "L3 — Implementing a real chain-of-trust verifier, and proving what it can't catch"
---

## Building a minimal CA hierarchy with real signatures

Using Node's built-in `crypto` module for genuine RSA key pairs and
signatures — not a toy stand-in:

You do not need to master RSA, SHA-256, or X.509 to read this example.
Treat the code as a small paper-signing machine: one key signs a
certificate, another public key checks whether the paper is still
unchanged, and the chain says which witness signed which paper. The
real web certificate format is called X.509; this example uses plain
JSON so the responsibility of each field is visible.

```js
const crypto = require("crypto");

function generateKeyPair() {
  return crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
}

function signCert(cert, signerPrivateKey) {
  const payload = JSON.stringify({
    subject: cert.subject,
    issuer: cert.issuer,
    publicKey: cert.publicKey.export({ type: "spki", format: "pem" }),
  });
  const signature = crypto.sign(
    "sha256",
    Buffer.from(payload),
    signerPrivateKey,
  );
  return { ...cert, signature };
}

function verifyCertSignature(cert, issuerPublicKey) {
  const payload = JSON.stringify({
    subject: cert.subject,
    issuer: cert.issuer,
    publicKey: cert.publicKey.export({ type: "spki", format: "pem" }),
  });
  return crypto.verify(
    "sha256",
    Buffer.from(payload),
    issuerPublicKey,
    cert.signature,
  );
}
```

`signCert` produces a real SHA-256/RSA signature over the certificate's
contents, and `verifyCertSignature` checks it against the claimed
issuer's public key — this is the actual cryptographic operation a
browser performs, simplified to plain JSON instead of the X.509
binary format.

## Verifying the full chain, exactly as L2 described

```js
function verifyChain(leafCert, intermediateCert, rootPublicKey, hostname) {
  if (leafCert.subject !== hostname) {
    return { valid: false, reason: "hostname mismatch" };
  }
  if (!verifyCertSignature(intermediateCert, rootPublicKey)) {
    return { valid: false, reason: "intermediate not signed by trusted root" };
  }
  if (!verifyCertSignature(leafCert, intermediateCert.publicKey)) {
    return { valid: false, reason: "leaf not signed by intermediate" };
  }
  return {
    valid: true,
    reason: "chain verifies to a trusted root, hostname matches",
  };
}
```

This implements exactly the two checks from L2's flowchart: does the
certificate's subject match the address bar, and does every signature
in the chain verify up to a trusted root — nothing more.

## Setting up the CA hierarchy and issuing both certificates

```js
const root = generateKeyPair();
const intermediate = generateKeyPair();
const leafLegit = generateKeyPair();
const leafPhish = generateKeyPair();

const intermediateCert = signCert(
  {
    subject: "IntermediateCA",
    issuer: "RootCA",
    publicKey: intermediate.publicKey,
  },
  root.privateKey,
);

const legitLeafCert = signCert(
  {
    subject: "paypal.com",
    issuer: "IntermediateCA",
    publicKey: leafLegit.publicKey,
  },
  intermediate.privateKey,
);

const phishLeafCert = signCert(
  {
    subject: "paypa1-secure-login.com",
    issuer: "IntermediateCA",
    publicKey: leafPhish.publicKey,
  },
  intermediate.privateKey,
);
```

Both `paypal.com` and `paypa1-secure-login.com` requested a
certificate from the same intermediate CA, and both requests were
granted — the CA has no way to know, and no obligation to check, that
one of these domains is impersonating a well-known brand. It only
verified that each requester controlled the domain they asked for.

## Verifying both chains — and confirming the padlock lies to no one

```js
console.log(
  verifyChain(legitLeafCert, intermediateCert, root.publicKey, "paypal.com"),
);
// { valid: true, reason: 'chain verifies to a trusted root, hostname matches' }

console.log(
  verifyChain(
    phishLeafCert,
    intermediateCert,
    root.publicKey,
    "paypa1-secure-login.com",
  ),
);
// { valid: true, reason: 'chain verifies to a trusted root, hostname matches' }
```

**Both verify as `valid: true`.** This is not a bug in the verifier —
it's the correct, honest result. The chain-of-trust check answered
exactly the question it's designed to answer (does this domain's
certificate chain to a trusted root) for both domains truthfully.
Neither the CA nor the browser's verification logic was ever asked
"is this the real PayPal" — that was never part of the contract.

## What tampering actually breaks, to show the check isn't meaningless

```js
console.log(
  verifyChain(legitLeafCert, intermediateCert, root.publicKey, "evil.com"),
);
// { valid: false, reason: 'hostname mismatch' }

const tampered = { ...legitLeafCert, subject: "paypal.com-but-tampered" };
console.log(verifyCertSignature(tampered, intermediate.publicKey));
// false — the signature no longer matches the modified contents
```

The verifier isn't useless — it correctly rejects a hostname mismatch,
and it correctly detects that a certificate was altered after signing
(changing `subject` without re-signing invalidates the signature,
since the signature covers the exact certificate contents). What it
was never built to detect, and structurally cannot detect, is whether
the _domain string itself_ is a legitimate brand's domain or a
convincing lookalike — that comparison isn't cryptographic, it's
lexical, meaning text compared character by character, and it has to
happen in the human (or a separate anti-phishing system) reading the
address bar.

## What this proves and doesn't prove

**Does this mean TLS/HTTPS is pointless?** No — the encryption and
the hostname-match guarantee are both real and valuable; without them,
anyone on the network path could read or silently rewrite the login
form's contents even on the legitimate `paypal.com`. What this proves
is narrower and more precise: **chain-of-trust verification is a
necessary check, not a sufficient one**, for deciding whether a site
is safe to trust with a password.

**Try extending it yourself:** suppose a company later adds a check
that flags any domain within a small edit-distance — the number of
letter changes needed to turn one domain into another — of a list of
known, high-value target domains (like `paypal.com`) as suspicious
before showing a login form. Would that check belong inside
`verifyChain` itself, or does it need to live somewhere else in the
system? What would change if it lived inside `verifyChain`?

## Failure modes

| Failure mode                                                                                | What it gets wrong                                                                                                                                                             |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Treating a passing `verifyChain` result as proof the site is legitimate                     | The function's contract only covers domain-to-key binding, not brand identity — expanding what it's trusted to mean is the actual vulnerability                                |
| Assuming CAs manually review every domain before issuing a certificate                      | Domain-validated certificates (the vast majority in use) are issued automatically after an automated domain-control check, with no human review                                |
| Confusing "the certificate is valid" with "the certificate is for the domain I think it is" | Both checks passed for `paypa1-secure-login.com` — validity and identity-match are separate facts a user still has to check themselves                                         |
| Building anti-phishing logic as an afterthought instead of a first-class check              | If lookalike-domain detection isn't a deliberate, separate check, nothing in the TLS handshake will ever catch it — it's simply out of scope for what TLS verifies             |
| Assuming tampering after issuance is undetectable                                           | A modified certificate's signature breaks immediately, as shown above — the cryptography is doing real, verifiable work, just not the specific job of judging brand legitimacy |
