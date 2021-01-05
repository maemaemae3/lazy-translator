# 📙LazyTranslator

翻訳と辞書引きの両方ができる拡張機能です
![a.gif](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/264764/01356cc8-faf4-0e00-b2ec-88ca96aed2c5.gif)

# 📝Requirements
```
- Node.js 14.15.4 or later
```

# 👩‍🏫使い方

## ⚙️オプションを開く

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/264764/906e8156-416f-8907-1a80-689d68ba33e3.png)

- chromeの場合  
アイコンを右クリックし、オプションを開く  

  ![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/264764/33fd33ae-7f2b-9e0d-cd78-4e3da9cf911b.png)
  
- Firefoxの場合  
アドレスバーに `about:addons`と入力後、オプションを開く  

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/264764/06e2c2ec-320a-db1d-98ff-9af54de18e69.png)

### 📖辞書データの登録

※ 現在は英辞郎データ ( https://booth.pm/ja/items/777563 )、ejdic-hand ( https://kujirahand.com/web-tools/EJDictFreeDL.php ) にのみ対応しています

1. 辞書データを選択します  
   ※ 選択した時点で登録が開始します
2. 暫く待つと登録が完了します  
3. 単語を選択すると、辞書に載っていた場合にその意味を表示できます

### 🏳️‍🌈翻訳機能


1. Google App Scriptで翻訳スクリプトを作ります(https://qiita.com/maemaemae3/items/3d8ceb5aa8a3bc78fcad を参照)
   (そのURLにリクエスト`翻訳対象`を送ると`翻訳結果`を返すものだったらGAS以外でも構いません)
2. 実行URLをオプションページの**translate API settings**のテキストボックスに貼り付け、  
   **API動作テスト**ボタンを押下します
3. テストが行われ、成功した場合にそのURLが登録されます  
   失敗した場合はその旨が表示されます
4. 文章を選択すると、辞書に選択部分の単語が載っていなかった場合に翻訳を行い、その結果を表示します  

### 🛑機能の一時停止
右上の拡張機能アイコンを押すと、翻訳機能のオンオフが切り替えられます。

# build

[vue-web-extension](https://github.com/Kocal/vue-web-extension)を使用しています

```shell
$ npm install
# Build the extension into dist folder for production.
$ npm run build
# Watch for modifications
$ npm run watch:dev
```

## パッケージの作成

```shell
$ npm run build-zip
```

# License

this extension is published under the MIT license.
