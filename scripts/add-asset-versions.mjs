#!/usr/bin/env node

/**
 * 為 HTML 中的 CSS/JS 引用添加版本參數
 * 這個腳本可以被其他腳本調用
 */

import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'fs';
import { createHash } from 'crypto';
import { join, resolve, extname, relative } from 'path';

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

// 生成檔案版本號
function generateFileVersion(filePath) {
  try {
    const stats = statSync(filePath);
    const content = readFileSync(filePath);
    const hash = createHash('md5').update(content).digest('hex').substring(0, 8);
    const timestamp = Math.floor(stats.mtimeMs / 1000);
    return `${timestamp}-${hash}`;
  } catch (e) {
    return Date.now().toString();
  }
}

// 主函數
function main() {
  const distPath = process.argv[2] || resolve(process.cwd(), 'dist');
  const indexPath = join(distPath, 'index.html');
  
  if (!existsSync(indexPath)) {
    console.error('錯誤: index.html 不存在');
    process.exit(1);
  }
  
  let htmlContent = readFileSync(indexPath, 'utf-8');
  let modified = false;
  
  // 掃描所有 CSS 和 JS 檔案
  const cssFiles = scanFiles(distPath, ['.css']);
  const jsFiles = scanFiles(distPath, ['.js', '.mjs']);
  const allAssets = [...cssFiles, ...jsFiles];
  
  if (allAssets.length === 0) {
    console.log('未找到外部 CSS/JS 檔案（可能已全部內嵌到 HTML）');
    return;
  }
  
  console.log(`找到 ${allAssets.length} 個外部資源檔案，開始添加版本參數...`);
  
  // 為每個檔案生成版本映射
  const versionMap = new Map();
  for (const asset of allAssets) {
    const version = generateFileVersion(asset.path);
    versionMap.set(asset.relativePath, version);
    console.log(`  ${asset.relativePath} -> v=${version}`);
  }
  
  // 輔助函數：查找檔案對應的版本
  function findVersion(href, versionMap) {
    const cleanHref = href.split('?')[0].split('#')[0];
    const relativePath = cleanHref.startsWith('/') ? cleanHref.substring(1) : cleanHref;
    
    if (versionMap.has(relativePath)) {
      return versionMap.get(relativePath);
    }
    
    const fileName = relativePath.split('/').pop();
    for (const [filePath, ver] of versionMap.entries()) {
      if (filePath.endsWith(fileName) || filePath === relativePath) {
        return ver;
      }
    }
    
    return null;
  }
  
  // 替換 CSS 引用
  htmlContent = htmlContent.replace(
    /(<link[^>]*rel=["']stylesheet["'][^>]*href=["'])([^"']+\.css)(["'][^>]*>)/gi,
    (match, prefix, href, suffix) => {
      const version = findVersion(href, versionMap);
      if (version) {
        modified = true;
        const cleanHref = href.split('?')[0].split('#')[0];
        const hash = href.includes('#') ? href.substring(href.indexOf('#')) : '';
        const newHref = `${cleanHref}?v=${version}${hash}`;
        return `${prefix}${newHref}${suffix}`;
      }
      return match;
    }
  );
  
  // 替換 JS 引用
  htmlContent = htmlContent.replace(
    /(<script[^>]*src=["'])([^"']+\.(js|mjs))(["'][^>]*>)/gi,
    (match, prefix, src, ext, suffix) => {
      const version = findVersion(src, versionMap);
      if (version) {
        modified = true;
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
    console.log('✅ 已為 HTML 中的 CSS/JS 引用添加版本參數');
  } else {
    console.log('⚠️  未找到需要添加版本的引用（可能已全部內嵌）');
  }
}

main();
