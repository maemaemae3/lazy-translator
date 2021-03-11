export default class WordRegister {
  constructor(updateProgress, chunkSize) {
    this.chunk = {}; // chunk to register to storage
    this.chunkSize = chunkSize || 1000;

    this.regData = {};
    this.updateProgress = updateProgress;
  }

  /**
   * parse string and register to chrome.storage
   *
   * @param {[String]} lines string data splitted by line break
   */
  async register(lines) {
    this.updateProgress('データを作成中...');
    this.makeRegData(lines);

    this.updateProgress('データを登録中...');
    let count = 0;
    for (const w of Object.keys(this.regData)) {
      this.chunk[w] = this.regData[w];
      count += 1;
      if (count % this.chunkSize === 0) {
        await new Promise((resolve) => chrome.storage.local.set(this.chunk, resolve));
        this.updateProgress('データを登録中... ', `${count}単語を登録しました`);
        this.chunk = {};
      }
    }
    // register left words
    await new Promise((resolve) => chrome.storage.local.set(this.chunk, resolve));
    this.updateProgress('登録完了！', `${count}単語を登録しました`);
  }

  /**
   * parse string and create object
   *
   * @param {[String]} lines string data splitted by line break
   */
  makeRegData(lines) {
    let count = 0;
    for (const line of lines) {
      const [word, info] = this.parse(line); // parse string to word and its meaning
      if (!word) { continue; } // if parse is failed, skip

      const regWord = word.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(this.regData, regWord)) {
        this.assignDictData(regWord, word, info);
      } else {
        this.regData[regWord] = { [word]: info };
      }

      count += 1;
      if (count % 100000 === 0) { this.updateProgress('データを作成中... ', `${count}行を処理しました`); }
    }
    // stringify (because when word is "constructor", it causes bug)
    for (const w of Object.keys(this.regData)) { this.regData[w] = JSON.stringify(this.regData[w]); }
  }

  /**
   * @param {String} regWord word id
   * @param {String} word     display word
   * @param {{variant: [{part: String, mean: String}]}} wordData
   */
  assignDictData(regWord, word, wordData) {
    if (Object.prototype.hasOwnProperty.call(this.regData[regWord], word)) {
      this.regData[regWord][word].push(...wordData);
    } else {
      Object.assign(this.regData[regWord], { [word]: wordData });
    }
  }

  /**
   * @param {String} str
   */
  parse(str) {
    // parse EIJIRO data
    const patternEijiro1 = str.match(/■(.*) {2}\{(.*)\} : (.*)/);
    if (patternEijiro1) {
      const word = patternEijiro1[1];
      const part = patternEijiro1[2];
      const meanStr = patternEijiro1[3];
      const mean = (/→/.test(meanStr)) ? WordRegister.setLinkEijiro(meanStr) : meanStr;
      return [word, [{ part, mean }]];
    }
    const patternEijiro2 = str.match(/■(.*) : (.*)/);
    if (patternEijiro2) {
      const word = patternEijiro2[1];
      const meanStr = patternEijiro2[2];
      const mean = (/→/.test(meanStr)) ? WordRegister.setLinkEijiro(meanStr) : meanStr;
      return [word, [{ mean }]];
    }
    const patternEjdic = str.match(/(.+)\t(.+)/);
    if (patternEjdic) {
      const word = patternEjdic[1];
      const means = patternEjdic[2].split(' / ').map(WordRegister.cleanseEjdic.bind(this)); // "A / =B / C" => [{mean: "A"}, {mean: "<→B>"}, {mean: "C"}]
      return [word, means];
    }
    return [null, null];
  }

  /**
   * convert "→str" to "<→str>"
   *
   * @param {*} str
   */
  static setLinkEijiro(str) {
    if (/<→.+>/.test(str)) { return str; }
    return str.replace(/→.+/, (s) => `<${s}>`);
  }

  /**
   * remove whitespace from both end
   * convert "=str" to "<→str>"
   * return {"mean": str}
   *
   * @param {*} str
   */
  static cleanseEjdic(str) {
    const trimmed = str.trim();
    if (!(/=.+/.test(trimmed))) { return { mean: str }; }
    return { mean: trimmed.replace(/=(.+)/, (_, part) => `<→${part}>`) };
  }
}
