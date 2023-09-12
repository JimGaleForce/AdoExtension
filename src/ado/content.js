var adoxData;
var adoxChanged = true;
var firstLoaded = false;

function waitFirst() {
  window.setInterval(highLine, 1000);
}

async function loadColors(failed = false) {
  try {
    var data = await chrome.storage.sync.get(['adoxData']);
    adoxData = data.adoxData;

    if (typeof adoxData.isHighlight != 'boolean') {
      adoxData.isHighlight = true;
    }
  } catch {
    failed = true;
  }

  if (typeof adoxData == 'undefined' || adoxData === null) {
    adoxData = {};
    failed = true;
  }

  if (typeof adoxData.epicSort === 'undefined') {
    adoxData.epicSort = 'listedorder';
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

    chrome.storage.sync.set({ adoxData: adoxData });
  }
}

async function highLine() {
  // if this page has no search box, exit
  if (document.getElementsByClassName('search-input').length === 0) {
    return;
  }

  // if localstorage is undefined, load
  if (typeof adoxData == 'undefined' || adoxData === null) {
    await loadColors();
  }

  if (!adoxData.isHighlight) {
    return;
  }

  // get 'something has changed' event
  await chrome.runtime?.sendMessage('adox-check', async was => adoxChanged = was);

  // if changed, change stylesheet to match new colors
  if (adoxChanged) {
    adoxChanged = false;
    await loadColors();
    var styleSheetContent = '';
    for (var i = 0; i < 5; i++) {
      styleSheetContent += `
.adox-line-`+ (i + 1) + ` {
   background-color: `+ adoxData.colors[i] + ` !important;
}
`;
      appendOrReplaceStyleSheet('adoxStyle', styleSheetContent);
    }
  }

  const colors = ['adox-line-1', 'adox-line-2', 'adox-line-3', 'adox-line-4', 'adox-line-5'];

  // get rows from backlog, or tiles from taskboard
  let cellClass = 'bolt-list-cell';
  var rows = document.getElementsByClassName('bolt-list-row');
  if (rows.length === 0) {
    rows = document.getElementsByClassName('taskboard-card');
    if (rows.length > 0) {
      cellClass = 'field-container';
    }
  }

  // if no rows, nothing to do
  if (rows.length === 0) {
    return;
  }

  var r;
  for (r = 0; r < rows.length; r++) {
    var g = rows[r];
    for (var c = 0; c < colors.length; c++) {
      var color = colors[c];
      if (g.classList.contains(color)) {
        g.classList.remove(color);
      }
    }
  }

  // get the search text from the search box
  var wordset = document.getElementsByClassName('search-input')[0].value.toLowerCase();

  // If no text in search box, fall back to config's search text
  if (wordset.length === 0) {
    wordset = adoxData.searchText.toLowerCase();
  }

  // if nothing to search, nothing to do
  if (wordset.length === 0) {
    return;
  }

  // go through all rows or tiles and test against the search text (and/ors/groups)
  for (r = 0; r < rows.length; r++) {
    var row = rows[r];

    var spans = row.getElementsByClassName(cellClass);
    var words = wordset.split(',');
    for (var w = 0; w < words.length; w++) {
      var word = words[w].trim();
      if (word.length > 0) {
        var color = colors[Math.min(4, w)];

        var orwords = word.split('|');
        for (var w3 = 0; w3 < orwords.length; w3++) {
          var orword = orwords[w3];

          var andwords = orword.split('+');
          var validSpans = [];
          for (var w2 = 0; w2 < andwords.length; w2++) {
            var subword = andwords[w2].trim();
            var valid = false;
            for (var s = 0; s < spans.length; s++) {
              if (spans[s].textContent.toLowerCase().indexOf(subword) > -1) {
                validSpans.push(spans[s]);
                valid = true;
              }
            }

            if (!valid) {
              validSpans = [];
              break;
            }
          }

          if (valid) {
            break;
          }
        }

        // if matches search, add the color to the row's classlist (i.e. color the row)
        if (validSpans.length > 0) {
          // todo: colorize the item itself
          // for (var v = 0; v < validSpans.length; v++) {
          //   // validSpans[v].classList.add(color)
          // }

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
