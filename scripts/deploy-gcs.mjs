#!/usr/bin/env node

/**
 * GCS 本地部署腳本
 * 
 * 純本地部署工具，不依賴 GitHub Actions
 * 
 * 使用方式:
 *   npm run deploy:gcs
 *   或
 *   node scripts/deploy-gcs.mjs
 * 
 * 配置方式（優先順序）:
 *   1. 環境變數（最簡單，使用現有 gcloud 認證）:
 *      GCS_BUCKET=your-bucket-name
 *      GCS_PATH=event/wordgym (可選)
 *      (腳本會自動使用 gcloud auth 的認證)
 * 
 *   2. 環境變數（使用 Service Account Key）:
 *      GCS_BUCKET=your-bucket-name
 *      GCS_PATH=event/wordgym (可選)
 *      GCS_SA_KEY=/path/to/service-account-key.json
 * 
 *   3. 配置檔案:
 *      複製 .gcs-deploy.config.json.example 為 .gcs-deploy.config.json
 *      並填入 bucket、path、credentials（可選）
 * 
 *   4. 環境變數 GCS_CREDENTIALS（完整 JSON 字串）
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'fs';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join, resolve, extname, relative } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  console.error(`${colors.red}❌ ${message}${colors.reset}`);
  process.exit(1);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 檢查必要工具
function checkRequirements() {
  try {
    execSync('gsutil --version', { stdio: 'ignore' });
    success('gsutil 已安裝');
  } catch (e) {
    error('gsutil 未安裝。請先安裝 Google Cloud SDK: https://cloud.google.com/sdk/docs/install');
  }

  try {
    execSync('gcloud --version', { stdio: 'ignore' });
    success('gcloud 已安裝');
  } catch (e) {
    error('gcloud 未安裝。請先安裝 Google Cloud SDK: https://cloud.google.com/sdk/docs/install');
  }
}

// 檢查是否有現有的 gcloud 認證
function hasGcloudAuth() {
  try {
    const result = execSync('gcloud auth list --filter=status:ACTIVE --format="value(account)"', {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    return result.trim().length > 0;
  } catch (e) {
    return false;
  }
}

// 載入配置
function loadConfig() {
  // 方式 1: 使用環境變數（最簡單的方式）
  if (process.env.GCS_BUCKET) {
    info('使用環境變數配置');
    
    // 如果提供了 GCS_SA_KEY，使用 Service Account
    if (process.env.GCS_SA_KEY) {
      const saKeyPath = resolve(process.cwd(), process.env.GCS_SA_KEY);
      
      if (!existsSync(saKeyPath)) {
        error(`Service Account Key 檔案不存在: ${saKeyPath}`);
      }
      
      let credentials;
      try {
        credentials = JSON.parse(readFileSync(saKeyPath, 'utf-8'));
      } catch (e) {
        error(`無法讀取 Service Account Key 檔案: ${e.message}`);
      }
      
      return {
        bucket: process.env.GCS_BUCKET,
        path: process.env.GCS_PATH || 'event/wordgym',
        credentials: credentials,
        useServiceAccount: true,
        cacheControl: {
          html: process.env.GCS_CACHE_HTML || 'no-cache, no-store, must-revalidate',
          assets: process.env.GCS_CACHE_ASSETS || 'public, max-age=86400'
        }
      };
    }
    
    // 如果沒有提供 GCS_SA_KEY，檢查是否有現有的 gcloud 認證
    if (hasGcloudAuth()) {
      info('檢測到現有的 gcloud 認證，將使用現有認證');
      return {
        bucket: process.env.GCS_BUCKET,
        path: process.env.GCS_PATH || 'event/wordgym',
        credentials: null,
        useServiceAccount: false,
        cacheControl: {
          html: process.env.GCS_CACHE_HTML || 'no-cache, no-store, must-revalidate',
          assets: process.env.GCS_CACHE_ASSETS || 'public, max-age=86400'
        }
      };
    }
    
    // 如果都沒有，提示錯誤
    error(
      '未提供認證方式！請選擇以下任一方式：\n' +
      '1. 設定 GCS_SA_KEY 環境變數指向 Service Account Key 檔案\n' +
      '2. 使用 gcloud auth login 進行認證\n' +
      '3. 使用 gcloud auth application-default login 進行認證'
    );
  }

  // 方式 2: 使用環境變數 GCS_CREDENTIALS（完整 JSON）
  if (process.env.GCS_CREDENTIALS) {
    info('使用環境變數 GCS_CREDENTIALS');
    try {
      const config = JSON.parse(process.env.GCS_CREDENTIALS);
      if (!config.bucket) {
        error('GCS_CREDENTIALS 必須包含 bucket 欄位');
      }
      
      // 如果有 credentials，使用 Service Account；否則使用現有認證
      const useServiceAccount = !!config.credentials;
      if (!useServiceAccount && !hasGcloudAuth()) {
        error('未提供 credentials 且未檢測到 gcloud 認證');
      }
      
      return {
        ...config,
        path: config.path || 'event/wordgym',
        useServiceAccount: useServiceAccount,
        cacheControl: config.cacheControl || {
          html: 'no-cache, no-store, must-revalidate',
          assets: 'public, max-age=86400'
        }
      };
    } catch (e) {
      error(`無法解析 GCS_CREDENTIALS: ${e.message}`);
    }
  }

  // 方式 3: 使用配置檔案
  const configPath = process.env.GCS_CONFIG_PATH || '.gcs-deploy.config.json';
  const absoluteConfigPath = resolve(process.cwd(), configPath);

  if (!existsSync(absoluteConfigPath)) {
    error(
      `配置不存在！請選擇以下任一方式：\n` +
      `\n` +
      `方式 1 - 環境變數（推薦，使用現有 gcloud 認證）:\n` +
      `  export GCS_BUCKET=your-bucket-name\n` +
      `  export GCS_PATH=event/wordgym\n` +
      `  npm run deploy:gcs\n` +
      `\n` +
      `方式 2 - 環境變數（使用 Service Account）:\n` +
      `  export GCS_BUCKET=your-bucket-name\n` +
      `  export GCS_PATH=event/wordgym\n` +
      `  export GCS_SA_KEY=/path/to/service-account-key.json\n` +
      `  npm run deploy:gcs\n` +
      `\n` +
      `方式 3 - 配置檔案:\n` +
      `  複製 .gcs-deploy.config.json.example 為 .gcs-deploy.config.json\n` +
      `  並填入 bucket、path、credentials（可選）\n`
    );
  }

  info(`載入配置檔案: ${absoluteConfigPath}`);
  try {
    const config = JSON.parse(readFileSync(absoluteConfigPath, 'utf-8'));
    
    // 判斷是否使用 Service Account
    const useServiceAccount = !!config.credentials;
    if (!useServiceAccount && !hasGcloudAuth()) {
      error('配置檔案中未提供 credentials 且未檢測到 gcloud 認證');
    }
    
    return {
      ...config,
      path: config.path || 'event/wordgym',
      useServiceAccount: useServiceAccount,
      cacheControl: config.cacheControl || {
        html: 'no-cache, no-store, must-revalidate',
        assets: 'public, max-age=86400'
      }
    };
  } catch (e) {
    error(`無法讀取配置檔案: ${e.message}`);
  }
}

// 驗證配置
function validateConfig(config) {
  if (!config.bucket) {
    error('配置缺少 bucket 欄位');
  }
  
  // 如果使用 Service Account，驗證 credentials
  if (config.useServiceAccount) {
    if (!config.credentials) {
      error('配置缺少 credentials 欄位');
    }
    if (!config.credentials.type || config.credentials.type !== 'service_account') {
      error('credentials 必須是 service_account 類型');
    }
    if (!config.credentials.private_key || !config.credentials.client_email) {
      error('credentials 缺少必要的欄位（private_key 或 client_email）');
    }
  } else {
    // 使用現有 gcloud 認證，不需要 credentials
    if (!hasGcloudAuth()) {
      error('未檢測到 gcloud 認證，請先執行 gcloud auth login 或設定 GCS_SA_KEY');
    }
  }
  
  success('配置驗證通過');
}

// 設定 Google Cloud 認證
function setupAuth(config) {
  // 如果使用現有 gcloud 認證，跳過認證步驟
  if (!config.useServiceAccount) {
    info('使用現有的 gcloud 認證');
    try {
      // 驗證認證是否有效
      execSync('gcloud auth list --filter=status:ACTIVE --format="value(account)"', {
        stdio: 'pipe'
      });
      const account = execSync('gcloud auth list --filter=status:ACTIVE --format="value(account)"', {
        encoding: 'utf-8',
        stdio: 'pipe'
      }).trim();
      success(`使用現有認證: ${account}`);
    } catch (e) {
      error('現有 gcloud 認證無效，請先執行 gcloud auth login');
    }
    return;
  }
  
  // 使用 Service Account 認證
  info('設定 Google Cloud 認證（使用 Service Account）...');
  
  if (!config.credentials) {
    error('未提供 Service Account credentials');
  }
  
  // 將 credentials 寫入臨時檔案
  const tempCredPath = join(__dirname, '.gcs-credentials-temp.json');
  try {
    require('fs').writeFileSync(tempCredPath, JSON.stringify(config.credentials, null, 2));
    
    // 使用臨時檔案進行認證
    execSync(`gcloud auth activate-service-account --key-file="${tempCredPath}"`, {
      stdio: 'inherit',
    });
    
    success('認證成功');
  } catch (e) {
    error(`認證失敗: ${e.message}`);
  } finally {
    // 清理臨時檔案
    if (existsSync(tempCredPath)) {
      require('fs').unlinkSync(tempCredPath);
    }
  }
}

// 建置專案
function build() {
  info('開始建置專案...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    success('建置完成');
  } catch (e) {
    error(`建置失敗: ${e.message}`);
  }
}

// 檢查 dist 目錄
function checkDist() {
  const distPath = resolve(process.cwd(), 'dist');
  if (!existsSync(distPath)) {
    error('dist 目錄不存在，請先執行 npm run build');
  }
  
  const indexPath = join(distPath, 'index.html');
  if (!existsSync(indexPath)) {
    error('dist/index.html 不存在');
  }
  
  success('dist 目錄檢查通過');
}

// 遞迴掃描目錄中的所有檔案
function scanFiles(dir, extensions, baseDir = dir) {
  const files = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...scanFiles(fullPath, extensions, baseDir));
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          const relativePath = relative(baseDir, fullPath).replace(/\\/g, '/');
          files.push({
            path: fullPath,
            relativePath: relativePath,
            ext: ext
          });
        }
      }
    }
  } catch (e) {
    // 忽略無法讀取的目錄
  }
  return files;
}

// 生成檔案版本號（使用檔案修改時間和內容 hash）
function generateFileVersion(filePath) {
  try {
    const stats = statSync(filePath);
    const content = readFileSync(filePath);
    const hash = createHash('md5').update(content).digest('hex').substring(0, 8);
    const timestamp = Math.floor(stats.mtimeMs / 1000);
    // 組合 timestamp 和 hash 前 8 位，確保唯一性
    return `${timestamp}-${hash}`;
  } catch (e) {
    // 如果無法讀取，使用當前時間戳
    return Date.now().toString();
  }
}

// 為 HTML 中的 CSS 和 JS 引用添加版本參數
function addVersionToAssets(distPath) {
  const indexPath = join(distPath, 'index.html');
  let htmlContent = readFileSync(indexPath, 'utf-8');
  let modified = false;
  
  // 掃描所有 CSS 和 JS 檔案
  const cssFiles = scanFiles(distPath, ['.css']);
  const jsFiles = scanFiles(distPath, ['.js', '.mjs']);
  const allAssets = [...cssFiles, ...jsFiles];
  
  if (allAssets.length === 0) {
    info('未找到外部 CSS/JS 檔案（可能已全部內嵌到 HTML）');
    return;
  }
  
  info(`找到 ${allAssets.length} 個外部資源檔案，開始添加版本參數...`);
  
  // 為每個檔案生成版本映射
  const versionMap = new Map();
  for (const asset of allAssets) {
    const version = generateFileVersion(asset.path);
    versionMap.set(asset.relativePath, version);
    info(`  ${asset.relativePath} -> v=${version}`);
  }
  
  // 輔助函數：查找檔案對應的版本
  function findVersion(href, versionMap) {
    // 移除可能已存在的版本參數和 hash
    const cleanHref = href.split('?')[0].split('#')[0];
    // 處理相對路徑和絕對路徑
    const relativePath = cleanHref.startsWith('/') ? cleanHref.substring(1) : cleanHref;
    
    // 精確匹配
    if (versionMap.has(relativePath)) {
      return versionMap.get(relativePath);
    }
    
    // 模糊匹配（檔案名匹配）
    const fileName = relativePath.split('/').pop();
    for (const [filePath, ver] of versionMap.entries()) {
      if (filePath.endsWith(fileName) || filePath === relativePath) {
        return ver;
      }
    }
    
    return null;
  }
  
  // 替換 CSS 引用（<link rel="stylesheet" href="...">）
  htmlContent = htmlContent.replace(
    /(<link[^>]*rel=["']stylesheet["'][^>]*href=["'])([^"']+\.css)(["'][^>]*>)/gi,
    (match, prefix, href, suffix) => {
      const version = findVersion(href, versionMap);
      if (version) {
        modified = true;
        // 移除可能已存在的版本參數
        const cleanHref = href.split('?')[0].split('#')[0];
        const hash = href.includes('#') ? href.substring(href.indexOf('#')) : '';
        const newHref = `${cleanHref}?v=${version}${hash}`;
        return `${prefix}${newHref}${suffix}`;
      }
      return match;
    }
  );
  
  // 替換 JS 引用（<script src="...">）
  htmlContent = htmlContent.replace(
    /(<script[^>]*src=["'])([^"']+\.(js|mjs))(["'][^>]*>)/gi,
    (match, prefix, src, ext, suffix) => {
      const version = findVersion(src, versionMap);
      if (version) {
        modified = true;
        // 移除可能已存在的版本參數
        const cleanSrc = src.split('?')[0].split('#')[0];
        const hash = src.includes('#') ? src.substring(src.indexOf('#')) : '';
        const newSrc = `${cleanSrc}?v=${version}${hash}`;
        return `${prefix}${newSrc}${suffix}`;
      }
      return match;
    }
  );
  
  // 寫回檔案
  if (modified) {
    writeFileSync(indexPath, htmlContent, 'utf-8');
    success('已為 HTML 中的 CSS/JS 引用添加版本參數');
  } else {
    warn('未找到需要添加版本的引用（可能已全部內嵌）');
  }
}

// 部署到 GCS
function deployToGCS(config) {
  const { bucket, path, cacheControl } = config;
  const gsPath = `gs://${bucket}/${path}`;
  const distPath = resolve(process.cwd(), 'dist');

  info(`準備部署到: ${gsPath}`);

  try {
    // 同步上傳檔案
    log('\n📤 上傳檔案到 GCS...', 'blue');
    execSync(`gsutil -m rsync -r -d "${distPath}" "${gsPath}"`, {
      stdio: 'inherit',
    });
    success('檔案上傳完成');

    // 設定 Cache-Control
    if (cacheControl) {
      log('\n⚙️  設定 Cache-Control...', 'blue');
      
      if (cacheControl.html) {
        execSync(
          `gsutil -m setmeta -h "Cache-Control:${cacheControl.html}" "${gsPath}/*.html"`,
          { stdio: 'inherit' }
        );
        info('HTML 檔案 Cache-Control 已設定');
      }

      if (cacheControl.assets) {
        try {
          // 檢查 assets 目錄是否存在
          execSync(
            `gsutil ls "${gsPath}/assets/*" > /dev/null 2>&1`,
            { stdio: 'ignore' }
          );
          // 如果存在，設定 Cache-Control
          execSync(
            `gsutil -m setmeta -h "Cache-Control:${cacheControl.assets}" "${gsPath}/assets/*"`,
            { stdio: 'inherit' }
          );
          info('Assets Cache-Control 已設定');
        } catch (e) {
          // assets 目錄不存在（可能已全部內嵌），跳過
          warn('未找到 assets 目錄（可能已全部內嵌到 HTML），跳過 Assets Cache-Control 設定');
        }
      }
    }

    // 設定公開讀取權限（如果需要）
    log('\n🔓 設定公開讀取權限...', 'blue');
    try {
      // 使用 -r 參數遞迴設定目錄下所有物件的權限
      execSync(`gsutil iam ch -r allUsers:objectViewer "${gsPath}"`, {
        stdio: 'inherit',
      });
      info('公開讀取權限已設定');
    } catch (e) {
      // 如果失敗，嘗試設定個別檔案
      try {
        execSync(`gsutil iam ch allUsers:objectViewer "${gsPath}/*"`, {
          stdio: 'inherit',
        });
        info('公開讀取權限已設定（個別檔案）');
      } catch (e2) {
        warn('無法設定公開讀取權限（可能已經設定或權限不足）');
      }
    }

    success('部署完成！');
    
    // 顯示部署資訊
    log('\n📋 部署資訊:', 'bright');
    log(`   Bucket: ${bucket}`, 'cyan');
    log(`   路徑: ${path}`, 'cyan');
    log(`   URL: https://storage.googleapis.com/${bucket}/${path}/index.html`, 'cyan');
    
  } catch (e) {
    error(`部署失敗: ${e.message}`);
  }
}

// 主函數
async function main() {
  log('\n🚀 開始 GCS 部署流程\n', 'bright');

  // 檢查必要工具
  checkRequirements();
  log('');

  // 載入配置
  const config = loadConfig();
  log('');

  // 驗證配置
  validateConfig(config);
  log('');

  // 設定認證
  setupAuth(config);
  log('');

  // 建置專案
  build();
  log('');

  // 檢查 dist
  checkDist();
  log('');

  // 為 CSS/JS 添加版本參數
  const distPath = resolve(process.cwd(), 'dist');
  log('\n🔖 處理資源檔案版本控制...', 'blue');
  addVersionToAssets(distPath);
  log('');

  // 部署
  deployToGCS(config);
  log('');

  success('🎉 所有步驟完成！');
}

// 執行
main().catch((error) => {
  error(`執行錯誤: ${error.message}`);
  process.exit(1);
});
