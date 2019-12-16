import Encoding from 'encoding-japanese';

export default class FileStreamer {
    constructor(file, chunk_size) {
        this.file          = file;
        this.file_size     = file.size;
        this.offset        = 0;
        this.default_chunk = chunk_size ? chunk_size : 1024 * 1024 * 1; // 1MB
        this.chunk_size    = this.default_chunk; // if there is no line break in chunk, expand chunk and set to this.chunk_size
        this.eof           = false;

        this.encoding = document.getElementById("staa-_-encoding").value;
    }

    /**
     * return string sliced by last \n or \r\n and its byte length
     * if there is no line break, return entire str
     * 
     * @param {String} str 
     */
    sliceByLastLineBreak(str) {
        const last_n_idx  = str.lastIndexOf("\n");

        // if str has no \n, return all str
        if (last_n_idx === -1) {
            const byte_ary = Encoding.convert(str, {
                from: "UTF8",
                to  : this.encoding
            });
            return {sliced: str, byte: byte_ary.length};
        }

        // check whether text use \r\n or \n
        const last_rn_idx = str.lastIndexOf("\r\n");
        const use_rn      = (last_n_idx - last_rn_idx === 1) ? true : false;

        // slice by last \r\n or \n
        const sliced = use_rn ? str.slice(0, last_rn_idx) : str.slice(0, last_n_idx);

        // calc bytes of sliced str
        const offset_ary = new TextEncoder().encode(str.slice(0, last_n_idx + 1));
        const byte_ary   = Encoding.convert(offset_ary, {
            from: "UTF8",
            to  : this.encoding
        });

        return {sliced: sliced, byte: byte_ary.length};
    }

    /**
     * read next chunk from file
     */
    readNextChunk() {
        return new Promise((resolve, reject) => {
            const r    = new FileReader();
            const blob = this.file.slice(this.offset, this.offset + this.chunk_size);

            r.onload = e => {
                if (e.target.error) {
                    return reject("Read error: " + e.target.error);
                }

                // encode and convert
                const codes = new Uint8Array(e.target.result);
                const str   = Encoding.convert(codes, {
                    from: this.encoding,
                    to: "UNICODE",
                    type: "string"
                });
                
                if (this.offset + this.chunk_size > this.file_size) {
                    // if offsets gets to the end of file, return all chunk
                    this.eof     = true;
                    // if last word is line break, slice string until it
                    const sliced = (str[str.length - 1] !== "\n") ? str : this.sliceByLastLineBreak(str).sliced;
                    return resolve(sliced);
                }

                if (str.lastIndexOf("\n") === -1) {
                    // if there is no line break in chunk, extend it
                    this.chunk_size += this.default_chunk;
                    this.readNextChunk().then(res => resolve(res));
                    return;
                } else {
                    // find last line break and split by it
                    const {sliced, byte} = this.sliceByLastLineBreak(str);

                    // increment offset
                    this.offset += byte;
                    if (this.offset >= this.file_size) { this.eof = true; }
                    // reset chunk_size
                    this.chunk_size = this.default_chunk;
                    
                    return resolve(sliced);
                }
            }

            r.readAsArrayBuffer(blob);
        });
    }
}