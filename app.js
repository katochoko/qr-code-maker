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
  const font = `600 ${fontSize}px Arial, "Segoe UI", "Noto Sans JP", "Yu Gothic", sans-serif`;
  ctx.font = font;
  const title = titleInput.value.trim().normalize('NFC');
  const lines = [];
  let line = '';
  for (const char of Array.from(title)) {
    if (ctx.measureText(line + char).width > size - 8 * scale && line) { lines.push(line); line = char; }
    else line += char;
  }
  if (line) lines.push(line);
  // Use the same margin for the QR quiet zone, title gap and outside edges.
  const margin = 4 * scale;
  const metrics = lines.map(text => ctx.measureText(text));
  const ascent = lines.length ? Math.ceil(Math.max(...metrics.map(m => m.actualBoundingBoxAscent))) : 0;
  const descent = lines.length ? Math.ceil(Math.max(...metrics.map(m => m.actualBoundingBoxDescent))) : 0;
  const lineHeight = Math.max(Math.round(fontSize * 1.55), ascent + descent);
  const textHeight = lines.length ? ascent + descent + (lines.length - 1) * lineHeight : 0;
  const titleHeight = lines.length ? textHeight + margin : 0;
  const top = form.elements.position.value === 'top';
  canvas.width = size;
  canvas.height = size + titleHeight;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  const offsetY = top ? titleHeight : 0;
  for (let row = 0; row < count; row++) for (let col = 0; col < count; col++) {
    if (qr.isDark(row, col)) ctx.fillRect((col + 4) * scale, offsetY + (row + 4) * scale, scale, scale);
  }
  ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const textTop = top ? margin : size;
  lines.forEach((text, i) => ctx.fillText(text, size / 2, textTop + ascent + i * lineHeight));
  canvas.hidden = false; empty.hidden = true; download.disabled = false;
  status.textContent = `${canvas.width} × ${canvas.height} px`;
}
form.addEventListener('submit', (event) => {
  event.preventDefault(); setError(''); urlInput.removeAttribute('aria-invalid');
  const value = urlInput.value.trim();
  try {
    if (!value || /\s/.test(value)) throw new Error('URL');
    const parsed = new URL(value);
    if (!['https:', 'http:'].includes(parsed.protocol) || !parsed.hostname) throw new Error('URL');
  } catch {
    clearCode(); setError('invalid');
    urlInput.setAttribute('aria-invalid', 'true'); urlInput.focus(); return;
  }
  try {
    const code = qrcode(0, 'M');
    code.addData(value, 'Byte'); code.make();
    qr = code; generatedInput = value; draw();
    if (window.matchMedia('(max-width: 700px)').matches) {
      urlInput.blur();
      requestAnimationFrame(() => document.querySelector('.preview').scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start'
      }));
    }
  } catch {
    clearCode(); setError('tooLong');
  }
});
urlInput.addEventListener('input', () => {
  setError(''); urlInput.removeAttribute('aria-invalid');
  if (urlInput.value.trim() !== generatedInput) clearCode();
});
titleInput.addEventListener('input', draw);
form.querySelectorAll('[name=position]').forEach(input => input.addEventListener('change', draw));
form.addEventListener('reset', () => {
  clearCode(); setError(''); urlInput.removeAttribute('aria-invalid');
  setTimeout(() => urlInput.focus(), 0);
});
download.addEventListener('click', () => {
  if (!qr) return;
  const filename = (titleInput.value.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').slice(0, 80) || 'qr-code') + '.png';
  const anchor = document.createElement('a');
  anchor.download = filename; anchor.href = canvas.toDataURL('image/png');
  document.body.append(anchor); anchor.click(); anchor.remove();
});


const translations = {
 ja: {
 name:'QRコードメーカー', subtitle:'URLから、タイトル付きのQRコードを。',
 preview:'プレビュー', empty:'URLを入力して\nQRコードを生成してください',
 download:'PNGをダウンロード', settings:'QRコードの設定', clear:'すべてクリア',
 clearLabel:'URL・タイトル・QRコードをすべてクリア', generate:'QRコードを生成',
 title:'タイトル', optional:'任意', placeholder:'例：授業資料・アンケート',
 position:'タイトルの位置', top:'上', bottom:'下', hint:'タイトルもPNG画像に含まれます。',
 footer:'QRコードはブラウザー内で生成します。入力したURLは外部に送信しません。',
 canvas:'生成されたQRコード', language:'表示言語',
 invalid:'https:// または http:// で始まるURLを入力してください。',
 tooLong:'URLが長すぎるため生成できません。短いURLを使用してください。'
 },
 en: {
 name:'QR Code Maker', subtitle:'Turn a URL into a QR code with an optional title.',
 preview:'Preview', empty:'Enter a URL\nto generate a QR code.',
 download:'Download PNG', settings:'QR code settings', clear:'Clear all',
 clearLabel:'Clear the URL, title and QR code', generate:'Generate QR code',
 title:'Title', optional:'Optional', placeholder:'e.g. Course materials / Survey',
 position:'Title position', top:'Above', bottom:'Below', hint:'The title is included in the PNG image.',
 footer:'QR codes are generated in your browser. Your URL is not sent to an external server.',
 canvas:'Generated QR code', language:'Display language',
 invalid:'Enter a URL starting with https:// or http://.',
 tooLong:'This URL is too long to generate a QR code. Please use a shorter URL.'
 },
 vi: {
 name:'Trình tạo mã QR', subtitle:'Tạo mã QR từ URL, kèm tiêu đề tùy chọn.',
 preview:'Xem trước', empty:'Nhập URL\nđể tạo mã QR.',
 download:'Tải xuống PNG', settings:'Cài đặt mã QR', clear:'Xóa tất cả',
 clearLabel:'Xóa URL, tiêu đề và mã QR', generate:'Tạo mã QR',
 title:'Tiêu đề', optional:'Không bắt buộc', placeholder:'Ví dụ: Tài liệu học tập / Khảo sát',
 position:'Vị trí tiêu đề', top:'Phía trên', bottom:'Phía dưới', hint:'Tiêu đề cũng được đưa vào ảnh PNG.',
 footer:'Mã QR được tạo ngay trong trình duyệt. URL bạn nhập không được gửi đến máy chủ bên ngoài.',
 canvas:'Mã QR đã tạo', language:'Ngôn ngữ hiển thị',
 invalid:'Vui lòng nhập URL bắt đầu bằng https:// hoặc http://.',
 tooLong:'URL quá dài nên không thể tạo mã QR. Vui lòng dùng URL ngắn hơn.'
 }
};
let language = 'en';
let errorKey = '';
function setError(key) {
 errorKey = key;
 error.textContent = key ? translations[language][key] : '';
}
function applyLanguage(value, remember = false) {
 language = Object.hasOwn(translations, value) ? value : 'en';
 const t = translations[language];
 document.documentElement.lang = language;
 document.title = t.name;
 const texts = {
 'h1':'name', 'header > p':'subtitle', '.preview-label':'preview',
 '#empty p':'empty', '#download':'download', '.clear-all':'clear',
 '.primary':'generate', 'legend':'position', '.hint':'hint', 'footer':'footer'
 };
 for (const [selector, key] of Object.entries(texts)) document.querySelector(selector).textContent = t[key];
 const label = document.querySelector('label[for="title"]');
 label.firstChild.textContent = t.title + ' ';
 label.querySelector('span').textContent = t.optional;
 titleInput.placeholder = t.placeholder;
 for (const pos of ['top','bottom']) {
  const input = document.querySelector('[name="position"][value="' + pos + '"]');
  input.nextSibling.textContent = t[pos];
 }
 document.querySelector('.preview').setAttribute('aria-label', t.preview);
 document.querySelector('.controls').setAttribute('aria-label', t.settings);
 document.querySelector('.clear-all').setAttribute('aria-label', t.clearLabel);
 document.querySelector('#language-select').setAttribute('aria-label', t.language);
 canvas.setAttribute('aria-label', t.canvas);
 document.querySelector('#language-select').value = language;
 setError(errorKey);
 if (remember) { try { localStorage.setItem('qr-maker-language', language); } catch {} }
}
document.querySelector('#language-select').addEventListener('change', event => {
 applyLanguage(event.target.value, true);
});
let savedLanguage;
try { savedLanguage = localStorage.getItem('qr-maker-language'); } catch {}
const browserLanguage = (navigator.language || 'en').toLowerCase().split('-')[0];
applyLanguage(savedLanguage && Object.hasOwn(translations, savedLanguage) ? savedLanguage : browserLanguage);

