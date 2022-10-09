var adoxData;
var adoxChanged = true;

function waitFirst() {
  window.setInterval(highLine, 1000);
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
    adoxData.colors = [
      '#99FF99',
      '#FFFF99',
      '#99FFFF',
      '#9999FF',
      '#FF99FF'
    ];

    chrome.storage.sync.set({ adoxData: adoxData });
  }
}

async function highLine() {
  if (typeof adoxData == 'undefined' || adoxData === null) {
    await loadColors();
  }

  await chrome.runtime.sendMessage('adox-check', async was => adoxChanged = was);

  if (adoxChanged) {
    adoxChanged = false;
    await loadColors();
    var styleSheetContent = '';
    for (var i = 0; i < 5; i++) {
      styleSheetContent += `
.adox-line-`+ (i + 1) + ` {
   background-color: `+ adoxData.colors[i] + `;
}
`;
      appendOrReplaceStyleSheet('adoxStyle', styleSheetContent);
    }
  }

  const colors = ['adox-line-1', 'adox-line-2', 'adox-line-3', 'adox-line-4', 'adox-line-5'];

  var rows = document.getElementsByClassName('grid-row');
  if (rows.length > 0) {
    for (r = 0; r < rows.length; r++) {
      var g = rows[r];
      for (var c = 0; c < colors.length; c++) {
        var color = colors[c];
        if (g.classList.contains(color)) {
          g.classList.remove(color);
        }
      }
    }
  }

  var wordset = document.getElementsByClassName('search-input')[0].value;
  if (wordset.length === 0) {
    return;
  }

  for (r = 0; r < rows.length; r++) {
    var row = rows[r];

    var spans = row.getElementsByClassName('grid-cell');
    var words = wordset.split(',');
    for (var w = 0; w < words.length; w++) {
      var word = words[w].trim();
      if (word.length > 0) {
        var color = colors[Math.min(4, w)];
        var andwords = word.split('+');
        var validSpans = [];
        for (var w2 = 0; w2 < andwords.length; w2++) {
          var subword = andwords[w2].trim();
          var valid = false;
          for (var s = 0; s < spans.length; s++) {
            if (spans[s].textContent.indexOf(subword) > -1) {
              validSpans.push(spans[s]);
              valid = true;
            }
          }

          if (!valid) {
            validSpans = [];
            break;
          }
        }

        if (validSpans.length > 0) {
          for (var v = 0; v < validSpans.length; v++) {
            // validSpans[v].classList.add(color)

          }

          row.classList.add(color);
        }
      }
    }
  }
}

// Appends CSS content to the head of the site
function appendOrReplaceStyleSheet(id, content) {
  var existing = document.querySelector("#" + id);
  var head = document.head || document.getElementsByTagName("head")[0];
  if (existing) {
    head.removeChild(existing);
  }

  head.appendChild(createStyleElement(id, content));
}

// Creates the style element
function createStyleElement(id, content) {
  var style = document.createElement("style");
  style.type = "text/css";
  style.id = id;

  if (style.styleSheet) {
    style.styleSheet.cssText = content;
  } else {
    style.appendChild(document.createTextNode(content));
  }
  return style;
}

console.log('ADO word filter active');
waitFirst();
