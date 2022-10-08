'use script';

function saveColors(event) {
  getColors(function (adox) {
    var colors = [];
    for (var i = 0; i < 5; i++) {
      colors[i] = document.getElementById('color' + (i + 1)).value;
    }

    chrome.runtime.sendMessage({ cmd: 'savecolors', colors: colors }, (response) => {
      window.close();
    });
  })
}

function getColors(then) {
  chrome.runtime.sendMessage({ cmd: 'getcolors' }, (response) => {
    then(response);
  });
}

function resetColors() {
  chrome.runtime.sendMessage({ cmd: 'resetcolors' }, (response) => {
    loadColorsIntoBoxes();
  });
}

function closeWindow() {
  window.close();
}

function loadColorsIntoBoxes() {
  getColors((adox) => {
    for (var i = 0; i < 5; i++) {
      document.getElementById('color' + (i + 1)).value = adox.colors[i];
    }
  })
}

loadColorsIntoBoxes();
document.getElementById('adox-save').addEventListener('click', saveColors);
document.getElementById('adox-cancel').addEventListener('click', closeWindow);
document.getElementById('adox-reset').addEventListener('click', resetColors);