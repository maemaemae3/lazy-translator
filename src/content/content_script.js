global.browser = require("webextension-polyfill");

import Vue from "vue";
import App from "./App";
import { addIframeListener } from "./iframe_handler";

export const eventBus = new Vue();

const isIframe = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

// load only on parent body (consider iframe)
if (!isIframe() && !document.getElementById("lazy_translator_area")) {
  const element = document.createElement("div");
  element.id = "lazy_translator_area";
  document.body.appendChild(element);

  new Vue({
    el: "#lazy_translator_area",
    render: h => h(App)
  });

  browser.runtime.onMessage.addListener(req => {
    eventBus.$emit(req.func, req.data);
  });
} else {
  addIframeListener(); // add click event listener to each iframe
}