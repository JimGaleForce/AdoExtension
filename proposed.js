
//author: jimgale@microsoft.com
//rev: 1.0 2017-08-25
//rev: 2.0 2022-10-08

//purpose: highlights 'Proposed' tasks in yellow on top of the green/red tfs capacities.
//requires: a query id that matches the current sprint's workitems (or at least ones you want to count).
// (flat list of work items with correct Iteration Path, correct Area Path, and Work Item Type='Task')

//this script reads that named query and highlights Proposed capacities on the current backlog.
//previous backlogs may incorrectly reflect current Proposed capacities.

///-///

var _tfs_counts = [];
var queryId = null;

function zeroCounts() {
  _tfs_counts = [];
}

function updateCounts() {
  getData();
}

function getCountOf(name) {
  for (var j = 0; j < _tfs_counts.length; j++) {
    if (_tfs_counts[j].name === name) {
      return _tfs_counts[j];
    }
  }

  return { name: name, yellow: 0.0, amount: 0.0 };
}

var ic_currentLength = 0;
var ic_time = 4000; //first time
var ic_timeCheck = ic_time;

function ic_checkForChanges() {
  if (typeof queryId === 'undefined' || queryId == null || queryId.length == 0) {
    return;
  }

  updateCounts();
  setTimeout(ic_checkForChanges, ic_time);

  //mod ui
  var table = document.querySelectorAll(".grouped-progress-control > div > div");
  if (table.length > 0) {
    for (var i = 0; i < table.length; i++) {
      var item = table[i];
      var nameitem = item.querySelector(".identity-picker-resolved-name");
      if (nameitem) {
        var name = nameitem.innerText;
        if (name) {
          var current = item.querySelector(".visual-progress-total");
          if (current) {
            for (var j = 0; j < _tfs_counts.length; j++) {
              var tfsitem = _tfs_counts[j];
              if (tfsitem.name.indexOf(name) === 0) {

                var existingProposed = item.querySelector(".visual-progress-proposed");
                if (existingProposed) {
                  existingProposed.parentNode.removeChild(existingProposed);
                }

                existingProposed = document.createElement("div");
                existingProposed.setAttribute('class', 'visual-progress-proposed');

                var percent = (tfsitem.yellow / (tfsitem.amount + tfsitem.yellow)) * 100;
                if (isNaN(percent)) {
                  console.debug(name + ' yellow=' + tfsitem.yellow + ", amount=" + tfsitem.amount);
                }
                existingProposed.setAttribute('style', 'width: ' + percent + "%; background-color: yellow; float: right; height: 18px; opacity: 0.75");

                var existingUnder = item.querySelector(".visual-progress-underallocated");
                if (existingUnder) {
                  existingUnder.appendChild(existingProposed);
                } else {
                  var existingOver = item.querySelector(".visual-progress-total.visual-progress-overallocated");
                  if (existingOver) {
                    existingOver.parentNode.insertBefore(existingProposed, existingOver);
                  }
                }

                break;
              }
            }
          }
        }
      }
    }
  }
}

setTimeout(ic_checkForChanges, 2000);
loadInitialData();

async function loadInitialData() {
  try {
    var data = await chrome.storage.sync.get(['adoxData']);
    queryId = data.adoxData.queryId;
  } catch {
    failed = true;
  }
}

function httpGet(theUrl) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", theUrl, false);
  xmlHttp.send(null);
  return xmlHttp.responseText;
}

function httpGetAsync(callback, theUrl) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
      callback(xmlHttp.responseText);
  }
  xmlHttp.open("GET", theUrl, true);
  xmlHttp.send(null);
}

var urlBase;

function getData() {
  urlBase = document.URL.substring(0, document.URL.indexOf('_'));
  var urlFull = urlBase + "/_apis/wit/queries/" + queryId;
  getQueryId();
}

function getQueryId() {
  var url = urlBase + "/_apis/wit/wiql/" + queryId + "?api-version=2.2";
  httpGetAsync(getDataIds, url);
}

function getDataIds(data) {
  var json = JSON.parse(data);
  var ids = "";
  for (var i = 0; i < json.workItemRelations.length; i++) {
    var item = json.workItemRelations[i];
    if (item.target != null) {
      ids += item.target.id + ",";
    }
  }

  ids = ids.substr(0, ids.length - 1);

  httpGetAsync(getDataCreateTable, urlBase + "/_apis/wit/workitems?ids=" + ids + "&fields=System.State,System.AssignedTo,OSG.RemainingDays&api-version=6.0");
}

var biglist = null;

function getDataCreateTable(list) {
  var listobj = JSON.parse(list);
  biglist = listobj;

  //create table
  var table = [];
  for (var i = 0; i < listobj.value.length; i++) {
    var item = listobj.value[i];

    var name = item.fields["System.AssignedTo"];

    var state = item.fields["System.State"];
    var yellow = state === "Proposed";
    var other = !yellow && state !== "Cut";
    var amount = item.fields["OSG.RemainingDays"];
    if (isNaN(amount)) {
      amount = 0.0;
    }

    var tableitem = null;
    for (var j = 0; j < table.length; j++) {
      if (table[j].name === name.displayName) {
        tableitem = table[j];
        break;
      }
    }

    if (tableitem === null) {
      tableitem = { name: name.displayName, yellow: 0.0, amount: 0.0 };
      table.push(tableitem);
    }

    if (yellow) {
      table[j].yellow += amount;
    } else if (other) {
      table[j].amount += amount;
    }
  }

  //add to _tfs_counts
  for (var ii = 0; ii < table.length; ii++) {
    tableitem = null;
    for (var jj = 0; jj < _tfs_counts.length; jj++) {
      if (_tfs_counts[jj].name === table[ii].name) {
        tableitem = _tfs_counts[jj];
        break;
      }
    }

    if (tableitem === null) {
      tableitem = { name: table[ii].name, yellow: 0.0, amount: 0.0 };
      _tfs_counts.push(tableitem);
    }

    tableitem.yellow = table[ii].yellow;
    tableitem.amount = table[ii].amount;
  }
}