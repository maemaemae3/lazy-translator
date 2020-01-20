global.browser = require("webextension-polyfill");

import Vue from "vue";
import App from "./App";

export const eventBus = new Vue();

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