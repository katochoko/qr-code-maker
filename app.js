'use strict';
const form = document.querySelector('#form');
const urlInput = document.querySelector('#url');
const titleInput = document.querySelector('#title');
const canvas = document.querySelector('#canvas');
const empty = document.querySelector('#empty');
const error = document.querySelector('#error');
const status = document.querySelector('#status');
const download = document.querySelector('#download');
let qr = null;
let generatedInput = '';
function clearCode() {
  qr = null;
  generatedInput = '';
  canvas.hidden = true;
  canvas.width = canvas.height = 1;
  empty.hidden = false;
  download.disabled = true;
  status.textContent = '';
}
function draw() {
  if (!qr) return;
  const count = qr.getModuleCount();
  const scale = Math.max(4, Math.floor(1000 / (count + 8)));
  const size = (count + 8) * scale;
  const ctx = canvas.getContext('2d');
  const fontSize = Math.round(size * .037);
  const font = `600 ${fontSize}px system-ui, "Noto Sans JP", "Yu Gothic", sans-serif`;
  ctx.font = font;
  const title = titleInput.value.trim();
  const lines = [];
  let line = '';
  for (const char of Array.from(title)) {
    if (ctx.measureText(line + char).width > size - 80 && line) { lines.push(line); line = char; }
    else line += char;
  }
  if (line) lines.push(line);
  const lineHeight = Math.round(fontSize * 1.55);
  const titleHeight = lines.length ? lines.length * lineHeight + 44 : 0;
  const top = form.elements.position.value === 'top';
  canvas.width = size;
  canvas.height = size + titleHeight;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  const offsetY = top ? titleHeight : 0;
  for (let row = 0; row < count; row++) for (let col = 0; col < count; col++) {
    if (qr.isDark(row, col)) ctx.fillRect((col + 4) * scale, offsetY + (row + 4) * scale, scale, scale);
  }
  ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((text, i) => ctx.fillText(text, size / 2, (top ? 0 : size) + 22 + lineHeight * (i + .5)));
  canvas.hidden = false; empty.hidden = true; download.disabled = false;
  status.textContent = `${canvas.width} × ${canvas.height} px`;
}
form.addEventListener('submit', (event) => {
  event.preventDefault(); error.textContent = ''; urlInput.removeAttribute('aria-invalid');
  const value = urlInput.value.trim();
  try {
    if (!value || /\s/.test(value)) throw new Error('URL');
    const parsed = new URL(value);
    if (!['https:', 'http:'].includes(parsed.protocol) || !parsed.hostname) throw new Error('URL');
  } catch {
    clearCode(); error.textContent = 'https:// または http:// で始まるURLを入力してください。';
    urlInput.setAttribute('aria-invalid', 'true'); urlInput.focus(); return;
  }
  try {
    const code = qrcode(0, 'M');
    code.addData(value, 'Byte'); code.make();
    qr = code; generatedInput = value; draw();
  } catch {
    clearCode(); error.textContent = 'URLが長すぎるため生成できません。短いURLを使用してください。';
  }
});
urlInput.addEventListener('input', () => {
  error.textContent = ''; urlInput.removeAttribute('aria-invalid');
  if (urlInput.value.trim() !== generatedInput) clearCode();
});
titleInput.addEventListener('input', draw);
form.querySelectorAll('[name=position]').forEach(input => input.addEventListener('change', draw));
form.addEventListener('reset', () => {
  clearCode(); error.textContent = ''; urlInput.removeAttribute('aria-invalid');
  setTimeout(() => urlInput.focus(), 0);
});
download.addEventListener('click', () => {
  if (!qr) return;
  const filename = (titleInput.value.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').slice(0, 80) || 'qr-code') + '.png';
  const anchor = document.createElement('a');
  anchor.download = filename; anchor.href = canvas.toDataURL('image/png');
  document.body.append(anchor); anchor.click(); anchor.remove();
});
