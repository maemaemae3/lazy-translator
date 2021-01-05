<template>
  <div ref="mainElement" id="lazy_inner" :class="{show, 'mode-translate': (mode === 'translate'), 'mode-dict': (mode === 'dict')}">
    <template v-if="mode === 'dict'">
      <div class="result" v-for="info of resFromDict" :key="'v-' + info.word">
        <span class="entry">{{ info.word }}</span>
        <div class="info" v-for="mean of info.mean" :key="mean.mean">
          <span v-if="mean.part" class="part">{{"\{"}}{{ mean.part }}{{"\}"}}</span> <span class="mean">{{ mean.mean }}</span>
        </div>
      </div>
    </template>
    <template v-else-if="mode === 'translate'">
      <span class="mean">{{ translated }}</span>
    </template>
  </div>
</template>

<script>
import { eventBus } from "./content_script";
import stemmer from "./stemmer";
import singularizer from "./singularizer";

export default {
  data() {
    return {
      isEnabled: true,
      show: false,
      mode: null,
      resFromDict: [],
      translated: "",
      apiError: false,
      apiUrl: ""
    };
  },
  created() {
    // check if extension is turned ON
    chrome.storage.local.get("isExtensionOn", res => {
      this.isEnabled = res.isExtensionOn == 1 ? true : false;
    });
    // get translate api settings
    chrome.storage.local.get("translate_api_url", value => {
      if (value.translate_api_url) {
        this.apiUrl = value.translate_api_url;
      }
    });
    this.setListeners();
  },
  mounted() {
    eventBus.$on("toggleMode", (data) => {
      this.show      = false;
      this.isEnabled = data.isEnabled;
    });
  },
  methods: {
    setListeners() {
      window.addEventListener("mouseup", () => {
        const selectedString = this.getSelected()
        this.check(selectedString);
      });
      window.addEventListener("message", e => {
        if (e.data.extension === "lazyTranslator") {
          this.check(e.data.selectedString);
        }
      });
    },
    /**
     * check selected text and execute main function
     */
    async check(selectedString) {
      if (!this.isEnabled) { return; } // if disabled, do nothing

      if (!selectedString) {
          this.show = false;
          return;
      }

      this.resetScroll();

      const result = await this.searchDict(selectedString);
      if (result) {
        this.resFromDict = [];
        this.mode = "dict";
        await this.setResultFromDict(result);
        this.show = true;
      } else {
        this.mode = "translate";
        await this.setResultFromTranslateApi(selectedString);
        this.show = true;
      }
    },
    /**
     * get selected string
     */
    getSelected() {
      const selectedString = window.getSelection().toString().toLowerCase().trim();
      if (selectedString) { return selectedString; }
      return null;
    },
    /**
     * @param {String} text
     */
    async setResultFromTranslateApi(text) {
      try {
        const url      = (this.apiUrl !== "") ? this.apiUrl : "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ja&dt=t&q=" + encodeURI(text);
        const body     = text;
        const headers  = { "Content-Type": "text/plain" };
        const response = await fetch(url, { method:"POST", headers, body });
        if (this.apiUrl !== "") { this.translated = await response.text(); }
        else {
          const jsn = await response.json();
          this.translated = jsn[0][0][0];
        }
        this.apiError = false;
      } catch (e) {
        this.translated = "error occured with translate api.";
        this.apiError   = true;
      }
      return;
    },
    /**
     * make word array to fetch from DB
     *
     * @param {String} str
     */
    makeSearchWords(str) {
      if (str.split(" ").length !== 1) { return [str]; }
      const words = [str];
      const stemmed = stemmer(str);
      if (!words.includes(stemmed)) { words.push(stemmed); }
      const singularized = singularizer(str);
      if (!words.includes(singularized)) { words.push(singularized); }
      return words;
    },
    /**
     * fetch data from DB
     *
     * @param {String} str
     */
    async searchDict(str) {
      const searchWords = this.makeSearchWords(str);
      const values = await new Promise(resolve => chrome.storage.local.get(searchWords, resolve));
      if (Object.keys(values).length) {
        return Object.values(values).map(e => JSON.parse(e));
      }
      return null;
    },
    /**
     * get result from dictionary
     *
     * @param {[{display: [{mean: String}]}]} result
     */
    async setResultFromDict(results) {
      for (const wordData of results) {
      for (const word of Object.keys(wordData)) {
        this.resFromDict.push({
          word,
          mean: wordData[word]
        });

        // check for linked words
        for (const info of wordData[word]) {
          const hasLinkedWord = info.mean.match(/<→(.+)>/);
          if (hasLinkedWord){
            const linkedWord = hasLinkedWord[1];
            const linkedWordResult = await this.searchDict(linkedWord);
            if (!linkedWordResult) { continue; }
            await this.setResultFromDict(linkedWordResult);
          }
        }
      }
      }
      return;
    },
    /**
     * reset scroll position of translator div
     */
    resetScroll() {
      this.$refs.mainElement.scrollTop = 0;
    }

  }
};
</script>

<style lang="scss" scoped>
#lazy_inner {
  all: initial;
  position: fixed;
  left: 0px;
  bottom: calc(-20% - 30px);
  max-height: 20%;
  min-width: 50%;
  max-width: 90%;
  padding: 10px;
  margin: 10px;
  font-size: 12px;
  font-family: "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif;
  color: #000;
  background: rgba(240, 240, 240, 0.9);
  box-shadow: 0px 2px 3px rgba(0, 0, 0, 0.33);
  z-index: 2147483647;
  overflow-y: scroll;
  scrollbar-width: thin;
  scrollbar-color: #5bb7ae;
  transition-duration: 0.1s;
  &.show {
    bottom: 0px;
  }
  &.mode-translate {
    border-left: solid 6px #5bb7ae;
  }
  &.mode-dict {
    border-left: solid 6px #5b92b7;
  }

  .result {
    padding-bottom: 5px;
  }
  .info {
    border-top: solid 1px #999;
    margin-top: 5px;
    padding-top: 5px;
  }
  .part {
    color: green;
  }
  .error {
    color: red;
  }
  .entry {
    font-size: 18px;
    font-weight: bold;
  }
}
</style>
