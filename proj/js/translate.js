// set url
let api_url = "";
chrome.storage.local.get("translate_api_url", value => { api_url = value.translate_api_url; });

/**
 * show area
 * 
 * @param {String} html_blocks
 */
function show(html_blocks) {
    if (!getSelected()) { return; }
    
    reset();
    const addon_area = document.getElementById("simple_translate_addon_area");
    for (let block of html_blocks) {
        addon_area.appendChild(block);
    }
    addon_area.classList.add("staa-_-show");
}

/**
 * hide area
 */
function hide() {
    document.getElementById("simple_translate_addon_area").classList.remove("staa-_-show");
}

/**
 * reset area
 */
function reset() {
    const addon_area = document.getElementById("simple_translate_addon_area");
    while (addon_area.firstChild) { addon_area.removeChild(addon_area.firstChild); }
}

/**
 * get selected string
 */
function getSelected() {
    const selected = window.getSelection().toString().toLowerCase().trim();
    if (selected !== "") { return selected; }
    else { return false; }
}

/**
 * 
 * @param {String} text 
 */
function getTranslateApiRes(text) {    
    const url = api_url;
    const body = JSON.stringify({ text: text });
    const headers = {
        'Accept'      : 'application/json',
        'Content-Type': 'application/json'
    };
    
    return new Promise(async resolve => {
        if (!getSelected()) { return; }
        
        try {
            const response = await fetch(url, { method:"POST", headers, body });
            const res_json = await response.json();
            document.getElementById("simple_translate_addon_area").classList.add("staa-_-api_translated");
            const translated = document.createElement("span");
            translated.innerText = res_json.result;
            translated.classList.add("staa-_-mean");
            resolve([translated]);
        } catch {
            const error     = document.createElement("span");
            error.innerText = "Error! something went wrong with translate api.";
            error.classList.add("staa-_-error");
            resolve([error]);
        }
    });
}

/**
 * fetch data from DB
 * 
 * @param {String} str 
 */
function searchDict(str) {
    return new Promise(resolve => chrome.storage.local.get(str, value => {
        if (Object.keys(value).length) { resolve(JSON.parse(value[str])); }
        else { resolve(false); }
    }));
}

/**
 * @param {HTMLElement} parent 
 * @param {[{word: word_info}]} infos 
 */
function makeInfoPart(parent, infos) {
    for (let info of infos) {
        const info_block = document.createElement("div");
        info_block.classList.add("staa-_-info");
        // add part and mean
        if (info.part) {
            const part     = document.createElement("span");
            part.innerText = "{" + info.part + "}";
            part.classList.add("staa-_-part");
            info_block.appendChild(part);
        }
        const mean     = document.createElement("span");
        mean.innerText = info.mean;
        mean.classList.add("staa-_-mean");
        info_block.appendChild(mean);
        
        parent.appendChild(info_block);
    }
}

/**
 * @param {{normalized_word: [{word: word_info}]}} result 
 */
function makeResultBlock(result) {
    const result_blocks = [];
    for (let word of Object.keys(result)) {
        const block     = document.createElement("div");
        const entry     = document.createElement("span");
        entry.innerText = word;
        block.classList.add("staa-_-result");
        entry.classList.add("staa-_-entry");
        block.appendChild(entry);
        makeInfoPart(block, result[word]);
        
        result_blocks.push(block);
    }
    return result_blocks;
}

/**
 * get result if word has link like "<→hogehoge>"
 * 
 * @param {{normalized_word: [{word: word_info}]}} result 
 */
async function getLinkWordResults(result) {
    const link_results = [];
    const fetched      = new Set();

    for (let word of Object.keys(result)) {
        for (let info of result[word]) {
            const link = info.mean.match(/<→(.+)>/);
            if (link){
                const link_word = link[1];
                if (fetched.has(link_word)) { continue; }
                link_results.push(await searchDict(link_word));
                fetched.add(link_word);
            }
        }
    }

    return link_results;

}

/**
 * get result from dictionary
 * 
 * @param {{normalized_word: [{word: word_info}]}} result 
 */
async function getDictRes(result) {
    document.getElementById("simple_translate_addon_area").classList.remove("staa-_-api_translated");

    const result_list = [result, ...(await getLinkWordResults(result))];

    const html_blocks = [];
    for (let res of result_list) {
        html_blocks.push(...makeResultBlock(res));
    }
    return html_blocks;
}

/**
 * check selected word and choose info source
 */
async function check() {
    const selected = getSelected();
    if (!selected) { 
        hide();
        return;
    }
    
    const result   = await searchDict(selected);
    const res_html = result ? await getDictRes(result) : await getTranslateApiRes(selected);
    show(res_html);
}

const element = document.createElement("div");
element.id = "simple_translate_addon_area";
document.body.appendChild(element);
document.addEventListener("mouseup", check);