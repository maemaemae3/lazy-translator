const getRootWindow = (target = window.parent) => {
  if (target !== target.parent) { return getRootWindow(target.parent); }
  return target;
}

const getSelected = () => {
  const selectedString = window.getSelection().toString().toLowerCase().trim();
  if (selectedString) { return selectedString; }
  return null;
}

const sendSelectedString = () => {
  const selectedString = getSelected();
  const rootWindow     = getRootWindow();
  rootWindow.postMessage({
    extension: "lazyTranslator",
    selectedString,
  }, "*");
}

export const addIframeListener = () => {
  document.addEventListener("mouseup", sendSelectedString);
}
