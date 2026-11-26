// Curated classification, independent of operation direction and family grouping.
const groups = [
  [["math:lattice", "domain:post-quantum"], [
    "mlkemKeyGen", "mlkemEncaps", "mlkemDecaps", "mldsaKeyGen", "mldsaSign", "mldsaVerify",
    "falconKeyGen", "falconSign", "falconVerify", "falconPkParse", "ntruKeyGen", "ntru", "ntruCca2",
    "ntruPack", "ntruUnpack",
  ]],
  [["math:lattice", "scope:simulation"], ["lweToy", "ntruToy"]],
  [["math:lattice", "scope:simulation", "domain:homomorphic"], ["bfvToy"]],
  [["math:code-based", "domain:post-quantum"], ["hqcKeyGen", "hqc"]],
  [["domain:post-quantum", "scope:hybrid"], ["xwingKeyGen", "xwingEncaps", "xwingDecaps"]],
  [["domain:post-quantum", "scope:format"], ["pqcBlobParse"]],
  [["math:hash-based", "domain:post-quantum"], [
    "slhdsaKeyGen", "slhdsaSign", "slhdsaVerify", "xmssKeyGen", "xmssSign", "xmssVerify", "lmsSign", "lmsVerify",
  ]],
  [["domain:quantum", "scope:simulation"], ["bb84Qkd", "quantumToy"]],
];
const traitsById = new Map();
for (const [tags, ids] of groups) {
  const cryptoTags = Object.freeze(tags);
  for (const id of ids) {
    if (traitsById.has(id)) throw new Error(`Duplicate crypto traits: ${id}`);
    traitsById.set(id, cryptoTags);
  }
}

export function getCryptoTraits(id) {
  const cryptoTags = traitsById.get(id);
  if (!cryptoTags) return null;
  const cat = cryptoTags.includes("domain:quantum") ? "quantumSim"
    : cryptoTags.includes("scope:simulation") ? "teaching"
    : cryptoTags.includes("math:lattice") ? "lattice" : "postQuantum";
  return { cat, cryptoTags };
}
