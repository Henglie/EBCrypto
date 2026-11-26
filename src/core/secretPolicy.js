/*
 * secretPolicy.js — 敏感数据自动持久化防护统一过滤层。
 *
 * 纯函数、零 UI/DOM 依赖，可 Node 直测、可 Worker 调用、可被任意写入口复用。
 * 本模块只产出「可持久化副本」，绝不改写运行态对象；显式下载 / 复制使用未过滤的运行态数据。
 *
 * 判定依据（策略冻结文档与后续裁定，独立于 UI 遮蔽正则）：
 *   1. 参数声明 sensitive:true —— 由调用方把声明键名放进 sensitiveKeys 传入，命中即敏感。
 *   2. 结果语义 —— 密钥生成类 op 的输出文本与附件本身就是私钥/密钥对，自动持久化一律排除。
 *      清单来自注册表 familyLabel==='keygen' 的 21 个 op；dsaParamGen 虽名为「参数组」，
 *      其输出仍含私钥 x（源码 output 文本与 dsa_priv 附件），故一并列入，不凭名字排除。
 *   3. 最小显式清单 —— 未声明敏感却承载凭据/密钥的字段，按 opId + 字段名逐项列明，附依据。
 *      endpoint 经裁定为普通服务器地址，不算秘密，已从清单移除；auth/seed 保留。
 * 不采用 UI 遮蔽用的宽正则：该正则把 alphabet/dict/nonce/iv/salt/keyword 也算进去，
 * 古典密码的字母表与字典、nonce/IV 等并非秘密凭据，一刀切会误伤正常草稿。
 * 判定不了的一律不静默放过：登记 UNVERIFIED 边界点交策略负责人确认后再扩表。
 */

/** 最小显式清单：未声明 sensitive 但承载秘密的参数（按 opId + key 精确匹配）。 */
export const SENSITIVE_PARAM_LIST = Object.freeze({
  // 对称分组密码的密钥与初始向量，派生/加解密的保密材料；不填即为运行态内存持有。
  sm4: Object.freeze(['key', 'iv']),
  // auth 是 Bearer 凭据；seed 决定随机序列。endpoint 经裁定为普通地址，不属秘密。
  randomSecure: Object.freeze(['auth', 'seed']),
});

/**
 * 结果即秘密：注册表 familyLabel==='keygen' 的全部 21 个 op，输出文本与文件附件是密钥/密钥对，
 * 自动缓存必须排除。清单按 id 字母序，与运行时 OPS 枚举交叉可复核；
 * isResultSecretOp 另支持传入 op 描述符，按 familyLabel 兜底，避免未来新增 keygen op 漏网。
 */
export const RESULT_SECRET_OPS = Object.freeze([
  'blsKeyGen', 'dsaParamGen', 'ecdsaKeyGen', 'ed25519KeyGen', 'elgamalKeyGen',
  'falconKeyGen', 'hqcKeyGen', 'mldsaKeyGen', 'mlkemKeyGen', 'ntruKeyGen',
  'paillierKeyGen', 'pgpGenKeyPair', 'rsaGenKeyPair', 'schnorrKeyGen',
  'slhdsaKeyGen', 'sm2KeyGen', 'sm9KeyGen', 'x25519KeyGen', 'x448KeyGen',
  'xmssKeyGen', 'xwingKeyGen',
]);

/** 已按裁定收口；剩余未证项按红线保留，不静默放过也不静默删除。 */
export const UNVERIFIED = Object.freeze([
  '真实旧稿的格式版本分布：按红线不读取真实 profile，无法盘点；迁移逻辑用合成夹具验证',
  '已分享出去的旧链接中的明文密钥无法回收，是否需 UI 明示待裁决',
]);

const POLICY_VERSION = 'secret-policy-v2';
export const policyVersion = () => POLICY_VERSION;

function cloneValue(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return value;
  if (value instanceof ArrayBuffer) return value.slice(0);
  if (ArrayBuffer.isView(value)) return new value.constructor(value);
  if (typeof Blob !== 'undefined' && value instanceof Blob) return value;
  if (Array.isArray(value)) {
    const out = [];
    seen.set(value, out);
    for (const item of value) out.push(cloneValue(item, seen));
    return out;
  }
  const out = {};
  seen.set(value, out);
  for (const key of Object.keys(value)) out[key] = cloneValue(value[key], seen);
  return out;
}

