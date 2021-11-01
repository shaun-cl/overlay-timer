;var Options = (function (Options) {
  var defaults = {usePlayfulSounds: false, minPlayForSecs: 4,
                  maxPlayForSecs: 4,
                  usePeriodicBeeps: true, periodicBeepSeconds: 30};

  const getSettings = () => new Promise(resolve => chrome.storage.local.get(Object.keys(defaults),
                                                                            options => resolve(Object.assign({ ... defaults }, options))));
  function fillForm(options) {
    console.log(options);
    for (var option of document.querySelectorAll(".option")) {
      if (option.dataset.optionType == "boolean")
        option.checked = options[option.id] ? true : false;
      else if (option.dataset.optionType == "integer")
        option.value = parseInt(options[option.id]);
      else
        option.value = options[option.id];
    }
  }

  function saveForm() {
    var saveOptions = {};
    for (var option of document.querySelectorAll(".option")) 
      if (option.dataset.optionType == "boolean")
        saveOptions[option.id] = option.checked;
      else if (option.dataset.optionType == "integer")
        saveOptions[option.id] = parseInt(option.value)
      else
        saveOptions[option.id] = option.value;

    chrome.storage.local.set(saveOptions, result => console.log(result));
  }

  async function saveNewFile(fileHandle) {
    console.log(`Saving ${fileHandle}`);
    var localDir = await navigator.storage.getDirectory();
    var newFileHandle = await localDir.getFileHandle(fileHandle.name, { create: true });
    var writable = await newFileHandle.createWritable();
    var file = await fileHandle.getFile();
    console.log(localDir, newFileHandle, fileHandle, writable);
    writable.write(file);
    writable.close();
    
  }

  const sendAsyncMessage = (message) => new Promise(accept => chrome.runtime.sendMessage(message, accept));

  async function handleUpload() {
    var [fileHandle] = await window.showOpenFilePicker();
    saveNewFile(fileHandle);
    refreshSounds();
  }

  async function refreshSounds() {
    await sendAsyncMessage({command: 'refreshAudioFilesList'});
    loadSounds();
  }

  function loadSounds() {
    const makeSoundElem = (s) => `${s.extensionRelativeFileName} - ${s.description} <button class='playSound' data-url='${s.url}'>&#x25B6;</button> ${s.type == 'custom' ? `<button class='deleteSound' data-name='${s.extensionRelativeFileName}'>Delete</button>` : ``}<br>`;
    const makeSoundElems = (sounds, el) => el.innerHTML = sounds.map(makeSoundElem).join("");
    Audio.getPlayfulSounds().then(sounds => makeSoundElems(sounds, document.getElementById("playfulSounds")));
    Audio.getSeriousSounds().then(sounds => makeSoundElems(sounds, document.getElementById("seriousSounds")));
    Audio.getCustomSounds().then(sounds =>  makeSoundElems(sounds, document.getElementById("customSounds")));
  }

  function initOptionsPage() {
    getSettings().then(fillForm);
    var saveButton = document.getElementById("saveOptions");
    if (saveButton)
      saveButton.addEventListener('click', evt => saveForm());
    var uploadButton = document.getElementById("uploadFile");
    if (uploadButton)
      uploadButton.addEventListener('click', handleUpload);
    loadSounds();
    document.body.addEventListener('click', evt => {
      if (evt.target.classList.contains("playSound")) {
        getSettings().then(options => Audio.playSound(evt.target.dataset.url, options.minPlayForSecs, options.maxPlayForSecs));
      } else if (evt.target.classList.contains("deleteSound"))
        chrome.runtime.sendMessage({command: 'deleteCustomAudioFile', name: evt.target.dataset.name}, refreshSounds);
    });
  }

  if (window.location.href.startsWith("chrome-extension://"))
    initOptionsPage();

  Options.getSettings = getSettings;
  return Options;
})(Options || {});
