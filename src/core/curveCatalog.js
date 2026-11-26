// Prime-field, cofactor-one curves available for point arithmetic. Protocols
// such as ECDSA, ECDH and SM2 choose their own supported parameter sets.
const CURVE_DATA = [
  // SEC 2 v2 §2.2.2; RFC 5480 §2.1.1.1 (OID); RFC 6979 A.2.3 (vectors).
  ["p192", "P-192 (secp192r1)", ["P-192", "secp192r1", "prime192v1"], "1.2.840.10045.3.1.1", "SEC 2 v2 §2.2.2", 192, true,
    "fffffffffffffffffffffffffffffffeffffffffffffffff", "fffffffffffffffffffffffffffffffefffffffffffffffc",
    "64210519e59c80e70fa7e9ab72243049feb8deecc146b9b1", "ffffffffffffffffffffffff99def836146bc9b1b4d22831",
    "188da80eb03090f67cbf20eb43a18800f4ff0afd82ff1012", "07192b95ffc8da78631011ed6b24cdd573f977a11e794811"],
  // SEC 2 v2 §2.3.2; RFC 5480 §2.1.1.1 (OID); RFC 6979 A.2.4 (vectors).
  ["p224", "P-224 (secp224r1)", ["P-224", "secp224r1"], "1.3.132.0.33", "SEC 2 v2 §2.3.2", 224, true,
    "ffffffffffffffffffffffffffffffff000000000000000000000001", "fffffffffffffffffffffffffffffffefffffffffffffffffffffffe",
    "b4050a850c04b3abf54132565044b0b7d7bfd8ba270b39432355ffb4", "ffffffffffffffffffffffffffff16a2e0b8f03e13dd29455c5c2a3d",
    "b70e0cbd6bb4bf7f321390b94a03c1d356c21122343280d6115c1d21", "bd376388b5f723fb4c22dfe6cd4375a05a07476444d5819985007e34"],
  // RFC 5639 §§3.4, 4.1; RFC 7027 A.1 (vectors).
  ["brainpoolP256r1", "brainpoolP256r1", ["brainpoolP256r1"], "1.3.36.3.3.2.8.1.1.7", "RFC 5639 §3.4", 256, false,
    "a9fb57dba1eea9bc3e660a909d838d726e3bf623d52620282013481d1f6e5377", "7d5a0975fc2c3057eef67530417affe7fb8055c126dc5c6ce94a4b44f330b5d9",
    "26dc5c6ce94a4b44f330b5d9bbd77cbf958416295cf7e1ce6bccdc18ff8c07b6", "a9fb57dba1eea9bc3e660a909d838d718c397aa3b561a6f7901e0e82974856a7",
    "8bd2aeb9cb7e57cb2c4b482ffc81b7afb9de27e1e3bd23c23a4453bd9ace3262", "547ef835c3dac4fd97f8461a14611dc9c27745132ded8e545c1d54c72f046997"],
  // GB/T 32918.5-2017 §3; RFC 8998 §3.2.1 (parameters).
  ["sm2p256v1", "SM2 (sm2p256v1)", ["sm2p256v1", "curveSM2", "SM2"], "1.2.156.10197.1.301", "GB/T 32918.5-2017 §3 / RFC 8998 §3.2.1", 256, false,
    "fffffffeffffffffffffffffffffffffffffffff00000000ffffffffffffffff", "fffffffeffffffffffffffffffffffffffffffff00000000fffffffffffffffc",
    "28e9fa9e9d9f5e344d5a9e4bcf6509a7f39789f515ab8f92ddbcbd414d940e93", "fffffffeffffffffffffffffffffffff7203df6b21c6052b53bbf40939d54123",
    "32c4ae2c1f1981195f9904466a39c9948fe30bbff2660be1715a4589334c74c7", "bc3736a2f4f6779c59bdcee36b692153d0a9877cc62a474002df32e52139f0a0"],
];

const hex = (value) => BigInt(`0x${value}`);
export const POINT_CURVE_CATALOG = Object.freeze(CURVE_DATA.map(
  ([id, name, aliases, oid, std, bits, legacy, p, a, b, n, Gx, Gy]) => Object.freeze({
    id, name, aliases: Object.freeze(aliases), oid, std, bits, legacy, h: 1,
    p: hex(p), a: hex(a), b: hex(b), n: hex(n), Gx: hex(Gx), Gy: hex(Gy),
  }),
));