/** 单个参数名是否敏感：显式声明键名 + 最小显式清单，两者都不靠字段名正则。 */
export function isSensitiveParamKey(opId, key, sensitiveKeys = []) {
  const declared = Array.isArray(sensitiveKeys) ? sensitiveKeys : [];
  if (declared.includes(key)) return true;
  const list = SENSITIVE_PARAM_LIST[String(opId || '')];
  return !!(list && list.includes(key));
}

/**
 * 该 op 的运行结果是否本身就是秘密。
 * @param {string} opId
 * @param {object} [op] 可选 op 描述符；带 familyLabel==='keygen' 时按语义兜底命中。
 */
export function isResultSecretOp(opId, op) {
  const id = String(opId || '');
  if (RESULT_SECRET_OPS.includes(id)) return true;
  return !!(op && op.familyLabel === 'keygen');
}

/**
 * 过滤参数对象：敏感值置空串（保留键名，避免破坏消费者结构），返回可持久化副本与剔除记录。
 * @returns {{value:object, stripped:Array}}
 */
export function filterParams(opId, params, sensitiveKeys = []) {
  const stripped = [];
  const value = {};
  const source = params && typeof params === 'object' ? params : {};
  for (const key of Object.keys(source)) {
    if (isSensitiveParamKey(opId, key, sensitiveKeys)) {
      if (source[key] !== '' && source[key] != null) stripped.push({ path: `params.${key}`, action: 'blanked' });
      value[key] = '';
    } else {
      value[key] = cloneValue(source[key]);
    }
  }
  return { value, stripped };
}

/**
 * 过滤自动缓存的 lastMemo：结果即秘密的 op 不落盘任何结果载体。
 * _lastOpOutput 的真实结构是 { opId, value, outText, outFiles, params, runId }：
 *   - value    完整结果对象（sm2KeyGen 的 value.text 含私钥 hex、value.files 含私钥附件字节）
 *   - outText  展示文本
 *   - outFiles 附件条目
 * 三者都必须清空；只清 outText/outFiles 会把私钥留在 value 里（T1560 独立验收实锤）。
 * 附件属交付物，显式下载/复制走未过滤运行态数据，不受本过滤影响。
 */
export function filterLastMemo(opId, lastMemo, sensitiveKeys = []) {
  const stripped = [];
  if (!lastMemo || typeof lastMemo !== 'object') return { value: lastMemo, stripped };
  const value = cloneValue(lastMemo);
  if (isResultSecretOp(opId)) {
    if (value.outText !== undefined && value.outText !== '') stripped.push({ path: 'lastMemo.outText', action: 'blanked' });
    if (Array.isArray(value.outFiles) && value.outFiles.length) stripped.push({ path: 'lastMemo.outFiles', action: 'removed' });
    // value 是完整结果对象，必须整体置空而非只清展示字段
    if (value.value !== undefined && value.value !== null) {
      stripped.push({ path: 'lastMemo.value', action: 'blanked' });
      value.value = null;
    }
    value.outText = '';
    value.outFiles = [];
  }
  // lastMemo.params 会随草稿落盘：声明敏感的参数同样不能留在结果备忘里
  if (value.params && typeof value.params === 'object') {
    const pf = filterParams(opId, value.params, sensitiveKeys);
    if (pf.stripped.length) stripped.push(...pf.stripped.map(s => ({ ...s, path: 'lastMemo.' + s.path })));
    value.params = pf.value;
  }
  return { value, stripped };
}

/**
 * 过滤文本中的敏感值片段（报告 output / CSV 结果行）：把已知秘密值替换为省略标记。
 */
export function redactSecrets(text, secretValues = []) {
  let out = String(text ?? '');
  const marker = '[已省略：敏感材料仅保留在本次进程内存]';
  const vals = (Array.isArray(secretValues) ? secretValues : [])
    .map(v => (v == null ? '' : String(v)))
    .filter(v => v.length >= 4);
  for (const v of vals) out = out.split(v).join(marker);
  return out;
}

/** 从 op:xxx 形式的草稿 id 取 canonical opId；非 op 草稿返回空串。 */
export function opIdFromDraftId(id) {
  const s = String(id || '');
  return s.startsWith('op:') ? s.slice(3) : '';
}

