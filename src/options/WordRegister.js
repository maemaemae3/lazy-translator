export default class WordRegister {
  constructor(updateProgress, chunk_size) {
    this.chunk = {}; // chunk to register to storage
    this.chunk_size = chunk_size ? chunk_size : 1000;

    this.reg_data = {};
    this.updateProgress = updateProgress;
  }

  /**
   * parse string and register to chrome.storage
   *
   * @param {[String]} lines string data splitted by line break
   */
  async register(lines) {
    this.updateProgress("データを作成中...");
    this.makeRegData(lines);

    this.updateProgress("データを登録中...");
    let count = 0;
    for (let w of Object.keys(this.reg_data)) {
      this.chunk[w] = this.reg_data[w];
      if (++count % this.chunk_size === 0) {
        await new Promise(resolve => chrome.storage.local.set(this.chunk, resolve));
        this.updateProgress("データを登録中... ", count + "単語を登録しました");
        this.chunk = {};
      }
    }
    // register left words
    await new Promise(resolve => chrome.storage.local.set(this.chunk, resolve));
    this.updateProgress("登録完了！", count + "単語を登録しました");
  }

  /**
   * parse string and create object
   *
   * @param {[String]} lines string data splitted by line break
   */
  makeRegData(lines) {
    let count = 0;
    for (let line of lines) {
      const [word, info] = this.parse(line); // parse string to word and its meaning
      if (!word) { continue; }               // if parse is failed, skip

      const reg_word = word.toLowerCase();
      if (this.reg_data.hasOwnProperty(reg_word)) {
        this.assignDictData(reg_word, word, info);
      } else {
        this.reg_data[reg_word] = {[word]: info};
      }

      if (++count % 100000 === 0) { this.updateProgress("データを作成中... ", count + "行を処理しました"); }
    }
    // stringify (because when word is "constructor", it causes bug)
    for (let w of Object.keys(this.reg_data)) { this.reg_data[w] = JSON.stringify(this.reg_data[w]); }
  }

  /**
   * @param {String} reg_word word id
   * @param {String} word     display word
   * @param {{variant: [{part: String, mean: String}]}} word_data
   */
  assignDictData(reg_word, word, word_data) {
    if (this.reg_data[reg_word].hasOwnProperty(word)) {
      this.reg_data[reg_word][word].push(...word_data);
    } else {
      Object.assign(this.reg_data[reg_word], {[word]: word_data});
    }
  }

  /**
   * @param {String} str
   */
  parse(str) {
    // parse EIJIRO data
    const pattern_eijiro_1 = str.match(/■(.*)  \{(.*)\} : (.*)/);
    if (pattern_eijiro_1) {
      const word  = pattern_eijiro_1[1];
      const part  = pattern_eijiro_1[2];
      const _mean = pattern_eijiro_1[3];
      const mean  = (/→/.test(_mean)) ? this.setLinkEijiro(_mean) : _mean;
      return [word, [{part, mean}]];
    }
    const pattern_eijiro_2 = str.match(/■(.*) : (.*)/);
    if (pattern_eijiro_2) {
      const word  = pattern_eijiro_2[1];
      const _mean = pattern_eijiro_2[2];
      const mean  = (/→/.test(_mean)) ? this.setLinkEijiro(_mean) : _mean;
      return [word, [{mean}]];
    }
    const pattern_ejdic = str.match(/(.+)\t(.+)/);
    if (pattern_ejdic) {
      const word  = pattern_ejdic[1];
      const means = pattern_ejdic[2].split(" / ").map(this.cleanseEjdic); // "A / =B / C" => [{mean: "A"}, {mean: "<→B>"}, {mean: "C"}]
      return [word, means];
    }
    return [null, null];
  }

  /**
   * convert "→str" to "<→str>"
   *
   * @param {*} str
   */
  setLinkEijiro(str) {
    if (/<→.+>/.test(str)) { return str; }
    return str.replace(/→.+/, s => "<" + s + ">");
  }

  /**
   * remove whitespace from both end
   * convert "=str" to "<→str>"
   * return {"mean": str}
   *
   * @param {*} str
   */
  cleanseEjdic(str) {
    const trimmed = str.trim();
    if (!(/=.+/.test(trimmed))) { return { mean: str }; }
    return { mean: trimmed.replace(/=(.+)/, (_, part) => "<→" + part + ">") };
  }
}