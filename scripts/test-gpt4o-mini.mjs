// Test GPT-4o-mini for quiz option generation

const BACKEND_URL = 'https://speech-token-server-t26idchpnq-de.a.run.app';

const SYSTEM_PROMPT = `你是英文測驗出題專家。這是一個「詞彙測驗」，測試學生是否認識正確單字，以及對應的詞形變化、文法、搭配詞和片語。

【最重要規則 - 真實單字】
所有干擾選項必須是「真正存在的英文單字或片語」！
禁止使用不存在的字（如 childs, runned, goed, maked, weath）。

【干擾選項類型 - 從以下6種中選3種不同類型】
類型A - 詞形錯誤：錯誤的時態/單複數/比較級（但必須是真實存在的詞形）
類型B - 詞性錯誤：衍生詞但詞性錯誤
類型C - 語意相反：意思相反的字
類型D - 拼寫易混淆：長得像但意思不同
類型E - 發音相似：同音或近音異義字
類型F - 搭配錯誤：常見的錯誤搭配

【禁止】
1. 禁止使用不存在的英文單字！
2. 禁止使用「語意相近且填進去也通順」的同義詞！

回傳 JSON：
{"questionType": "單字題/搭配詞題/片語題", "correctAnswer": "正確答案", "distractors": [{"word": "字", "type": "類型", "reason": "為何錯誤"}], "grammarPoint": "考點"}`;

const testCases = [
  { sentence: "She _____ a difficult decision yesterday.", answer: "make" },
  { sentence: "The children _____ in the park when it started raining.", answer: "play" },
  { sentence: "He is much _____ than his brother.", answer: "tall" },
  { sentence: "I have _____ this book twice.", answer: "read" },
  { sentence: "She _____ her mother in personality.", answer: "take after" },
];

async function testQuestion(sentence, answer, model) {
  // GPT-5 系列參數不同
  const isGpt5 = model.startsWith('gpt-5');

  const body = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `例句：${sentence}\n正確答案：${answer}` }
    ],
  };

  if (isGpt5) {
    // GPT-5 用 reasoning tokens，需要更多空間
    body.max_completion_tokens = 2000;
    // GPT-5 不支援 temperature，使用預設值 1
  } else {
    body.max_tokens = 500;
    body.temperature = 0.3;
  }

  const response = await fetch(`${BACKEND_URL}/api/llm-openai-server/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (data.error) {
    return `API ERROR: ${JSON.stringify(data.error)}`;
  }
  // Debug: print full response structure for GPT-5
  if (!data.choices?.[0]?.message?.content) {
    console.log('DEBUG response:', JSON.stringify(data, null, 2).slice(0, 500));
  }
  return data.choices?.[0]?.message?.content || 'ERROR: No content';
}

async function main() {
  const model = process.argv[2] || 'gpt-4o-mini';
  console.log(`=== Testing ${model} ===\n`);

  for (let i = 0; i < testCases.length; i++) {
    const { sentence, answer } = testCases[i];
    console.log(`--- 題目 ${i + 1} ---`);
    console.log(`例句: ${sentence}`);
    console.log(`正確答案: ${answer}`);

    try {
      const result = await testQuestion(sentence, answer, model);
      console.log(`結果:\n${result}\n`);
    } catch (error) {
      console.log(`錯誤: ${error.message}\n${error.stack}\n`);
    }

    // Rate limit: wait 2 seconds between requests
    if (i < testCases.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

main();
