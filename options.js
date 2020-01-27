;var Options = (function (Options) {
  var defaults = {usePlayfulSounds: false, minPlayForSecs: 4};

  function getSettings() {
    return new Promise(resolve => chrome.storage.local.get(Object.keys(defaults), 
                                                           options => resolve(Object.assign({ ... defaults }, options))));
  }

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

  function init() {
    getSettings().then(fillForm);
    var saveButton = document.getElementById("saveOptions");
    if (saveButton)
      saveButton.addEventListener('click', evt => saveForm());
  }

  init();
  Options.getSettings = getSettings;
  return Options;
})(Options || {});
