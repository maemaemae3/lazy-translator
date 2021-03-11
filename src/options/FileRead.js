import Encoding from 'encoding-japanese';

export default class FileRead {
  constructor(file, encoding) {
    this.file = file;
    this.file_size = file.size;
    this.encoding = encoding || null;
  }

  async readFile() {
    if (!this.encoding) { this.encoding = await this.detectEncoding(); }
    return new Promise((resolve, reject) => {
      const r = new FileReader();

      r.onload = (e) => {
        if (e.target.error) {
          console.log(`Read error: ${e.target.error}`);
          reject(e);
          return;
        }

        resolve(e.target.result);
      };

      r.readAsText(this.file, this.encoding);
    });
  }

  detectEncoding() {
    return new Promise((resolve, reject) => {
      const blob = this.file.slice(0, 1000); // use first 1KB to detect encoding

      const r = new FileReader();
      r.onload = (e) => {
        if (e.target.error) {
          return reject(e);
        }
        const codes = new Uint8Array(e.target.result);
        const encoding = Encoding.detect(codes);
        console.log(encoding);
        if (encoding === 'UTF8') { return resolve('UTF-8'); }
        if (encoding === 'SJIS') { return resolve('Shift_JIS'); }
        return reject(new Error('Read error: can\'t detect encoding'));
      };
      r.readAsArrayBuffer(blob);
    });
  }
}
