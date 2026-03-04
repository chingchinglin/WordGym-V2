#!/usr/bin/env node
/**
 * 測試詞形變化解析和顯示功能
 * 驗證 CSV 轉 JSON 後的詞形變化資料格式
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const vocabularyPath = join(projectRoot, 'src/data/vocabulary.json');

console.log('📚 測試詞形變化功能\n');
console.log('=' .repeat(60));

try {
  const vocabularyData = JSON.parse(
    readFileSync(vocabularyPath, 'utf-8')
  );

  console.log(`✅ 成功載入詞彙資料: ${vocabularyData.length} 筆\n`);

  // 找出有詞形變化的詞彙
  const wordsWithForms = vocabularyData.filter((word) => {
    const forms = word.word_forms;
    if (!forms) return false;
    if (Array.isArray(forms) && forms.length > 0) return true;
    if (typeof forms === 'string' && forms.trim().length > 0) return true;
    return false;
  });

  console.log(`📊 統計資訊:`);
  console.log(`   - 總詞彙數: ${vocabularyData.length}`);
  console.log(`   - 有詞形變化的詞彙: ${wordsWithForms.length}`);
  console.log(`   - 比例: ${((wordsWithForms.length / vocabularyData.length) * 100).toFixed(2)}%\n`);

  if (wordsWithForms.length === 0) {
    console.log('⚠️  目前沒有詞彙包含詞形變化資料');
    console.log('   請確認 CSV 檔案中的「詞形變化」欄位是否有資料\n');
  } else {
    console.log('📝 詞形變化範例:\n');
    wordsWithForms.slice(0, 5).forEach((word, idx) => {
      console.log(`${idx + 1}. ${word.english_word} (ID: ${word.id})`);
      console.log(`   詞性: ${word.posOriginal || word.posTags?.join(', ') || 'N/A'}`);
      console.log(`   詞形變化格式: ${Array.isArray(word.word_forms) ? '陣列' : '字串'}`);
      
      if (Array.isArray(word.word_forms)) {
        word.word_forms.forEach((form, formIdx) => {
          if (typeof form === 'object' && form.pos) {
            console.log(`   - ${form.pos}:`);
            console.log(`     ${form.details.split('\n').join('\n     ')}`);
          } else {
            console.log(`   - ${form}`);
          }
        });
      } else {
        console.log(`   ${word.word_forms}`);
      }
      console.log('');
    });
  }

  // 驗證解析格式
  console.log('🔍 格式驗證:\n');
  const formatStats = {
    arrayOfObjects: 0,
    arrayOfStrings: 0,
    string: 0,
    empty: 0,
  };

  vocabularyData.forEach((word) => {
    const forms = word.word_forms;
    if (!forms) {
      formatStats.empty++;
      return;
    }
    if (Array.isArray(forms)) {
      if (forms.length > 0 && typeof forms[0] === 'object') {
        formatStats.arrayOfObjects++;
      } else {
        formatStats.arrayOfStrings++;
      }
    } else if (typeof forms === 'string') {
      formatStats.string++;
    } else {
      formatStats.empty++;
    }
  });

  console.log('   格式統計:');
  console.log(`   - 物件陣列格式 (推薦): ${formatStats.arrayOfObjects}`);
  console.log(`   - 字串陣列格式: ${formatStats.arrayOfStrings}`);
  console.log(`   - 字串格式: ${formatStats.string}`);
  console.log(`   - 空值: ${formatStats.empty}\n`);

  // 測試解析邏輯
  console.log('🧪 解析邏輯測試:\n');
  const testCases = [
    {
      name: '多詞性詞形變化',
      input: `名詞
可數；複數: criminals

形容詞
比較級: more criminal
最高級: most criminal`,
      expected: [
        { pos: '名詞', details: '可數；複數: criminals' },
        { pos: '形容詞', details: '比較級: more criminal\n最高級: most criminal' },
      ],
    },
    {
      name: '動詞變化',
      input: `動詞
過去式: went
過去分詞: gone
現在分詞: going`,
      expected: [
        { pos: '動詞', details: '過去式: went\n過去分詞: gone\n現在分詞: going' },
      ],
    },
  ];

  // 模擬 parse_word_forms 函數
  function parseWordForms(value) {
    if (!value || value.trim() === '') return [];

    const result = [];
    const lines = value.split('\n');
    let currentPos = null;
    let currentDetails = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentPos && currentDetails.length > 0) {
          result.push({
            pos: currentPos,
            details: currentDetails.join('\n'),
          });
          currentDetails = [];
        }
        continue;
      }

      const posHeaders = ['名詞', '動詞', '形容詞', '副詞', '介係詞', '連接詞', '代名詞', '感嘆詞'];
      if (posHeaders.includes(trimmed)) {
        if (currentPos && currentDetails.length > 0) {
          result.push({
            pos: currentPos,
            details: currentDetails.join('\n'),
          });
          currentDetails = [];
        }
        currentPos = trimmed;
      } else {
        if (currentPos) {
          currentDetails.push(trimmed);
        }
      }
    }

    if (currentPos && currentDetails.length > 0) {
      result.push({
        pos: currentPos,
        details: currentDetails.join('\n'),
      });
    }

    return result.length > 0 ? result : value;
  }

  testCases.forEach((testCase) => {
    const result = parseWordForms(testCase.input);
    const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
    console.log(`   ${passed ? '✅' : '❌'} ${testCase.name}`);
    if (!passed) {
      console.log(`      預期: ${JSON.stringify(testCase.expected, null, 2)}`);
      console.log(`      實際: ${JSON.stringify(result, null, 2)}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ 測試完成\n');

} catch (error) {
  console.error('❌ 錯誤:', error.message);
  console.error(error.stack);
  process.exit(1);
}