/**
 * 草稿整条记录的可持久化副本：meta.params / meta.lastMemo / 结果输出区一并处理。
 * meta.sensitiveKeys 与 meta.resultSecret 是由调用方写入的无值元数据（仅键名/布尔），本身不含秘密。
 */
export function sanitizeDraftRecord(record) {
  const stripped = [];
  const clone = cloneValue(record);
  if (!clone || typeof clone !== 'object' || !clone.meta) return { value: clone, stripped };
  const opId = opIdFromDraftId(clone.id);
  const sensitiveKeys = clone.meta.sensitiveKeys || [];
  const resultSecret = clone.meta.resultSecret === true || isResultSecretOp(opId);

  if (clone.meta.params && typeof clone.meta.params === 'object') {
    const r = filterParams(opId, clone.meta.params, sensitiveKeys);
    clone.meta.params = r.value;
    stripped.push(...r.stripped.map(s => ({ ...s, path: 'meta.' + s.path })));
  }
  const lm = filterLastMemo(opId, clone.meta.lastMemo, sensitiveKeys);
  clone.meta.lastMemo = lm.value;
  stripped.push(...lm.stripped.map(s => ({ ...s, path: 'meta.' + s.path })));

  // 输出区文本：结果即秘密的 op 不自动落盘（显式下载/复制不受影响）。
  if (resultSecret && Array.isArray(clone.areas)) {
    for (const area of clone.areas) {
      if (area && typeof area.key === 'string' && /^ioOut/.test(area.key) && area.text) {
        stripped.push({ path: `areas[${clone.areas.indexOf(area)}].text`, action: 'blanked' });
        area.text = '';
      }
    }
  }
  // 无值元数据不需要写进持久化副本。
  delete clone.meta.sensitiveKeys;
  delete clone.meta.resultSecret;
  return { value: clone, stripped };
}

/**
 * 旧稿迁移的纯函数核：过滤旧记录并打迁移标记（meta.migrated=1）。
 *
 * 幂等：重复调用产出相同副本（敏感值已空、标记已存在），不因二次执行改变结果。
 * 不改写运行态对象、不写任何存储、不产生日志；旧明文只在入参里短暂存在。
 * 写入侧负责把返回副本在同一事务里原子写回；失败时不提交，下次加载重试，
 * 且禁止把旧明文写进日志/临时文件/分享链接，避免「回退」变成重新落盘。
 * 真实旧稿不含 sensitiveKeys 元数据，故可由 opts 注入注册表声明键名与结果秘密标记；
 * 注入值同样只含键名/布尔，不含任何秘密值。
 * @returns {{value:object, stripped:Array}}
 */
export function migrateDraftRecord(record, opts = {}) {
  let source = record;
  if (record && typeof record === 'object' && record.meta && typeof record.meta === 'object') {
    source = {
      ...record,
      meta: {
        ...record.meta,
        sensitiveKeys: record.meta.sensitiveKeys || opts.sensitiveKeys || [],
        resultSecret: record.meta.resultSecret === true || opts.resultSecret === true || false,
      },
    };
  }
  const { value, stripped } = sanitizeDraftRecord(source);
  if (!value || typeof value !== 'object') return { value, stripped };
  if (!value.meta || typeof value.meta !== 'object') value.meta = {};
  value.meta.migrated = 1;
  return { value, stripped };
}

/** 配方 / 分享数据的可持久化副本：逐节点过滤 params（含控制节点）。 */
export function sanitizeRecipeData(data, opts = {}) {
  const keyOf = typeof opts === 'function' ? opts : (opts.keyOf || (n => n && n.opId));
  const byOp = (opts && opts.sensitiveKeysByOp) || {};
  const stripped = [];
  if (!data || typeof data !== 'object') return { value: data, stripped };
  const clone = cloneValue(data);
  if (Array.isArray(clone.nodes)) {
    clone.nodes.forEach((node, i) => {
      if (!node || !node.params || typeof node.params !== 'object') return;
      const opId = String(keyOf(node) || '');
      const declared = Array.isArray(node.sensitiveKeys) ? node.sensitiveKeys : (byOp[opId] || []);
      const r = filterParams(opId, node.params, declared);
      node.params = r.value;
      delete node.sensitiveKeys;
      stripped.push(...r.stripped.map(s => ({ ...s, path: `nodes[${i}].${s.path}` })));
    });
  }
  return { value: clone, stripped };
}

