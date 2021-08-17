import WordRegister from '../src/options/WordRegister';

test('parse eijiro(word and meaning)', () => {
  const reg = new WordRegister();
  const str = '■AABBCC : meeeeaning of this word';
  const expected = ['AABBCC', [{ mean: 'meeeeaning of this word' }]];

  expect(reg.parse(str)).toEqual(expected);
});

test('parse eijiro(word, part and meaning)', () => {
  const reg = new WordRegister();
  const str = '■AABBCC  {papapart} : meeeeaning of this word';
  const expected = ['AABBCC', [{ part: 'papapart', mean: 'meeeeaning of this word' }]];

  expect(reg.parse(str)).toEqual(expected);
});

test('parse eijiro(word and link)', () => {
  const reg = new WordRegister();
  const str = '■AABBCC : ＝<→link of this word>';
  const expected = ['AABBCC', [{ mean: '＝<→link of this word>' }]];

  expect(reg.parse(str)).toEqual(expected);
});

test('parse eijiro(word and link without bracket)', () => {
  const reg = new WordRegister();
  const str = '■AA BB CC : →link of this word';
  const expected = ['AA BB CC', [{ mean: '<→link of this word>' }]];

  expect(reg.parse(str)).toEqual(expected);
});

test('parse eijiro(word, part and link without bracket)', () => {
  const reg = new WordRegister();
  const str = '■AA BB CC  {papa part} : →link of this word';
  const expected = ['AA BB CC', [{ part: 'papa part', mean: '<→link of this word>' }]];

  expect(reg.parse(str)).toEqual(expected);
});

test('parse ejdic(word and mean)', () => {
  const reg = new WordRegister();
  const str = 'AA BB CC	 meaning of AABBCC!';
  const expected = ['AA BB CC', [{ mean: ' meaning of AABBCC!' }]];

  expect(reg.parse(str)).toEqual(expected);
});

test('parse ejdic(word and link)', () => {
  const reg = new WordRegister();
  const str = 'A-bomb	 =atomic bomb ';
  const expected = ['A-bomb', [{ mean: '<→atomic bomb>' }]];

  expect(reg.parse(str)).toEqual(expected);
});
