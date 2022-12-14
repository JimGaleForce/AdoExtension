'use script';
var adoxData;
async function saveColors(event) {
  var data = await chrome.storage.sync.get(['adoxData']);
  adoxData = data.adoxData;

  for (var i = 0; i < 5; i++) {
    adoxData.colors[i] = document.getElementById('color' + (i + 1)).value;
  }

  adoxData.queryId = document.getElementById('queryId').value;

  await chrome.storage.sync.set({ adoxData: adoxData });
  await chrome.runtime.sendMessage('adox-colors-updated', async _ => { });
  window.close();
}

async function loadColors(failed = false) {
  try {
    var data = await chrome.storage.sync.get(['adoxData']);
    adoxData = data.adoxData;
  } catch {
    failed = true;
  }

  if (typeof adoxData == 'undefined' || adoxData === null) {
    adoxData = {};
    failed = true;
  }

  if (typeof adoxData.queryId === 'undefined') {
    adoxData.queryId = '';
  }

  if (failed || typeof adoxData.colors === 'undefined') {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // dark mode
      adoxData.colors = [
        '#003300',
        '#333300',
        '#330000',
        '#000033',
        '#003333'
      ];

    } else {
      adoxData.colors = [
        '#ccFFcc',
        '#FFFFcc',
        '#FFcccc',
        '#ccccFF',
        '#ccFFFF'
      ];
    }

    await chrome.storage.sync.set({ adoxData: adoxData });
    await chrome.runtime.sendMessage('adox-colors-updated', async _ => { });
  }
}

async function resetColors() {
  await loadColors(true);
  await loadColorsIntoBoxes();
}

function closeWindow() {
  window.close();
}

async function loadColorsIntoBoxes() {
  var data = await chrome.storage.sync.get(['adoxData']);
  adoxData = data.adoxData;

  for (var i = 0; i < 5; i++) {
    document.getElementById('color' + (i + 1)).value = adoxData.colors[i];
  }

  document.getElementById('queryId').value = adoxData.queryId;
}

loadColorsIntoBoxes();
document.getElementById('adox-save').addEventListener('click', saveColors);
document.getElementById('adox-cancel').addEventListener('click', closeWindow);
document.getElementById('adox-reset').addEventListener('click', resetColors);