global.browser = require('webextension-polyfill');

import Vue from "vue";
import App from "./App";

export const eventBus = new Vue();

/* eslint-disable no-new */
new Vue({
  el: '#app',
  render: h => h(App)
});

browser.runtime.onMessage.addListener(req => {
  eventBus.$emit(req.func, req.data);
});