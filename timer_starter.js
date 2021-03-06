(function () { 
  var defaultTimerLen = 10;

  // Set default value in text box based on last used timer length
  chrome.storage.local.get(['lastTimerLen'], result => {
    document.getElementById("timerMins").value = result.lastTimerLen || defaultTimerLen;
  });

  function getTimerLen() {
    var timerMinsElement = document.getElementById("timerMins");
    return timerMinsElement ? parseFloat(timerMinsElement.value) : defaultTimerLen;
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
    var tabId;
    
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      tabId = tabs[0].id;
      chrome.tabs.sendMessage(tabId, {command: "ping"}, resp => { 
        if (chrome.runtime.lastError)  {
          console.log('Injecting');
          injectScripts(["elements.js", "audio_content.js", "timer.js"]).then(result => startTimer(tabId, timerLen));
          return;
        }
        console.log('No need to inject', resp);
        startTimer(tabId, timerLen);
      });
    });
  }

  function startTimer(tabId, timerLen) {
    chrome.tabs.sendMessage(tabId, {command: 'start', 'length': timerLen});
    chrome.storage.local.set({lastTimerLen: timerLen}, () => window.close());
  }

  document.getElementById("startTimer").addEventListener("click", evt => {
    injectAndStartTimer();
  });

  document.getElementById("timerMins").addEventListener("keyup", evt => {
    if (evt.keyCode == 13)
      injectAndStartTimer();
  });
})();
