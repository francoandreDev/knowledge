---
title: "L2 — Why asymmetric encryption solves the key distribution problem, and what it costs"
---

## Two keys instead of one

**If a single shared key has to travel over an interceptable channel,
what would actually fix that?** Not sending a secret at all. Asymmetric
encryption gives each party a mathematically related pair of keys: a
public key, safe to hand to literally anyone, and a private key that
never leaves its owner. Anything encrypted with the public key can
only be decrypted with the matching private key — so Alice can
encrypt something for Bob using a key he already published openly,
with no secret ever crossing the network.

```mermaid
sequenceDiagram
    participant A as Alice
    participant N as Network (interceptable)
    participant B as Bob
    Note over A,B: Symmetric — the key itself has to travel
    A->>N: encrypted file
    A->>N: the shared key
    N->>B: encrypted file
    N->>B: the shared key
    Note over N: An eavesdropper on this channel<br/>now has both the file and the key.
```

```mermaid
sequenceDiagram
    participant A as Alice
    participant N as Network (interceptable)
    participant B as Bob
    Note over A,B: Asymmetric — no secret ever travels
    B->>N: Bob's public key (safe to expose)
    N->>A: Bob's public key
    A->>N: file encrypted with Bob's public key
    N->>B: file encrypted with Bob's public key
    Note over N: An eavesdropper only ever sees<br/>the public key and ciphertext — useless without Bob's private key.
```

In the second diagram, the only thing that travels besides ciphertext
is Bob's _public_ key — which is safe to expose by design. Bob's
private key, the only thing that can decrypt the message, never
touches the network at all.

## What asymmetric encryption costs to get that benefit

|                  | Symmetric encryption                       | Asymmetric encryption                                                |
| ---------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| Keys involved    | One shared secret key                      | A public/private key pair                                            |
| Key distribution | Requires a secure channel to share the key | No secret ever needs to be transmitted                               |
| Speed            | Fast, even for large amounts of data       | Much slower — measured in L3, tens of times slower for the same data |
| Typical use      | Encrypting the actual bulk data            | Encrypting a small secret (like a symmetric key), or signing         |

Asymmetric encryption solves the key distribution problem, but it does
so at a real computational cost — it's not simply a strictly better
version of symmetric encryption.

## Why real systems use both together

**If asymmetric encryption solves the hard problem, why not just use
it for everything?** Because its slowness makes it impractical for
encrypting large amounts of data directly. The practical answer,
called **hybrid encryption**, combines both: encrypt the actual data
with a fast, randomly generated symmetric key, then encrypt that small
key with the recipient's public key. The recipient uses their private
key to unwrap the small symmetric key, then uses that key to decrypt
the actual data quickly. This is exactly the pattern behind HTTPS,
covered in the next unit — a brief asymmetric handshake, followed by
fast symmetric encryption for the rest of the connection.

## The generalizable lesson

**Is this only about encrypting emails?** No — the same shape shows up
anywhere two parties who haven't already shared a secret need to
communicate confidentially: signing software updates, securing a web
connection, verifying a message really came from who it claims to.
The underlying question is always the same: does a secret need to
travel to make this work, and if so, is there a way to avoid that
using a key pair instead?
