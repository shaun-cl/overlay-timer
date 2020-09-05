;var Options = (function (Options) {
  var defaults = {usePlayfulSounds: false, minPlayForSecs: 4,
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

  function loadSounds() {
    const makeSoundElem = (s) => `${s.name} - ${s.desc} <button class='playSound' data-url='${s.name}'>&#x25B6;</button><br>`;
    const makeSoundElems = (sounds, el) => el.innerHTML = sounds.map(makeSoundElem).join("");
    Audio.getPlayfulSounds().then(sounds => makeSoundElems(sounds, document.getElementById("playfulSounds")));
    Audio.getSeriousSounds().then(sounds => makeSoundElems(sounds, document.getElementById("seriousSounds")));
    document.body.addEventListener('click', evt => {
      if (evt.target.classList.contains("playSound")) {
        Audio.playSound(chrome.runtime.getURL(evt.target.dataset.url))
      }
    });
  }

  function init() {
    getSettings().then(fillForm);
    var saveButton = document.getElementById("saveOptions");
    if (saveButton)
      saveButton.addEventListener('click', evt => saveForm());
    loadSounds();
  }

  init();
  Options.getSettings = getSettings;
  return Options;
})(Options || {});
