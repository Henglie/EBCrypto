export default {
  sm2KeyGen: {
    what: "Generate an SM2 private/public key pair usable for both signing and encryption. The private scalar d lies in [1, n-2].",
    principle: "The sm2p256v1 parameters come from GB/T 32918.5-2017. This generator samples $d \\in [1,n-2]$ and computes $P=[d]G$. Why $[1,n-2]$: $d=0$ makes $P=[0]G$ the point at infinity, so the lower bound is 1; SM2 signing needs $(1+d)^{-1} \\bmod n$, and at $d=n-1$ we get $1+d \\equiv 0$ with no inverse, so the upper bound is n-2 (GB/T 32918.2-2016). Generic curves such as secp256k1 have no $(1+d)^{-1}$ term and use $[1,n-1]$; SM2's n-2 is a signing-specific constraint, not a typo. A key used only for encryption could take $d=n-1$, but this tool's key pair also signs, so it uses the stricter $[1,n-2]$. Recovering the private key from the public point is the elliptic-curve discrete logarithm problem.",
    usage: "No main input. Run to display the 32-byte private scalar, public X/Y coordinates, and compressed/uncompressed public points. Private and public keys download separately as hexadecimal text.",
    examples: [{ in: "", out: "A private scalar and its public point", desc: "Generated values vary with the configured random source; this is not a fixed test vector." }],
    tips: ["The default uses the system CSPRNG; custom deterministic randomness is for reproducible experiments, not a certified random generator.", "Never share a signing nonce across messages. GB/T 32918.2-2016 defines the signing algorithm; GB/T 32918.5-2017 defines this curve."],
    aka: ["SM2 key pair", "SM2 key generation", "SM2 keygen", "SM2 private scalar", "SM2 public point", "sm2p256v1 key pair", "SM2 signing key", "SM2 encryption key", "SM2 compressed public key", "SM2 uncompressed public key"],
  },
  sm2Sign: {
    what: "Sign a message with SM2, binding the signer identity and public key through ZA.",
    principle: "GB/T 32918.2-2016 §5.5: $Z_A=\\mathrm{SM3}(\\mathrm{ENTL}_A\\parallel ID_A\\parallel a\\parallel b\\parallel x_G\\parallel y_G\\parallel x_A\\parallel y_A)$ and $e=\\mathrm{SM3}(Z_A\\parallel M)$. ENTL_A is the 16-bit big-endian identity bit length. The byte-oriented interface therefore accepts at most 8191 identity bytes.",
    usage: "Enter the message and private key d in [1,n-2]. ID_A defaults to 1234567812345678. Omitted public coordinates are derived from d; supplied X/Y must both be present and match d. Both paths include ZA. Identity length is measured after UTF-8 encoding. Output is the 64-byte r||s pair, not ASN.1 DER.",
    examples: [{ in: "message digest", param: "private key d in hex; default ID_A; public X/Y omitted", out: "64 signature bytes displayed as hexadecimal", desc: "The signature changes with the nonce; verification uses the same identity and derived public key." }],
    tips: ["Omitting public coordinates does not select raw-message or no-ZA signing.", "A repeated or predictable signing nonce can expose the private key.", "Check message encoding, identity, public key and complete r/s when verification fails."],
    aka: ["SM2 signature", "SM2 signing", "SM2 sign", "SM2 ZA", "SM2 identity binding", "SM2 message digest", "GB/T 32918.2 signature", "SM2 r s", "SM2 signing key", "sm2p256v1 signature"],
  },
};
