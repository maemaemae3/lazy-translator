export default class WordRegister {
    constructor(max_chunk_size) {
        this.chunk     = []; // chunk to register to storage
        this.chunk_cnt = 0;
        this.max_chunk_size = max_chunk_size ? max_chunk_size : 1000;

        this.looking = {
            word: null,
            data: {}
        }

        this.word_count = 0;
    }

    /**
     * parse string and register to chrome.storage
     * 
     * @param {[String]} data string data splitted by line break
     */
    async register(data) {
        // set first word on first time
        if (!this.looking.word) { this.looking.word = this.parse(data[0])[0].toLowerCase(); }

        for (let str of data) {
            const [word, info] = this.parse(str); // parse string to word and its meaning
            if (!word) { continue; }              // if parse is failed, skip
            if (word.toLowerCase() !== this.looking.word) {
                this.queueData(this.looking.word, this.looking.data);
                if (++this.chunk_cnt >= this.max_chunk_size) { await this.registerQueue(); }
                this.looking.data = {};
            }

            // set data to buffer
            this.looking.word = word.toLowerCase();
            if (!Array.isArray(this.looking.data[word])) {
                this.looking.data[word] = [...info];
            } else {
                this.looking.data[word].push(...info);
            }

            if (++this.word_count % 1000 === 0) { this.updateProgress(); } // display progress
        }
    }

    /**
     * 
     */
    updateProgress() {
        document.getElementById("staa-_-progress").innerText = this.word_count + " row processed";
    }

    /**
     * @param {String} word 
     * @param {{variant: [{part: String, mean: String}]}} word_data 
     */
    queueData(word, word_data) {
        this.chunk.push({[word]: JSON.stringify(word_data)});
    }

    /**
     * concat two word data info
     * 
     * @param {String} word 
     * @param {{word: word_info}} original 
     * @param {{word: word_info}} apply 
     */
    applyData2ObjStr(word, original, apply) {
        const orig_obj  = JSON.parse(original[word]);
        const apply_obj = JSON.parse(apply[word]);
        return JSON.stringify(Object.assign(orig_obj, apply_obj));
    }

    /**
     * check if word already exists in DB
     * if there is word on DB, apply data and overwrite with applied data
     * 
     * @param {{word: word_info}} word_data 
     */
    checkAndRegister(word_data) {
        return new Promise(async resolve => {
            const word        = Object.keys(word_data)[0];
            const fetch_data  = await new Promise(resolve => chrome.storage.local.get(word, res => resolve(res)));
            const insert_data = typeof fetch_data[word] !== "string" ? word_data : {[word]: this.applyData2ObjStr(word, fetch_data, word_data)};
            chrome.storage.local.set(insert_data, resolve)
        });
    }

    /**
     * register to chrome.storage
     */
    registerQueue() {
        return new Promise(async resolve => {
            for (let word_data of this.chunk) {
                await this.checkAndRegister(word_data);
            }
            this.chunk_cnt = 0;
            this.chunk     = [];
            resolve();
        });
    }

    /**
     * register left data to chrome.storage
     */
    registerLeftData() {
        this.queueData(this.looking.word, this.looking.data);
        this.registerQueue();
        this.updateProgress();
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