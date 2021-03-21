<template>
  <div v-show="isInitialized" ref="container" id="lazy-translator-container">
    <div v-if="isResizing" ref="resizeGuide" id="lazy-translator-resize-guide">最大表示範囲</div>
    <div ref="resizer" id="lazy-translator-resizer" @mousedown.prevent="resizeStart"/>
    <div ref="content" id="lazy-translator-contents" :class="{'mode-translate': (mode === 'translate'), 'mode-dictionary': (mode === 'dictionary')}">
      <template v-if="mode === 'dictionary'">
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
  </div>
</template>

<script>
import stemmer from './stemmer';
import singularizer from './singularizer';

export default {
  data() {
    return {
      isEnabled: false,
      isInitialized: false,
      isResizing: false,
      show: false,
      mode: null,
      resFromDict: [],
      selectedBefore: '',
      translated: '',
      apiError: false,
      contentWidth: 400,
      contentMaxHeight: 30,
      contentMargin: 10,
      resizerRadius: 7,
    };
  },
  watch: {
    show(newValue) {
      this.updateContainerShowStatus(newValue);
    },
  },
  created() {
    this.setListeners();
  },
  async mounted() {
    browser.runtime.onMessage.addListener((req) => {
      if (req.func === 'toggleMode') {
        this.show = false;
        this.isEnabled = req.data.isEnabled;
      }
    });
    await this.fetchAndApplyExtensionDataFromStorage();
    this.isEnabled = true; // after initialized
    this.$refs.resizer.style.right = `${this.contentMargin}px`;
    this.$refs.resizer.style.top = `${this.contentMargin}px`;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target.nodeName !== 'BODY') { return; }
        if (!this.contentWidth || !this.contentMaxHeight) { return; }
        // even if window size is resized smaller than lazytranslator element, keep resizer visible
        // after window getting bigger than lazytranslator element, reset resizer position
        if (this.contentWidth > document.body.clientWidth) {
          this.$refs.resizer.style.right = `${this.contentWidth - document.body.clientWidth + 20}px`;
        } else {
          this.$refs.resizer.style.right = `${this.contentMargin}px`;
        }
        const contentHeight = this.$refs.content.offsetHeight;
        if ((contentHeight + (this.contentMargin * 2)) > document.documentElement.clientHeight) {
          this.$refs.resizer.style.top = `${contentHeight - document.documentElement.clientHeight + 20}px`;
        } else {
          this.$refs.resizer.style.top = `${this.contentMargin}px`;
        }
      }
    });
    resizeObserver.observe(document.body);

    // consider initialize time to calculate contents height and hide it
    setTimeout(() => {
      this.isInitialized = true;
    }, 100);
  },
  methods: {
    setListeners() {
      window.addEventListener('mouseup', () => {
        setTimeout(() => {
          if (this.checkKeepShowingSameState()) { return; }
          const selectedString = this.getSelectedString();
          this.translate(selectedString);
        }, 100);
      });
      window.addEventListener('message', (e) => {
        if (!e.data || (e.data.extension !== 'lazyTranslator')) { return; }
        if (e.data.selectedString) { this.translate(e.data.selectedString); } // data from iframe
        // sync area size between tabs (TBI)
        // if (e.data.contentWidth || e.data.contentMaxHeight) {
        //   this.contentWidth = e.data.contentWidth || this.contentWidth;
        //   this.contentMaxHeight = e.data.contentMaxHeight || this.contentMaxHeight;
        //   this.updatePositionStyle(this.contentWidth, this.contentMaxHeight);
        // }
      });
    },
    /**
     * check to keep extension area showing
     * @return {Boolean} allow to start process
     */
    checkKeepShowingSameState() {
      if (this.isResizing) { return true; }
      return this.getSelectedString() === this.selectedBefore;
    },
    /**
     * check selected text and execute main function
     */
    async translate(selectedString) {
      if (!this.isEnabled) { return; } // if disabled, do nothing

      if (!selectedString) {
        this.selectedBefore = null;
        this.show = false;
        return;
      }

      this.selectedBefore = selectedString;
      this.resetScroll();

      const result = await this.searchDict(selectedString);
      if (result) {
        this.resFromDict = [];
        this.mode = 'dictionary';
        await this.setResultFromDict(result);
        this.show = true;
      } else {
        this.mode = 'translate';
        this.show = true;
        this.translated = '翻訳中...';
        await this.setResultFromTranslateApi(selectedString);
      }
    },
    getSelectedString() {
      const selectedString = window.getSelection().toString().toLowerCase().trim();
      if (selectedString) { return selectedString; }
      return null;
    },
    /**
     * @param {String} text
     */
    async setResultFromTranslateApi(text) {
      try {
        const url = `https://translate.googleapis.com/translate_a/single?dt=t&dt=bd&dt=qc&dt=rm&dt=ex&client=gtx&hl=ja&sl=auto&tl=ja&q=${encodeURIComponent(text)}&dj=1`;
        const response = await fetch(url);
        const json = await response.json();
        this.translated = '';
        if (json.sentences) { // pattern 1 from translate api, which has result in json.sentences
          for (const result of json.sentences) {
            if (result.trans) { this.translated += result.trans; }
          }
        } else if (Array.isArray(json)) {
          for (const result of json[0]) {
            if (result[0]) { this.translated += result[0]; }
          }
        } else {
          throw new Error('error');
        }
        this.apiError = false;
      } catch (e) {
        this.translated = 'error occured with translate api.';
        this.apiError = true;
      }
    },
    /**
     * make word array to fetch from DB
     *
     * @param {String} str
     */
    makeSearchWords(str) {
      if (str.split(' ').length !== 1) { return [str]; }
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
      const values = await new Promise((resolve) => chrome.storage.local.get(searchWords, resolve));
      if (Object.keys(values).length) {
        return Object.values(values).map((e) => JSON.parse(e));
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
            mean: wordData[word],
          });

          // check for linked words
          for (const info of wordData[word]) {
            const hasLinkedWord = info.mean.match(/<→(.+)>/);
            if (hasLinkedWord) {
              const linkedWord = hasLinkedWord[1];
              const linkedWordResult = await this.searchDict(linkedWord);
              if (!linkedWordResult) { continue; }
              await this.setResultFromDict(linkedWordResult);
            }
          }
        }
      }
    },
    /**
     * reset scroll position of translator div
     */
    resetScroll() {
      this.$refs.content.scrollTop = 0;
    },
    resizeStart() {
      document.onmousemove = this.resize;
      document.onmouseup = this.resizeEnd;
      this.isResizing = true;
    },
    resize(e) {
      this.contentWidth = e.clientX - this.contentMargin + this.resizerRadius;
      this.contentMaxHeight = document.documentElement.clientHeight - e.clientY - this.contentMargin + this.resizerRadius;
      this.$refs.resizeGuide.style.width = `${this.contentWidth}px`;
      this.$refs.resizeGuide.style.height = `${this.contentMaxHeight}px`;
      this.updatePositionStyle(this.contentWidth, this.contentMaxHeight);
    },
    resizeEnd() {
      document.onmousemove = null;
      document.onmouseup = null;
      this.updateLocalStorage(this.contentWidth, this.contentMaxHeight);
      // avoid mouseup event firing by resizing content
      setTimeout(() => {
        this.isResizing = false;
      }, 100);
    },
    fetchAndApplyExtensionDataFromStorage() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['LazyTranslator_isExtensionOn', 'LazyTranslator_ContentWidth', 'LazyTranslator_ContentHeight'], (res) => {
          this.isEnabled = res.LazyTranslator_isExtensionOn === 1;
          this.contentWidth = res.LazyTranslator_ContentWidth || this.contentWidth;
          this.contentMaxHeight = res.LazyTranslator_ContentHeight || this.contentMaxHeight;
          this.updatePositionStyle(this.contentWidth, this.contentMaxHeight);
          this.updateContainerShowStatus();
          return resolve();
        });
      });
    },
    updatePositionStyle(contentWidth, contentMaxHeight) {
      this.$refs.content.style.width = `${contentWidth}px`;
      this.$refs.content.style['max-height'] = `${contentMaxHeight}px`;
    },
    updateContainerShowStatus(show = false) {
      if (show) {
        this.$refs.container.style.bottom = '0px';
      } else {
        this.$refs.container.style.bottom = `${-this.contentMaxHeight - 30}px`;
      }
    },
    updateLocalStorage(contentWidth, contentMaxHeight) {
      if (!contentWidth || !contentMaxHeight) { return; }
      chrome.storage.local.set({
        LazyTranslator_ContentWidth: contentWidth,
        LazyTranslator_ContentHeight: contentMaxHeight,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
#lazy-translator-container {
  all: initial;
  position: fixed;
  z-index: 2147483647;
  transition: bottom 0.1s;
  left: 0px;
}

#lazy-translator-contents {
  padding: 10px;
  margin: 10px;
  background: rgba(240, 240, 240, 0.9);
  box-shadow: 0px 2px 3px rgba(0, 0, 0, 0.33);
  box-sizing: border-box;
  overflow-y: scroll;
  scrollbar-width: thin;
  scrollbar-color: #5bb7ae;
  transition: bottom 0.1s;
  line-height: 1;
  span {
    font-size: 12px;
    font-family: "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif;
    color: #000;
  }
  &.mode-translate {
    border-left: solid 6px #5bb7ae;
  }
  &.mode-dictionary {
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

#lazy-translator-resize-guide {
  position: absolute;
  bottom: 0;
  opacity: 0.5;
  padding: 10px;
  margin: 10px;
  text-align: right;
  box-sizing: border-box;
  background: rgba(240, 240, 240, 1.0);
}

#lazy-translator-resizer {
  position: absolute;
  cursor: nesw-resize;
  width: 15px;
  height: 15px;
  background-image: url('data:image/svg+xml;charset=utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20512%20512%22%20style%3D%22height%3A300px%3Bwidth%3A300px%22%3E%3Crect%20y%3D%2215.6%22%20x%3D%2210%22%20height%3D%22485.1%22%20width%3D%22489.7%22%20style%3D%22fill%3A%23f0f0f0%3Bstroke-width%3A0.6%3Bstroke%3A%23000%22%2F%3E%3Cpolygon%20class%3D%22st0%22%20points%3D%22325.1%20234.1%20398.4%20160.7%20432.1%20194.4%20432.1%2079.9%20317.6%2079.9%20351.3%20113.6%20278%20186.9%20%22%20transform%3D%22matrix(1.2115825%200%200%201.2115825%20-97.597231%20-17.140686)%22%2F%3E%3Cpolygon%20class%3D%22st0%22%20points%3D%22194.4%20432.2%20160.7%20398.4%20234%20325.1%20186.9%20278%20113.6%20351.3%2079.8%20317.6%2079.8%20432.2%20%22%20transform%3D%22matrix(1.2115825%200%200%201.2115825%20-31.271927%20-77.858042)%22%2F%3E%3Cpath%20class%3D%22st0%22%20d%3D%22M0%200v512h512v-12.8V0H0zM486.3%20486.3H25.7V25.7h460.6V486.3z%22%20stroke%3D%22%23000%22%2F%3E%3C%2Fsvg%3E');
  background-size: 15px 15px;
}
</style>
