function makeOverlayDiv() {
    var node = document.createElement("div");
    var nodeId = 'overlayTimer';
    node.id = nodeId;
    node.style.position = 'fixed';
    node.style.top = '10px'; 
    node.style.right = '400px'; 
    node.style.borderStyle = 'solid';
    node.style.borderWidth = '2px';
    node.style.borderColor = 'black';
    node.style.backgroundColor = 'white';
    node.style.padding = '10px';
    node.innerHTML = '<div style="display: inline-block"><span class="hours"></span></div> : ' + 
                     '<div style="display: inline-block"><span class="minutes"></span></div> : ' + 
                     '<div style="display: inline-block"><span class="seconds"></span></div>';

    // Technically higher than the max signed positive integer but seems to work somehow
    node.style.zIndex = '2147483647';
    var existingNode = document.getElementById(nodeId);
    if (existingNode)
        existingNode.parentNode.removeChild(existingNode);
    //document.body.insertBefore(node, document.body.firstChild);
    document.body.appendChild(node);
}

function getTimeRemaining(endtime) {
    var t = Date.parse(endtime) - Date.parse(new Date());
    var seconds = Math.floor((t / 1000) % 60);
    var minutes = Math.floor((t / 1000 / 60) % 60);
    var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
    var days = Math.floor(t / (1000 * 60 * 60 * 24));
    return {
        'total': t,
        'days': days,
        'hours': hours,
        'minutes': minutes,
        'seconds': seconds
    };
}

function initializeClock(id, endtime) {
    var clock = document.getElementById(id);
    var daysSpan = clock.querySelector('.days');
    var hoursSpan = clock.querySelector('.hours');
    var minutesSpan = clock.querySelector('.minutes');
    var secondsSpan = clock.querySelector('.seconds');

    function updateClock() {
        var t = getTimeRemaining(endtime);

        if (daysSpan) daysSpan.innerHTML = t.days;
        hoursSpan.innerHTML = ('0' + t.hours).slice(-2);
        minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
        secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);

        if (t.total <= 0) {
          clearInterval(timeinterval);
        }
    }

    updateClock();
    var timeinterval = setInterval(updateClock, 1000);
}

document.addEventListener("fullscreenchange", function (event) {
    if (document.fullscreenElement) {
        console.log("Gone full screen", document.fullscreenElement);
        // fullscreen is activated
    } else {
        // fullscreen is cancelled
        console.log("Left full screen", document.fullscreenElement);
    }
});

makeOverlayDiv();
var deadline = new Date(Date.parse(new Date()) + 15 * 60 * 1000);
initializeClock('overlayTimer', deadline);

var timerDebug = document.getElementById("overlayTimer");
var timerDebugPreso = document.querySelector(".punch-full-screen-element");
