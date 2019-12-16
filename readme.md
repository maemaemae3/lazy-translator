# simple translate

翻訳と辞書引きの両方ができる拡張機能です

## How to use

### 翻訳機能

1. GASで翻訳スクリプトを作ります
   (https://qiita.com/drafts/3d8ceb5aa8a3bc78fcad を参照)
   (そのURLにリクエスト`{text: 翻訳対象}`を送ると`{result: 翻訳結果}`を返すものだったら何でも構いません)
2. 実行URLをオプションページの**translate API settings**のテキストボックスに貼り付け、
   **set translate script url**ボタンを押下します
3. テストが行われ、成功した場合にそのURLが登録されます
   失敗した場合はその旨が表示されます
4. 文章を選択すると、辞書に選択部分の単語が載っていなかった場合に翻訳を行い、その結果を表示します
   (英語以外も対応できるはずです)

### 辞書引き

※ 現在は英辞郎データ ( https://booth.pm/ja/items/777563 )、 ejdic-hand ( https://kujirahand.com/web-tools/EJDictFreeDL.php ) にのみ対応

1. オプションページから辞書データを選択します
2. 暫く待つと登録が完了します  
   ※ 登録を終えるまでウィンドウをアクティブなままにしておくことをおすすめします。  
   　 作者がサボって上手いことやっていないので、別のウィンドウをアクティブにすると  
   　 登録作業が極端に遅くなる可能性があります
3. 単語を選択すると、辞書に載っていた場合にその意味を表示できます

# build

※ プロジェクトルートで行って下さい

```shell
# install webpack
$ npm install webpack -g
$ npx webpack
```

## パッケージの作成

※ `proj` ディレクトリに移動して行って下さい

```shell
$ npm install web-ext -g
$ web-ext build
```

上記を実行すると、 `web-ext-artifacts` にパッケージが生成されているはずです
バージョン番号や説明、タイトルの変更などはmanifest.jsonをいじるなりして行えます

# License

this extension is published under the MIT license.