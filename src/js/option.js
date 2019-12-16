import FileStreamer from "./FileStreamer.js";
import WordRegister from "./WordRegister.js";

/**
 * register words
 * 
 * @param {Event} e 
 */
async function register(e) {
    document.getElementById("staa-_-status").innerText   = "processing... ";
    document.getElementById("staa-_-progress").innerText = "";
    const file = e.target.files[0];

    let error = false;
    const reader  = new FileStreamer(file);
    const wordReg = new WordRegister();
    while(!reader.eof) {
        await reader.readNextChunk()
        .then(async (res) => {
            const res_ary = res.split("\n");
            await wordReg.register(res_ary).catch(() => { throw "error occured. Is file structure correct?" });
        })
        .catch(e => {
            document.getElementById("staa-_-progress").innerText = e;
            error = true;
        });
        if (error) { return; }
    }
    wordReg.registerLeftData();
    document.getElementById("staa-_-status").innerText = "Completed!";
}

/**
 * 
 */
async function registerScriptUrl() {
    const url = document.getElementById("staa-_-script_url").value;
    const body = JSON.stringify({ text: "test" });
    const headers = {
        'Accept'      : 'application/json',
        'Content-Type': 'application/json'
    };
    
    await new Promise(async resolve => {
        fetch(url, { method:"POST", headers, body })
        .then(res => res.json())
        .then(json => {
            if (json.result) {
                chrome.storage.local.set({translate_api_url: url}, () => {
                    document.getElementById("staa-_-script_url_status").textContent = "register success!";
                });
            } else {
                document.getElementById("staa-_-script_url_status").textContent = "register failed. maybe url or parameter of script is wrong.";
            }
        })
        .catch((e) => {
            document.getElementById("staa-_-script_url_status").textContent = "error occured (" + e + "). something is wrong";
        });
    });
}

chrome.storage.local.get("translate_api_url", value => {
    if (value.translate_api_url) {
        document.getElementById("staa-_-script_url").value = value.translate_api_url;
    }
});
document.getElementById("staa-_-dic").addEventListener("change", register);
document.getElementById("staa-_-register_script_btn").addEventListener("click", registerScriptUrl);