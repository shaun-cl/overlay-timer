(function () { 
  var defaultTimerLen = 10;
  var defaultVolumePcnt = 100;

  // Set default value in text box based on last used timer length
  chrome.storage.local.get(['lastTimerLen', 'lastVolumePcnt'], result => {
    console.log("Loaded prior settings", result);
    document.getElementById("timerMins").value = result.lastTimerLen || defaultTimerLen;
    document.getElementById("volumePcnt").value = result.lastVolumePcnt || defaultVolumePcnt;
  });

  function getTimerLen() {
    var timerMinsElement = document.getElementById("timerMins");
    return timerMinsElement ? parseFloat(timerMinsElement.value) : defaultTimerLen;
  }

  function getVolumePcnt() {
    var volumePcntElement = document.getElementById("volumePcnt");
    return volumePcntElement && parseInt(volumePcntElement.value) || defaultVolumePcnt;
  }

  function injectScripts(scripts) {
    return new Promise((resolve, reject) => {
      var toDo = scripts.slice();
      function injectNext() {
        if (toDo.length) {
          var next = toDo[0];
          toDo = toDo.slice(1);
          console.log("Injecting script", next);
          chrome.tabs.executeScript({file: next}, result => injectNext());
        } else
          resolve();
      }
      injectNext();
    });
  }

  function injectAndStartTimer() {
    var timerLen = getTimerLen();
    var volumePcnt = getVolumePcnt();
    var tabId;
    
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      tabId = tabs[0].id;
      chrome.tabs.sendMessage(tabId, {command: "ping"}, resp => { 
        if (chrome.runtime.lastError)  {
          console.log('Injecting');
          injectScripts(["options.js", "elements.js", "audio_content.js", "timer.js"]).then(result => startTimer(tabId, timerLen, volumePcnt));
          return;
        }
        console.log('No need to inject', resp);
        startTimer(tabId, timerLen, volumePcnt);
      });
    });
  }

  function startTimer(tabId, timerLen, volumePcnt) {
    var command = {command: 'start', 'length': timerLen, 'volumePcnt': volumePcnt};
    console.log("Command to start timer", command);
    chrome.tabs.sendMessage(tabId, command);
    chrome.storage.local.set({lastTimerLen: timerLen, lastVolumePcnt: volumePcnt}, () => window.close());
  }

  document.getElementById("startTimer").addEventListener("click", evt => {
    injectAndStartTimer();
  });

  document.getElementById("timerMins").addEventListener("keyup", evt => {
    if (evt.keyCode == 13)
      injectAndStartTimer();
  });
})();
