console.log("Hello");
document.getElementById("startTimer").addEventListener("click", evt => {
    console.log("Injecting");
    var timerMinsElement = document.getElementById("timerMins");
    var timerLen = timerMinsElement ? parseInt(timerMinsElement.value) : 10
    chrome.tabs.executeScript({code:"window.startTimerMinutes = " + timerLen + ";"});
    chrome.tabs.executeScript({file:"timer.js"});
});
