
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
var ic_currentLength = 0;
var ic_time = 4000; //first time
var ic_timeCheck = ic_time;
var biglist = null;
var urlBase;

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

  return createNewTableItem(name);
}

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
      updateBars(nameitem, item)
    }
  }

  table = document.querySelectorAll(".display-text");
  if (table.length > 0) {
    for (var i = 0; i < table.length; i++) {
      var item = table[i].parentNode;
      var nameitem = table[i];
      updateBars(nameitem, item)
    }
  }
}

function updateBars(nameitem, item) {
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

            var existingBugs = item.querySelector(".visual-progress-bugs");
            if (existingBugs) {
              existingBugs.parentNode.removeChild(existingBugs);
            }

            existingProposed = document.createElement("div");
            existingProposed.setAttribute('class', 'visual-progress-proposed');

            existingBugs = document.createElement("div");
            existingBugs.setAttribute('class', 'visual-progress-bugs');

            var proposedPercent = (tfsitem.proposed / (tfsitem.amount + tfsitem.proposed + tfsitem.bug)) * 100;
            if (isNaN(proposedPercent)) {
              console.debug(name + ' yellow=' + tfsitem.proposed + ", amount=" + tfsitem.amount);
            }
            existingProposed.setAttribute('style', 'width: ' + proposedPercent + "%; background-color: yellow; float: right; height: 18px; opacity: 0.75");

            var bugPercent = (tfsitem.bug / (tfsitem.amount + tfsitem.proposed + tfsitem.bug)) * 100;
            if (isNaN(bugPercent)) {
              console.debug(name + ' bug=' + tfsitem.bugPercent + ", amount=" + tfsitem.amount);
            }
            existingBugs.setAttribute('style', 'width: ' + bugPercent + "%; background-color: purple; float: left; height: 18px; opacity: 0.75");

            var existingUnder = item.querySelector(".visual-progress-underallocated");
            if (existingUnder) {
              existingUnder.appendChild(existingProposed);
              existingUnder.appendChild(existingBugs);
            } else {
              var existingOver = item.querySelector(".visual-progress-total.visual-progress-overallocated");
              if (existingOver) {
                existingOver.parentNode.insertBefore(existingProposed, existingOver);
                existingOver.parentNode.insertBefore(existingBugs, existingOver);
              }
            }

            var existingMissing = item.querySelector(".progress-text-missing");
            if (existingMissing) {
              existingMissing.parentNode.removeChild(existingMissing);
            }

            if (tfsitem.missing > 0) {
              existingMissing = document.createElement("div");
              existingMissing.setAttribute('class', 'progress-text-missing');
              existingMissing.textContent = '(' + tfsitem.missing + ' unestimated item' + (tfsitem.missing == 1 ? '' : 's') + ')';
              existingMissing.setAttribute('style', 'display: inline;');

              var container = item.querySelector(".visual-progress-container");
              if (container) {
                container.parentNode.appendChild(existingMissing);
              }
            }


            break;
          }
        }
      }
    }
  }
}

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

  var list = json.workItemRelations ? json.workItemRelations : json.workItems;

  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var target = item.target ? item.target : item;
    if (target != null) {
      ids += target.id + ",";
    }
  }

  ids = ids.substr(0, ids.length - 1);

  httpGetAsync(getDataCreateTable, urlBase + "/_apis/wit/workitems?ids=" + ids + "&fields=System.State,System.AssignedTo,OSG.RemainingDays,System.IterationLevel3,System.WorkItemType,Microsoft.VSTS.CMMI.TaskType&api-version=6.0");
}

function createNewTableItem(name) {
  return { name: name, proposed: 0.0, amount: 0.0, bug: 0.0, missing: 0 };
}

function getDataCreateTable(list) {
  const listobj = JSON.parse(list);
  biglist = listobj;

  //create table
  const table = [];
  const url = decodeURI(document.URL);
  for (var i = 0; i < listobj.value.length; i++) {
    const item = listobj.value[i];

    const iteration = item.fields["System.IterationLevel3"];
    if (url.indexOf(iteration) == -1) {
      continue;
    }

    const name = item.fields["System.AssignedTo"];

    const state = item.fields["System.State"];
    const workitemType = item.fields["System.WorkItemType"];
    const taskType = item.fields["Microsoft.VSTS.CMMI.TaskType"];
    const proposed = state === "Proposed";
    const bug = workitemType === "Bug";
    const isAmountExpected = state === "Proposed" || state === "Active" || state == "Committed" || state == "Started";
    const other = !proposed && !bug && state !== "Cut" && state !== "Closed" && state !== "Resolved";
    let amount = item.fields["OSG.RemainingDays"];
    if (isNaN(amount)) {
      amount = 0.0;
    }

    addToTable(table, name.displayName, proposed, bug, other, isAmountExpected, amount);
    if (typeof taskType != 'undefined') {
      addToTable(table, taskType, proposed, bug, other, isAmountExpected, amount);
    }
    addToTable(table, 'Team', proposed, bug, other, isAmountExpected, amount);
  }

  //add to _tfs_counts
  for (var ii = 0; ii < table.length; ii++) {
    var tableitem = null;
    for (var jj = 0; jj < _tfs_counts.length; jj++) {
      if (_tfs_counts[jj].name === table[ii].name) {
        tableitem = _tfs_counts[jj];
        break;
      }
    }

    if (tableitem === null) {
      tableitem = createNewTableItem(table[ii].name);
      _tfs_counts.push(tableitem);
    }

    tableitem.proposed = table[ii].proposed;
    tableitem.bug = table[ii].bug;
    tableitem.amount = table[ii].amount;
    tableitem.missing = table[ii].missing;
  }
}

function addToTable(table, name, proposed, bug, other, isAmountExpected, amount) {
  var tableitem = null;
  for (var j = 0; j < table.length; j++) {
    if (table[j].name === name) {
      tableitem = table[j];
      break;
    }
  }

  if (tableitem === null) {
    tableitem = createNewTableItem(name);
    table.push(tableitem);
  }

  if (proposed) {
    table[j].proposed += amount;
  } else if (bug) {
    table[j].bug += amount;
  } else if (other) {
    table[j].amount += amount;
  }

  if (isAmountExpected && amount == 0) {
    table[j].missing++;
  }
}

setTimeout(ic_checkForChanges, 2000);
loadInitialData();