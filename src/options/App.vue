<template>
  <div>
    <h1 class="dict">辞書データの登録(英辞郎・ejdic形式のみ)</h1>

    <table>
      <tr>
        <th class="dic">辞書ファイルの文字コード<br>(非選択で自動検出)</th>
        <td>
          <span v-for="enc of encodings" :key="enc.value">
            <label><input type="radio" name="encoding" v-model="encoding" :value="enc.value">{{ enc.disp }} </label>
          </span>
        </td>
      </tr>
      <tr>
        <th class="dic">辞書ファイル</th>
        <td>
          <input type="file" id="dic-file" @change="registerWord"><label for="dic-file" class="dic">{{ fileName }}</label><br>
        </td>
      </tr>
    </table>
    <div class="status">
      <button class="dic del-dic" @click="openModal">辞書データの削除</button>
      <span id="dict-status">{{ regWord.status }}</span>
      <span id="dict-progress">{{ regWord.progress }}</span>
    </div>

    <modalWindow @close="closeModal" @delete="clearDict" v-if="modal">
      辞書データを全て削除します。<br>よろしいですか？
    </modalWindow>

    <h1 class="api">翻訳API設定</h1>
    <table>
      <tr>
        <th class="api">URLの設定</th>
        <td>
          <input id="script-url" v-model="translateAPI.url"><br>
          <button id="register-script-btn" class="api" @click="registerAPIUrl">API動作テスト</button><br>
        </td>
      </tr>
    </table>
    <div class="status">
      <span id="script-url-status">{{ translateAPI.status }}</span>
    </div>
  </div>
</template>

<script>
import { eventBus } from "./options";
import modalWindow from "./Modal";
import FileRead from "./FileRead";
import WordRegister from "./WordRegister";

export default {
  components: {
    modalWindow: modalWindow
  },
  data() {
    return {
      encodings: [{value: "UTF8", disp: "UTF8"}, {value: "Shift-JIS", disp: "SHIFT-JIS"}],
      encoding: null,
      fileName: "参照",
      regWord: {
        status  : "　",
        progress: "　"
      },
      translateAPI: {
        status: "　",
        url   : null
      },
      modal: false
    }
  },
  mounted() {
    chrome.storage.local.get("translate_api_url", value => {
      if (value.translate_api_url) {
        this.translateAPI.url = value.translate_api_url;
      }
    });
  },
  methods: {
    async registerAPIUrl() {
      const body = "test";
      const headers = { 'Content-Type': 'text/plain' };
    
      await new Promise(async resolve => {
          try {
              const response = await fetch(this.translateAPI.url, { method:"POST", headers, body });
              const result   = await response.text();
              if (result === "テスト") {
                  chrome.storage.local.set({translate_api_url: this.translateAPI.url}, () => {
                    this.translateAPI.status = "登録完了";
                  });
              } else {
                  this.translateAPI.status = "登録エラー: おそらくAPI周りに問題があります";
              }
          } catch (e) {
              this.translateAPI.status = "登録エラー: おそらくURLが正しくないです";
          }
      });
    },
    openModal() {
      this.modal = true
    },
    closeModal() {
      this.modal = false
    },
    async clearDict() {
      // remember current settings
      let isExtensionOn = null;
      await new Promise((resolve) => {
        chrome.storage.local.get("isExtensionOn", value => {
          if (value.isExtensionOn) {
            isExtensionOn = value.isExtensionOn;
            resolve();
          }
        });
      });
      // clear local storage
      chrome.storage.local.clear();
      // restore settings
      chrome.storage.local.set({isExtensionOn});
      if (this.translateAPI.url) {
        chrome.storage.local.set({translate_api_url: this.translateAPI.url});
      }
      this.updateProgress("辞書データを削除しました");
      // close modal
      this.modal = false
    },
    updateProgress(status, progress) {
      this.regWord.status   = status;
      this.regWord.progress = progress ? progress : "";
    },
    /**
     * @param {Event} e 
     */
    async registerWord(e) {
      this.updateProgress("データを読み込み中");

      this.fileName = e.target.files[0].name;
      const reader  = new FileRead(e.target.files[0], this.encoding);
      
      const browser    = navigator.userAgent;
      const chunk_size = (browser.indexOf("Chrome") > -1) ? 100000 : 1000;
      const wordReg    = new WordRegister(this.updateProgress, chunk_size);

      try {
        const dict_text  = await reader.readFile();
        const dict_lines = dict_text.split("\n");
        await wordReg.register(dict_lines);
      } catch (error) {
        this.updateProgress("エラー。", "読み込みに失敗しました");
      }
      document.getElementById("dic-file").value = "";
      return;
    }
  }
};
</script>

<style lang="scss" scoped>
$api: #5bb7ae;
$dic: #5b92b7;

h1 {
  font-size: 20px;
  font-weight: normal;
  padding: 0.25em 0.5em;
  margin-bottom: 0px;
  color: #494949;
  background: transparent;
  border-left: solid 5px;
  &.api {
    clear: left;
    margin-top: 30px;
    border-color: $api;
  }
  &.dict {
    border-color: $dic;
  }
}

.status {
  text-align: right;
}

// button
@mixin button-border-and-hover($color: #000) {
  border: 1px solid $color;
  color: $color;
  &:hover {
    background-color: $color;
    border-color: $color;
    color: white;
  }
}
button, #dic-file + label {
  font-size: inherit;
  background-color: white;
  display: inline-block;
  text-align: left;
  text-decoration: none;
  padding: 2px 16px;
  border-radius: 8px;
  transition: .2s;
  &.api {
    @include button-border-and-hover($api);
  }
  &.dic {
    @include button-border-and-hover($dic);
    &.del-dic {
      float: left;
    }
  }
}
#dic-file {
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  position: absolute;
  z-index: -1;
}

// table
@mixin table-th-after($color:#000) {
  display: block;
  content: "";
  width: 0px;
  height: 0px;
  position: absolute;
  top:calc(50% - 10px);
  right:-10px;
  border-left: 10px solid $color;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
}
table{
  width: 100%;
  font-size: 15px;
  border-collapse: collapse;
  tr{
    border-bottom: solid 1px $dic;
    &:last-child{
      border-bottom: 0px;
    }
  }
  th{
    font-weight: normal;
    position: relative;
    text-align: center;
    width: 40%;
    color: white;
    padding: 10px 0;
    &.api {
      background-color: $api;
      &:after{
        @include table-th-after($api);
      }
    }
    &.dic {
      background-color: $dic;
      &:after{
        @include table-th-after($dic);
      }
    }
  }
  td{
    text-align: right;
    width: 70%;
    background-color: #eee;
    padding: 10px 10px;
  }
  
  #script-url {
    margin-bottom: 5px;
    width: 95%;
  }
}
</style>