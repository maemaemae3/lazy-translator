import Vue from 'vue';
import App from './App.vue';
import addIframeListener from './iframe-handler';

const isIframe = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

// load only on parent body (consider iframe)
if (!isIframe() && !document.getElementById('lazy_translator_area')) {
  const element = document.createElement('div');
  element.id = 'lazy_translator_area';
  document.body.appendChild(element);

  /* eslint-disable no-new */
  new Vue({
    el: '#lazy_translator_area',
    render: (h) => h(App),
  });
} else {
  addIframeListener(); // add click event listener to each iframe
}
