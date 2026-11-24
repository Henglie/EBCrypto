import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { getOp } from '../src/core/registry.js';
import '../src/core/token.js';
import '../src/core/archiveUnified.js';
import '../src/core/mcNbt.js';
import '../src/core/stringsExtract.js';
import { mimeMultipartEncode, mimeMultipartOp } from '../src/core/mimeMultipart.js';
import { huffmanEncode, huffmanDecode } from '../src/core/huffman.js';
import { pcapRepairRun, makeStandardShb } from '../src/core/pcapRepair.js';
import { parseMqttStream } from '../src/core/trafficReadable.js';
import { OPS } from '../addons/dcode-extras-2026-10/ops/mathfun.js';

const tail = 'END_OF_FIELD';
const field = 'A'.repeat(510) + tail;
const field64 = Buffer.from(field).toString('base64url');
const line = (text, pattern) => text.split('\n').find(l => pattern.test(l));
const textOf = result => typeof result === 'string' ? result : result.text;

const mime = mimeMultipartOp(mimeMultipartEncode(field + ' | short'));
assert.equal(line(mime, /^A+/), field);
assert(mime.includes('\nshort'));
const jwe = getOp('jweIdentify').run(`e30..${'A'.repeat(16)}.${field64}.abc`);
assert.equal(line(jwe, /^密文\(/)?.split(': ')[1], field64);
const paseto = getOp('pasetoIdentify').run(`v4.public.${field64}.${field64}`);
assert.equal(line(paseto, /^Payload\(base64url/)?.split(': ')[1], field64);
assert.equal(line(paseto, /^Footer\(base64url/)?.split(': ')[1], field64);
assert.equal(line(paseto, /^Payload 解码/)?.split(': ')[1], field);
assert.equal(line(paseto, /^Footer 解码/)?.split(': ')[1], field);

const encode = huffmanEncode('AB'.repeat(8200) + 'A', { mode: 'table', table: 'A 0\nB 1' });
assert.equal(line(encode, /^hex: /), 'hex: ' + '55'.repeat(2050) + '00');
const decode = huffmanDecode('ff'.repeat(257), { mode: 'table', table: '0x00 1\n0x01 0' });
assert.equal(line(decode, /^hex: /), 'hex: ' + '00'.repeat(2056));

const pcap = Buffer.alloc(24 + 2 * (16 + 50100));
pcap.writeUInt32LE(0xa1b2c3d4);
pcap.writeUInt16LE(2, 4); pcap.writeUInt16LE(4, 6);
pcap.writeUInt32LE(65535, 16); pcap.writeUInt32LE(1, 20);
for (const [i, off] of [24, 24 + 16 + 50100].entries()) {
  pcap.writeUInt32LE(1700000000 + i, off);
  pcap.writeUInt32LE(50100, off + 8); pcap.writeUInt32LE(50100, off + 12);
}
pcap.set([0xde, 0xad, 0xbe, 0xef], pcap.length - 4);
assert.equal(line(pcapRepairRun('', { rawBytes: pcap }), /^[a-f\d]{200000,}$/), pcap.toString('hex'));

// Valid section followed by one custom block. Both boundaries and the tail are known independently.
const block = Buffer.alloc(100032);
block.writeUInt32LE(0x00000bad);
block.writeUInt32LE(block.length, 4);
block.writeUInt32LE(32473, 8);
block.set([0xab, 0xcd, 0xef, 0x12], block.length - 8);
block.writeUInt32LE(block.length, block.length - 4);
const pcapng = Buffer.concat([Buffer.from(makeStandardShb(true)), block]);
assert.equal(line(pcapRepairRun('', { rawBytes: pcapng }), /^[a-f\d]{200000,}$/), pcapng.toString('hex'));

// MQTT PUBLISH: two-byte topic length, topic 't', payload. Remaining Length uses two base-128 bytes.
const rl = Buffer.byteLength(field) + 3;
const mqtt = Buffer.concat([Buffer.from([0x30, (rl & 127) | 128, rl >> 7, 0, 1, 0x74]), Buffer.from(field)]);
const publish = parseMqttStream(mqtt).messages.find(packet => packet.type === 3);
assert.equal(publish?.payloadText, field);
assert.equal(publish?.payloadHex, Buffer.from(field).toString('hex'));

const seed = '123456789'.repeat(11);
const seq = OPS.find(op => op.id.endsWith('/math-lookandsay')).run(seed, { steps: 1 });
assert.equal(seq, `a(0) = ${seed}\na(1) = ${'111213141516171819'.repeat(11)}`);
const binary = Buffer.concat([Buffer.alloc(4500, 0xff), Buffer.from(tail)]);
const archive = await getOp('archiveUnified').run('', { rawBytes: Uint8Array.from(gzipSync(binary)) });
assert(textOf(archive).includes(binary.toString('hex')), 'Gzip analysis must preserve complete decompressed binary');
assert.deepEqual(Buffer.from(archive.files[0].bytes), binary);
const probe = await getOp('b64CompressedProbe').run(gzipSync(binary).toString('base64'), { minLen: 8 });
assert.equal(line(probe, /^  内容\(hex\): /), '  内容(hex): ' + binary.toString('hex'));
const samples = Array.from({ length: 5001 }, (_, i) => `sample-${i}`);
const strings = getOp('stringsExtract').run('', { rawBytes: Buffer.from(samples.join('\0')), encoding: 'ascii' });
assert.deepEqual(strings.split('\n').slice(3), samples);
const nbt = Buffer.alloc(3 + 1 + 2 + 1 + 4 + 70 + 1);
nbt.set([10, 0, 0, 7, 0, 1, 0x41], 0); // Compound with a named ByteArray.
nbt.writeInt32BE(70, 7);
nbt[80] = 123;
const nbtText = await getOp('mcNbtView').run('', { rawBytes: nbt, maxArray: 1 });
const nbtValues = line(nbtText, /'A': 70 项/).match(/\[([^\]]+)\]$/)[1].split(', ').map(Number);
assert.deepEqual(nbtValues, [...Array(69).fill(0), 123]);
console.log('PASS: complete MIME, JWE/PASETO, Huffman (encode/decode), pcap/pcapng, MQTT, look-and-say, gzip binary, strings, NBT');
