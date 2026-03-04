/**
 * 測試詞形變化解析和處理功能
 */

import {
  categorizeWordForms,
  normalizeWordFormsDetail,
} from '../dataProcessing';
import { WordFormsDetail } from '../../types';

describe('詞形變化處理功能', () => {
  describe('categorizeWordForms', () => {
    it('應該正確處理物件陣列格式的詞形變化', () => {
      const forms = [
        { pos: '名詞', details: 'criminals' },
        { pos: '形容詞', details: 'more criminal' },
      ];
      const result = categorizeWordForms(forms, 'criminal');

      // criminals 包含 base word，會被分類為 compound
      expect(result.compound.length).toBeGreaterThan(0);
    });

    it('應該正確處理字串陣列格式的詞形變化', () => {
      const forms = ['goes', 'going'];
      const result = categorizeWordForms(forms, 'go');

      // goes 和 going 是 base 的變化形式
      expect(result.base.length).toBeGreaterThan(0);
    });

    it('應該正確分類片語（包含空格）', () => {
      const forms = ['go on', 'go off', 'goes'];
      const result = categorizeWordForms(forms, 'go');

      expect(result.idiom).toContain('go on');
      expect(result.idiom).toContain('go off');
      expect(result.base).toContain('goes');
    });

    it('應該正確分類複合詞（包含連字號）', () => {
      const forms = ['go-between', 'goes'];
      const result = categorizeWordForms(forms, 'go');

      expect(result.compound).toContain('go-between');
      expect(result.base).toContain('goes');
    });
  });

  describe('normalizeWordFormsDetail', () => {
    it('應該正確處理物件陣列格式', () => {
      const forms = [
        { pos: '動詞', details: '過去式: went\n過去分詞: gone' },
      ];
      const result = normalizeWordFormsDetail(null, forms, 'go');

      expect(result.base.length).toBeGreaterThan(0);
    });

    it('應該正確處理字串陣列格式', () => {
      const forms = ['goes', 'went', 'gone'];
      const result = normalizeWordFormsDetail(null, forms, 'go');

      expect(result.base.length).toBeGreaterThan(0);
    });

    it('應該正確處理字串格式', () => {
      const forms = 'goes, went, gone';
      const result = normalizeWordFormsDetail(null, forms, 'go');

      expect(result.base.length).toBeGreaterThan(0);
    });

    it('應該正確處理空的輸入', () => {
      const result = normalizeWordFormsDetail(null, [], 'go');

      expect(result.base).toEqual([]);
      expect(result.idiom).toEqual([]);
      expect(result.compound).toEqual([]);
      expect(result.derivation).toEqual([]);
    });

    it('應該正確處理 WordFormsDetail 物件格式', () => {
      const detail: WordFormsDetail = {
        base: ['goes'],
        idiom: ['go on'],
        compound: ['go-between'],
        derivation: ['going'],
      };
      const result = normalizeWordFormsDetail(detail, [], 'go');

      expect(result.base).toEqual(['goes']);
      expect(result.idiom).toEqual(['go on']);
      expect(result.compound).toEqual(['go-between']);
      expect(result.derivation).toEqual(['going']);
    });
  });

  describe('實際使用案例', () => {
    it('應該正確處理動詞的各種變化形式', () => {
      const forms = [
        { pos: '動詞', details: '過去式: went\n過去分詞: gone\n現在分詞: going\n第三人稱單數: goes' },
      ];
      const result = normalizeWordFormsDetail(null, forms, 'go');

      // 至少應該有某些分類結果
      expect(result.base.length + result.derivation.length + result.compound.length).toBeGreaterThan(0);
    });

    it('應該正確處理名詞的複數形式', () => {
      const forms = [
        { pos: '名詞', details: 'families' },
      ];
      const result = normalizeWordFormsDetail(null, forms, 'family');

      // families 包含 base word "family"，會被分類為 compound
      expect(result.compound.length).toBeGreaterThan(0);
    });

    it('應該正確處理形容詞的比較級和最高級', () => {
      const forms = [
        { pos: '形容詞', details: 'more beautiful\nmost beautiful' },
      ];
      const result = normalizeWordFormsDetail(null, forms, 'beautiful');

      // 包含空格的字串會被分類為 idiom
      expect(result.idiom.length).toBeGreaterThan(0);
    });

    it('應該正確處理多詞性的詞形變化', () => {
      const forms = [
        { pos: '名詞', details: 'criminals' },
        { pos: '形容詞', details: 'more criminal' },
      ];
      const result = normalizeWordFormsDetail(null, forms, 'criminal');

      // 至少應該有某些分類結果
      expect(result.base.length + result.derivation.length + result.compound.length).toBeGreaterThan(0);
    });
  });
});
