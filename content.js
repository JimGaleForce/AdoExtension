function waitFirst() {
  window.setInterval(highLine, 2000);
}

function highLine() {
  var colors = ['word-highlight-1', 'word-highlight-2', 'word-highlight-3', 'word-highlight-4', 'word-highlight-5'];

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

console.log('ADO word filter active');
waitFirst();