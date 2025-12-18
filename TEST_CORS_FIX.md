# Testing the CORS Fix

## Quick Test Guide

### Test 1: File Protocol (Double-click)
1. Navigate to `dist/index.html` in Finder
2. Double-click to open in browser
3. Open browser console (F12 or Cmd+Option+I)
4. Look for log messages:
   - ✅ "偵測到 file:// 協定，使用 JSONP 方式載入（透過 CORS 代理）"
   - ✅ "載入 Google Sheet (TSV): 國中單字彙整"
   - ✅ "解析後得到 XXX 筆資料"

**Expected behavior:**
- First load takes 2-3 seconds (CORS proxy)
- Data loads successfully
- No CORS errors in console
- Subsequent loads are instant (localStorage)

### Test 2: HTTP Server
```bash
cd dist
python -m http.server 8000
```

Then open: http://localhost:8000

**Expected console logs:**
- ❌ "偵測到 file:// 協定..." (should NOT appear)
- ✅ "載入 Google Sheet (TSV): 國中單字彙整"
- ✅ Direct fetch without proxy

**Expected behavior:**
- First load takes ~500ms (direct fetch)
- Data loads successfully
- No proxy involved

### Test 3: Verify CORS Error Fixed
**Before fix (would fail):**
```
Access to fetch at 'https://docs.google.com/spreadsheets/...'
from origin 'null' has been blocked by CORS policy
```

**After fix (should succeed):**
```
偵測到 file:// 協定，使用 JSONP 方式載入（透過 CORS 代理）
載入 Google Sheet (TSV): 國中單字彙整 https://docs.google.com/...
TSV 原始資料長度: XXXXX 字符
解析後得到 XXX 筆資料
```

## Console Commands for Testing

### Check Protocol
```javascript
console.log('Protocol:', window.location.protocol);
// file: = Double-clicked
// http: or https: = Server
```

### Check if data loaded
```javascript
console.log('Data loaded:', localStorage.getItem('mvp_vocab_dataset_v36') !== null);
```

### Force reload from Google Sheets
```javascript
localStorage.removeItem('mvp_vocab_preset_applied_v36');
localStorage.removeItem('mvp_vocab_dataset_v36');
location.reload();
```

## Expected Network Activity

### File Protocol
```
Request URL: https://api.allorigins.win/get?callback=gsheet_1234_abcd&url=https%3A%2F%2Fdocs.google.com%2F...
Request Method: GET
Type: script
```

### HTTP Protocol
```
Request URL: https://docs.google.com/spreadsheets/d/1RRR2HkwdwxabYVx5Y1Fuec1DKdi4xoSBLSaNVEAwUAQ/export?format=tsv&gid=0
Request Method: GET
Type: fetch
```

## Troubleshooting

### If data doesn't load from file://
1. Check console for errors
2. Verify internet connection (proxy needs network)
3. Check if allorigins.win is accessible:
   ```bash
   curl "https://api.allorigins.win/get?url=https://www.google.com"
   ```
4. Try clearing localStorage and reload

### If allorigins.win is down
Alternative proxies can be used by modifying `src/services/googleSheetLoader.ts`:
```typescript
const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
```

Then rebuild:
```bash
npm run build
```

## Success Criteria

✅ Opens successfully via double-click (file://)
✅ Loads Google Sheets data from file:// protocol
✅ No CORS errors in console
✅ Opens successfully via HTTP server
✅ Uses direct fetch when served via HTTP
✅ Data persists in localStorage
✅ Subsequent loads are instant
✅ Single HTML file (no external dependencies except initial data fetch)

## Performance Comparison

| Protocol | First Load | Cached Load | Method |
|----------|-----------|-------------|---------|
| file://  | 2-3s      | <100ms      | JSONP + Proxy |
| http://  | 500ms     | <100ms      | Direct Fetch |
| https:// | 500ms     | <100ms      | Direct Fetch |

---

**Note:** The CORS proxy is only used as a fallback for file:// protocol. For production deployment via web server, direct fetch is used (faster and no third-party dependency).
