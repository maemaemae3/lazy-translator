# 📙LazyTranslator

翻訳と辞書引きの両方ができる拡張機能です
![a.gif](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/264764/01356cc8-faf4-0e00-b2ec-88ca96aed2c5.gif)

# 📝Requirements
```
- Node.js 14.15.4 or later
```

# 👩‍🏫使い方

## ⚙️オプションを開く

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/264764/7bf570a9-8d4a-f861-f800-f4ac4a3cd2fa.png)

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

### 🛑機能の一時停止
右上の拡張機能アイコンを押すと、翻訳機能のオンオフが切り替えられます。

# build

[vue-web-extension](https://github.com/Kocal/vue-web-extension)を使用しています

## 依存関係のインストール
```shell
$ npm install
```

## 開発中
ブラウザから `dist` ディレクトリを行うことで、ホットリロードしながら開発が行なえます。
```shell
$ npm run serve
```

## リリース時
`artifacts` ディレクトリにリリース用のzipが生成されます。
```shell
$ npm run build
```

# License

this extension is published under the MIT license.
