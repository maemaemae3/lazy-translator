<template>
  <div id="lazy_inner" :class="{show, 'mode-translate': (mode === 'translate'), 'mode-dict': (mode === 'dict')}">
    <template v-if="mode === 'dict'">
      <div class="result" v-for="info of resFromDict" :key="'v-' + info.word">
        <span class="entry">{{ info.word }}</span>
        <div class="info" v-for="mean of info.means" :key="mean.mean">
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
  mounted() {
    chrome.storage.local.get("translate_api_url", value => {
      if (value.translate_api_url) {
        this.apiUrl = value.translate_api_url;
      }
    });
    eventBus.$on("toggleMode", (data) => {
      this.show      = false;
      this.isEnabled = data.isEnabled;
    });
    this.setListeners();
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
      const result = await this.searchDict(selectedString);
      if (result) {
        this.resFromDict = [];
        this.mode = "dict";
        await this.getFromDict(result);
        this.show = true;
      } else {
        this.mode = "translate";
        await this.getFromTranslateApi(selectedString);
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
    async getFromTranslateApi(text) {
      try {
        const url       = (this.apiUrl !== "") ? this.apiUrl : "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ja&dt=t&q=" + encodeURI(text);
        const body      = text;
        const headers   = { "Content-Type": "text/plain" };
        const response  = await fetch(url, { method:"POST", headers, body });
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
     * fetch data from DB
     *
     * @param {String} str
     */
    searchDict(str) {
      return new Promise(resolve => chrome.storage.local.get(str, value => {
          if (Object.keys(value).length) { resolve(JSON.parse(value[str])); }
          else { resolve(false); }
      }));
    },
    /**
     * get result from dictionary
     *
     * @param {{normalized_word: [{word: word_info}]}} result
     */
    async getFromDict(result) {
      for (let word of Object.keys(result)) {
        this.resFromDict.push({
          word,
          means: result[word]
        });

        // check for linked words
        for (let info of result[word]) {
          const hasLinkedWord = info.mean.match(/<→(.+)>/);
          if (hasLinkedWord){
            const linkWord       = hasLinkedWord[1];
            const linkWordResult = await this.searchDict(linkWord);
            await this.getFromDict(linkWordResult);
          }
        }
      }
      return;
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
