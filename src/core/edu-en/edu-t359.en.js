/*
 * English edu cards for RSA signing and elliptic curve point arithmetic.
 *
 * Partial shard by design: the English layer only covers ops that have been translated;
 * anything missing falls back to Chinese automatically (see getEdu in eduContent.js).
 *
 * Pure data, no side effects. Export contract matches eduContent.js header.
 */
export default {
  rsaSign: {
    what: "RSA signing: RSASSA-PKCS#1 v1.5 and PSS modes (RFC 8017); the private key may be given as decimal (n,d) or PEM.",
    principle:
      "v1.5 is \"build the template, then exponentiate\": hash the message, wrap it in a DigestInfo, prefix 0001 + a run of FF + 00 to form EM, and the signature is $s = EM^d \\bmod n$ — deterministic, so the same key and message always give the same result.\n\n" +
      "PSS is \"salt, then hash again\": EM embeds a random salt and DB is produced through an MGF1 mask, with the same final exponentiation — a different salt each time means two signatures differ, which is by design, not a bug (it resists certain chosen-ciphertext attacks).\n\n" +
      "Three private-key forms are accepted: decimal n,d; PKCS#1 RSA PRIVATE KEY PEM; PKCS#8 PRIVATE KEY PEM. The PSS salt length defaults to hLen and can be set to 0/16/20/32/max.",
    usage: "Message + private key (pick a form), with signature mode / hash / salt length as needed. Outputs the signature in hex and decimal, plus the full EM intermediate values.",
    examples: [
      { in: "attack at dawn", param: "PKCS#1 v1.5, SHA-256, 1024-bit PKCS#8 PEM private key", out: "signature s (hex, 128 bytes) = 798e63c8301652200538d6be40351785558719724596f24c4260bdb614481ce4e6b92886b70ee196a3fb9afc183d5fd7411d9700b7cd5817b5bf2c6130cc3d05969c973af3dd5e20b5a3567fa5a868d056d80da29cce3d76c722f9f2ee036bedf6ba96b23428befda5e0a5f043773749cf7610a12162be589d91d983ac3d80ee", desc: "Deterministic: re-running before the key changes is byte-for-byte identical, and it can be cross-checked with openssl dgst -sha256 -sign" },
      { in: "same message, PSS mode", param: "PSS, SHA-256, sLen=hLen", out: "two runs produce different signatures (random salt) — expected", desc: "PSS randomness" },
    ],
    tips: [
      "A 512-bit modulus cannot run PSS with SHA-256 or stronger (emLen < hLen+sLen+2 fails immediately) — use a bigger key or a shorter salt.",
      "The classic CTF \"Bleichenbacher'06 signature forgery\" targets verifiers that do not check the FF padding length — the RSA Verify output shows why byte-for-byte comparison on the verifying side matters.",
      "Signing is not encryption: what is signed is the encoded hash block, not the plaintext itself; do not use a decryption op to recover EM and pass it off as a signature.",
      "Deployment warning: if a server exposes a raw unpadded RSA signing/decryption oracle (e.g. raw PKCS#11 operations on an HSM, or blind-signature protocols), the 2026 eNFS attack (Shea / Haller / Suhl / Heninger / Thomé) lets an attacker forge arbitrary signatures offline for a long time, without factoring the modulus. Regular signatures that correctly use PKCS#1 v1.5 / PSS padding do not expose such an oracle.",
    ],
    aka: ["rsa签名", "rsa sign", "rsassa", "rsassa-pkcs1-v1_5", "pkcs1 v1.5", "rsassa-pss", "pss签名", "rsa私钥签名", "sha256withrsa", "rsa sha256签名", "openssl dgst -sign", "rsa signature", "消息签名", "数字签名rsa", "rsa signing", "pkcs#1 v1.5 signature", "rsa-pss signature"],
  },
  eccCalc: {
    what: "Prime-field elliptic curve point arithmetic: add, subtract, multiply by a scalar, or double. Choose one of eight presets or supply custom domain parameters.",
    principle: "On $y^2 = x^3 + ax + b \\pmod{p}$, adding two points takes the inverse of the third intersection of their line with the curve. Doubling uses the tangent. Scalar multiplication $k \\cdot P$ uses repeated doubling and addition. Negative $k$ multiplies the inverse point.\n\n" +
      "P-192 and P-224 parameters are from SEC 2 v2; brainpoolP256r1 is from RFC 5639 §3.4; SM2 is from GB/T 32918.5-2017 §3 and RFC 8998 §3.2.1.",
    usage: "Choose `add`, `sub`, `mul`, or `double`. Set `P` (default `G`), `Q` for addition/subtraction (default `G`), and integer `k` for multiplication (default `2`). Points accept compressed `02/03‖X`, uncompressed `04‖X‖Y`, bare `X‖Y`, `G` (generator) and `O` (infinity). Supply `p/a/b/Gx/Gy/n` for a custom curve.",
    examples: [
      { in: "P=G, k=2", param: "Scalar multiplication, secp256k1", out: "04c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee51ae168fea63dc339a3c58419466ceaeef7f632653266d0e1236431a950cfe52a", desc: "Uncompressed 2G" },
    ],
    tips: [
      "P-192 and P-224 are for legacy compatibility and teaching. A point-arithmetic preset does not imply signing, key agreement or key-format support.",
      "`Infinity` is the group identity, for example when adding a point to its inverse.",
    ],
    aka: ["ECC calculator", "elliptic curve calculator", "elliptic curve point arithmetic", "EC point addition", "EC point subtraction", "EC point doubling", "EC scalar multiplication", "multiply base point", "generator point calculation", "point at infinity", "secp256k1 point calculator"],
  },
};