/**
 * 报告的可持久化副本：params 剔除敏感键，input/output 剔除已知秘密值片段。
 */
export function sanitizeReport(report, { opId = '', sensitiveKeys = [], secretValues = [] } = {}) {
  const stripped = [];
  if (!report || typeof report !== 'object') return { value: report, stripped };
  const clone = cloneValue(report);
  if (clone.params && typeof clone.params === 'object') {
    for (const key of Object.keys(clone.params)) {
      if (isSensitiveParamKey(opId, key, sensitiveKeys)) {
        delete clone.params[key];
        stripped.push({ path: `params.${key}`, action: 'removed' });
      }
    }
  }
  if (clone.input && typeof clone.input.text === 'string') {
    const red = redactSecrets(clone.input.text, secretValues);
    if (red !== clone.input.text) { clone.input.text = red; stripped.push({ path: 'input.text', action: 'redacted' }); }
  }
  if (clone.output && typeof clone.output.text === 'string') {
    const red = isResultSecretOp(opId)
      ? '[已省略：密钥生成结果属于敏感材料，仅保留在本次进程内存]'
      : redactSecrets(clone.output.text, secretValues);
    if (red !== clone.output.text) { clone.output.text = red; stripped.push({ path: 'output.text', action: 'redacted' }); }
  }
  return { value: clone, stripped };
}

/** CSV 模板列：剔除敏感参数列，不改动其他列顺序。 */
export function sanitizeCsvColumns(opId, columns, sensitiveKeys = []) {
  const stripped = [];
  const out = (Array.isArray(columns) ? columns : []).filter(col => {
    if (!col || typeof col.key !== 'string') return true;
    if (!col.key.startsWith('param.')) return true;
    const key = col.key.slice(6);
    if (isSensitiveParamKey(opId, key, sensitiveKeys)) {
      stripped.push({ path: col.key, action: 'column-removed' });
      return false;
    }
    return true;
  });
  return { value: out, stripped };
}

/** CSV 结果行：敏感参数列清空，结果即秘密的 op 的 output 文本省略。 */
export function sanitizeCsvRow(opId, row, columns = [], secretValues = []) {
  const value = cloneValue(row) || {};
  const stripped = [];
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('param.') && isSensitiveParamKey(opId, key.slice(6), [])) {
        value[key] = '';
        stripped.push({ path: key, action: 'blanked' });
      }
    }
    if ('text' in value) {
      const red = isResultSecretOp(opId)
        ? '[已省略：密钥生成结果属于敏感材料]'
        : redactSecrets(value.text, secretValues);
      if (red !== value.text) { value.text = red; stripped.push({ path: 'text', action: 'redacted' }); }
    }
  }
  return { value, stripped };
}

/**
 * 节点导出：敏感参数识别（声明 + 最小清单），供 exportGraphJSON 复用。
 * @returns {Array<{nodeId,opId,paramKey,path,promoted,hasValue}>}
 */
export function findSensitiveValues(graph, opts = {}) {
  const hits = [];
  const nodes = Array.isArray(graph && graph.nodes) ? graph.nodes : [];
  const promoted = new Set();
  for (const e of (graph && graph.edges) || []) {
    if (e && e.to && typeof e.to.port === 'string' && e.to.port.startsWith('param:')) {
      promoted.add(`${e.to.node}\u0000${e.to.port.slice(6)}`);
    }
  }
  nodes.forEach((n, i) => {
    if (!n) return;
    const opId = String(n.opId || '');
    const declared = Array.isArray(opts.sensitiveKeysByOp?.[opId]) ? opts.sensitiveKeysByOp[opId] : [];
    const params = n.params && typeof n.params === 'object' ? n.params : {};
    for (const key of Object.keys(params)) {
      if (!isSensitiveParamKey(opId, key, declared) && !promoted.has(`${n.id}\u0000${key}`)) continue;
      const val = params[key];
      hits.push({
        nodeId: n.id, opId, paramKey: key,
        path: `nodes[${i}].params.${key}`,
        promoted: promoted.has(`${n.id}\u0000${key}`),
        hasValue: val !== '' && val != null,
      });
    }
  });
  return hits;
}
