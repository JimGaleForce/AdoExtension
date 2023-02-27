var items = [];
var epicQueryId = null;
var epicSort = 'listedorder';
var urlBase2;
var adox = null;

async function loadData() {
  if (epicQueryId === null || epicQueryId.length === 0) {
    console.log('no epicQueryId found');
    return;
  }

  var urlFull = urlBase2 + "_apis/wit/wiql/" + epicQueryId;
  await httpGetAsync2(loadKRquery, urlFull);

}

function newtitem(id) {
  return {
    id: id, links: [], backlinks: [], remainingDays: 0,
    proposed: 0, bug: 0, other: 0, _remainingDays: 0,
    _proposed: 0, _bug: 0, _other: 0, amount: 0, _amount: 0,
    missing: 0, type: null, state: null, order: 0, orderId: 0
  };
}

async function loadKRquery(data) {
  var json = JSON.parse(data);
  var ids = "";

  var list = json.workItemRelations ? json.workItemRelations : json.workItems;

  var len = list.length; // Math.min(10, list.length);
  var count = 0;
  var flipCount = 0;
  for (var i = 0; i < len; i++) {
    var listitem = list[i];

    if (listitem.source != null) {
      var item = items[listitem.source.id];
      if (typeof item === 'undefined') {
        item = newtitem(listitem.source.id);
        item.order = count;
        ids += (ids.length > 0 ? "," : "") + listitem.source.id;
        count++;
        flipCount++;
        items[listitem.source.id] = item;
      }

      if (listitem.target != null) {
        item.links.push(listitem.target.id);
      }
    }

    if (listitem.target != null) {
      var item = items[listitem.target.id];
      if (typeof item === 'undefined') {
        item = newtitem(listitem.target.id);
        item.order = count;
        ids += (ids.length > 0 ? "," : "") + listitem.target.id;
        count++;
        flipCount++;
        items[listitem.target.id] = item;
      }

      if (listitem.source != null) {
        item.backlinks.push(listitem.source.id);
      }
    }

    // todo: get id info per 100 items
    if (flipCount >= 100 || (flipCount > 0 && i == len - 1)) {
      overall++;
      await httpGetAsync2(getKRDataCreateTable, urlBase2 + "_apis/wit/workitems?ids=" + ids +
        "&fields=System.Id,System.State,System.AssignedTo,OSG.RemainingDays,System.IterationLevel3," +
        "System.IterationPath,System.Title," +
        "System.WorkItemType,Microsoft.VSTS.CMMI.TaskType,Microsoft.VSTS.Scheduling.StartDate," +
        "Microsoft.VSTS.Scheduling.DueDate,Microsoft.VSTS.Scheduling.OriginalEstimate," +
        "OSG.RemainingDevDays,Microsoft.VSTS.Common.StackRank,Microsoft.VSTS.Common.BacklogPriority&api-version=6.0");
      ids = "";
      flipCount = 0;
    }

  }

  tick = window.setInterval(checkOverall, 100);
}

function checkOverall() {
  if (overall > 0) {
    return;
  }

  window.clearInterval(tick);
  rollUp();

  overall2++;
  getIterations();
  tick2 = window.setInterval(checkOverall2, 100);
}

async function checkOverall2() {
  if (overall2 > 0) {
    return;
  }

  window.clearInterval(tick2);

  // overall3 = iterations.length;
  // for (var i = 0; i < iterations.length; i++) {
  //   const iter = iterations[i];
  //   var url = 'https://microsoft.visualstudio.com/Edge/cea6b33d-07fa-4fc1-80ce-901febc2047b/_apis/work/teamsettings/iterations/' + iterations[i].id + '/capacities?api-version=6.0';
  //   await httpGetAsync2(data => getCapacityData(data, iter), url);
  // }

  tick3 = window.setInterval(checkOverall3, 100);
}

function checkOverall3() {
  if (overall3 > 0) {
    return;
  }

  window.clearInterval(tick3);

  schedule();
  addTabPage();
}

function addTabPage() {
  var pivotBar = document.getElementsByClassName('vss-HubHeader')[0];
  if (typeof pivotBar === 'undefined') {
    return;
  }

  var tab = document.createElement('span');
  tab.innerHTML = '<button id="newpage-btn">Graph Timeline</button>';
  pivotBar.appendChild(tab);
  window.setTimeout(() => {
    document.getElementById('newpage-btn').addEventListener('click', e => createTimeGraphs(e)); //newpage
  }, 250);
}

function newpage(event) {
  var content = document.getElementsByClassName('vss-PivotBar--content')[0];
  content.setAttribute('class', 'vss-PivotBar--content x-hide');
  loadFile(chrome.runtime.getURL('timeline.html'), afterLoadNew);
}

function loadFile(filename, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', filename, true);
  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;
    if (this.status !== 200) return; // or whatever error handling you want
    var parent = document.getElementsByClassName('vss-PivotBar')[0];
    var tab = document.createElement('span');
    tab.innerHTML = this.responseText;
    parent.appendChild(tab);
    callback();
  };
  xhr.send();
}

function getPerson(name) {
  var keys = Object.keys(people);
  for (var i = 0; i < keys.length; i++) {
    if (people[keys[i]].displayName === name) {
      return people[keys[i]].id;
    }
  }

  return null;
}

function afterLoadNew() {
  var grid = document.getElementById('tl-body');

  var id = getPerson('Jim Gale');

  //var id = people.filter(p => p.displayName === 'Jim Gale')[0].id;
  var sb = '';
  var xitems = items.filter(i => i.links.length === 0 && i.assignedTo.id === id).sort((a, b) => a._startDate - b._startDate).map(
    item => {
      sb += '<tr class="trow"><td class="tcell">' + item._startDate.toDateString() + '</td><td class="tcell">' + item._endDate.toDateString() + '</td><td class="tcell">' + Math.round(100 * item._remainingDays) / 100 + '</td><td class="tcell">' + item.title + '</td></tr>';
    }
  )

  grid.innerHTML = sb;
}

function nextWorkDate(date, days) {
  while (date.getDay() % 6 === 0) {
    date = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  }

  date = new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

  while (date.getDay() % 6 === 0) {
    date = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  }

  return date;
}

// function getTopPri(item) {
//   if (item.backlinks.length > 0) {
//     item = items[item.backlinks[0]];
//     var ord = getTopPri(item);
//     item._order = ord;
//   }

//   return item.order;
// }
var people = [];

function getScenarioTitleFromEpic(a, prevTitle) {
  if (a.backlinks.length === 0) {
    return prevTitle;
  }
  return getScenarioTitle(items[a.backlinks[0]], a.title);
}

function getScenarioTitle(a) {
  if (a.backlinks.length === 0) {
    return a.title;
  }
  return getScenarioTitle(items[a.backlinks[0]]);
}

function scenarioOrder(a, b) {
  debugger;
  var aTitle = getScenarioTitle(a) ?? '';
  var bTitle = getScenarioTitle(b) ?? '';
  var result = aTitle.localeCompare(bTitle);

  // console.log(result + '=' + aTitle + ',' + bTitle);

  return result;
}

function schedule() {
  // assign due dates per iteration's end times for each item (MIN of parent's due dates or self)
  var workItems = items.filter(i => i.links.length === 0);
  var maxDate = new Date('2050-01-01');
  items.map(i => {

    if (i.id === 40465838) {
      console.log(i.dueDate);
    }

    var minDate = getMinDate(i, null);
    i._dueDate = new Date(minDate === null ? maxDate : minDate);
    //i._order = getTopPri(i);
  });

  // sort all items by due date
  var minDate = nextWorkDate(new Date(), 0);
  var xitems = items.filter(i => i.links.length === 0);
  switch (epicSort) {
    case 'duedate':
      xitems = xitems.sort((a, b) => a._dueDate - b._dueDate);
      break;
    case 'scenario':
      xitems = xitems.sort((a, b) => scenarioOrder(a, b));
      break;
    case 'listedorder':
      xitems = xitems.sort((a, b) => a.order - b.order);
      break;
    case 'listedorder':
      xitems = xitems.sort((a, b) => a.orderId - b.orderId);
      break;
  }

  xitems.map(item => {
    // from the top, start adding up time, per person, per capacity
    var assignedTo = item.assignedTo;
    var id = assignedTo.id;
    if (typeof people[id] === 'undefined') {
      people[id] = assignedTo;
      people[id]._date = new Date(minDate);
    }

    item._startDate = new Date(people[id]._date);
    var date = nextWorkDate(new Date(people[id]._date), item.remainingDays / 0.8);
    item._endDate = new Date(date);
    people[id]._date = date;

    // roll up MAX due dates to parents
    rollUpMax(item, new Date(date), new Date(item._startDate))
  });

  // next - scroll through all rows, find id, and populate columns with new date data. colorize.
  popTick = window.setInterval(populate, 2000);

  //debugger;
}

var header = [];
var idIndex = -1;
var startDateIndex = -1;
var dueDateIndex = -1;
var acceptedDateIndex = -1;
var remainingDaysIndex = -1;
var orderIndex = -1;
var isPopulated = false;
var isGoodView = true;
var popTick = 0;
var acceptedDateColumn = null;
const aDateName = 'Activated Date';

function populate() {
  if (isPopulated || !isGoodView) {
    window.clearInterval(popTick);
    return;
  }

  var headerElem = document.getElementsByClassName('grid-header-column');

  if (headerElem.length === 0) {
    return;
  }

  if (header.length === 0) {
    for (var i = 0; i < headerElem.length; i++) {
      header.push(headerElem[i].textContent);
    }

    idIndex = header.indexOf('ID');
    startDateIndex = header.indexOf('Start Date');
    dueDateIndex = header.indexOf('Due Date');
    acceptedDateIndex = header.indexOf(aDateName);
    remainingDaysIndex = header.indexOf('Remaining Days');
    orderIndex = header.indexOf('Order');
  }

  acceptedDateColumn = headerElem[acceptedDateIndex];

  if (acceptedDateIndex == -1 || remainingDaysIndex == -1 || startDateIndex == -1 || dueDateIndex == -1) {
    isGoodView = false;
    return;
  }

  var canvas = document.getElementsByClassName('grid-canvas')[0];
  if (typeof canvas === 'undefined') {
    return;
  }

  var rows = canvas.getElementsByClassName('grid-row');
  if (rows.length === 0) {
    return;
  }

  for (var i = 0; i < rows.length; i++) {
    var cols = rows[i].getElementsByClassName('grid-cell');
    var id = cols[idIndex].textContent;
    var item = items[id];
    if (typeof item === 'undefined') {
      continue;
    }

    var isFuture = item._dueDate.getYear() + 1900 > 2047;
    createChildItem(cols[startDateIndex], item._startDate.getYear() + 1900 > 2047 ? 'FUTURE' : item._startDate.toDateString(), item._dueDate < item._startDate ? 'date-overdue' : 'date-under', item.links.length === 0);
    createChildItem(cols[dueDateIndex], item._dueDate.getYear() + 1900 > 2047 ? 'FUTURE' : item._dueDate.toDateString(), '', item.links.length === 0);
    createChildItem(cols[acceptedDateIndex], item._endDate.getYear() + 1900 > 2047 ? 'FUTURE' : item._endDate.toDateString(), item._dueDate < item._endDate ? 'date-overdue' : 'date-under', item.links.length === 0);
    createChildItem(cols[remainingDaysIndex], Math.round(100 * item._remainingDays) / 100, item._remainingDays == 0 && !isFuture ? 'days-zero' : 'days-nonzero', item.links.length === 0);

    if (orderIndex > -1) {
      cols[orderIndex].textContent = item.order;
    }
  }

  var titleElem = acceptedDateColumn.getElementsByClassName('title')[0];
  titleElem.textContent = 'End Date';

  // isPopulated = true;
}

function createChildItem(elem, str, classx, isWorkItem) {
  var div = document.createElement('div');

  classx += isWorkItem ? ' workitem' : ' owner';

  div.setAttribute('class', classx);
  div.textContent = str;
  elem.innerHTML = '';
  elem.appendChild(div);
}

function rollUpMax(item, date, startDate) {
  if (item.backlinks.length > 0) {
    for (var i = 0; i < item.backlinks.length; i++) {
      var bi = items[item.backlinks[i]];
      if (typeof bi._endDate === 'undefined' || bi._endDate < date) {
        bi._endDate = date;
      }

      if (typeof bi._startDate === 'undefined' || bi._startDate > startDate) {
        bi._startDate = startDate;
      }

      rollUpMax(bi, date, startDate);
    }
  }
}

function getMinDate(item, minDate) {
  var iterationPath = item.iteration;
  var iteration = iterations.filter(ix => ix.path === iterationPath)[0];
  if (typeof iteration != 'undefined' && iteration.attributes.finishDate != null) {
    var date = new Date(Date.parse(iteration.attributes.finishDate));
    if (minDate === null || minDate > date) {
      // console.log('changed ' + minDate + ' to ' + date);
      minDate = date;
    }
  }

  for (var i = 0; i < item.backlinks.length; i++) {
    minDate = getMinDate(items[item.backlinks[i]], minDate);
  }

  return minDate;
}

var tick3 = 0;
var overall3 = 0;

function getCapacityData(data, iteration) {
  const listobj = JSON.parse(data);
  iteration.people = listobj.value;
  overall3--;
}

var overall = 0;
var tick = 0;

var overall2 = 0;
var tick2 = 0;

async function getIterations() {
  if (iterations.length === 0) {
    const url = urlBase2 + adox.team + "/_apis/work/teamsettings/iterations?$expand=workItems&api-version=6.1-preview.1";
    await httpGetAsync2(getIterationData, url);
    //https://microsoft.visualstudio.com/Edge/Feedback%20and%20Diagnostics/_apis/work/teamsettings/iterations?$expand=workItems&api-version=6.1-preview.1
  }
}

var iterations = [];

function getIterationData(list) {
  const listobj = JSON.parse(list);
  for (var i = 0; i < listobj.value.length; i++) {
    const item = listobj.value[i];
    if (item.attributes.timeFrame != 'past') {
      iterations.push(item);
    }
  }

  overall2--;
}

//  ids = ids.substr(0, ids.length - 1);

//  httpGetAsync(getDataCreateTable, urlBase + "/_apis/wit/workitems?ids=" + ids + "&fields=System.State,System.AssignedTo,OSG.RemainingDays,System.IterationLevel3,System.WorkItemType,Microsoft.VSTS.CMMI.TaskType&api-version=6.0");
//}

//https://microsoft.visualstudio.com/Edge/cea6b33d-07fa-4fc1-80ce-901febc2047b/_apis/work/teamsettings/iterations/d932bdd2-25a3-476a-bca3-8d1b3f09974a/capacities?api-version=6.0

function rollUp() {
  var keys = Object.keys(items);
  for (var i = 0; i < keys.length; i++) {
    var item = items[keys[i]];
    if (item.remainingDays > 0) {
      rollUpValues(item, item.amount, item.remainingDays, item.proposed, item.bug);
    }
  }
}

function httpGet2(theUrl) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", theUrl, false);
  xmlHttp.send(null);
  return xmlHttp.responseText;
}

// function executeWiqlQuery(query, organization, project, pat) {
//   // Set up the API endpoint and authentication
//   const url = urlBase2 + adox.team + "/_apis/wit/wiql?api-version=6.0";
// //  var headers = { 'Content-Type': 'application/json' };
// //  var auth = `:${pat}`;

//   // Define the query parameters as a JSON object
//   var params = { query: query };

//   // Send the request to execute the query
//   var xhr = new XMLHttpRequest();
//   xhr.open('POST', url, false);
// //  xhr.setRequestHeader('Authorization', 'Basic ' + btoa(auth));
//   xhr.setRequestHeader('Content-Type', 'application/json');
//   xhr.send(JSON.stringify(params));

//   // Parse the response JSON
//   var response = JSON.parse(xhr.responseText);
//   return response.workItems;
// }

function getKRDataCreateTable(list) {
  const listobj = JSON.parse(list);

  //create table
  const table = [];
  const url = decodeURI(document.URL);
  for (var i = 0; i < listobj.value.length; i++) {
    const item = listobj.value[i];

    const name = item.fields["System.AssignedTo"];
    const id = item.fields["System.Id"];

    const state = item.fields["System.State"];
    const workitemType = item.fields["System.WorkItemType"];
    const taskType = item.fields["Microsoft.VSTS.CMMI.TaskType"];
    const proposed = state === "Proposed";
    const bug = workitemType === "Bug";
    const isAmountExpected = state === "Proposed" || state === "Active" || state == "Committed" || state == "Started";
    const other = !proposed && !bug && state !== "Cut" && state !== "Closed" && state !== "Resolved";
    let amount = item.fields["OSG.RemainingDays"];
    if (isNaN(amount)) {
      amount = item.fields["OSG.RemainingDevDays"];
    }
    if (isNaN(amount)) {
      amount = item.fields["Microsoft.VSTS.Scheduling.OriginalEstimate"];
    }
    if (isNaN(amount)) {
      amount = 0.0;
    }

    var tItem = items[id];
    if (tItem.links.length === 0) {
      tItem.remainingDays = amount;
      tItem.proposed = proposed ? amount : 0;
      tItem.bug = bug ? amount : 0;
      tItem.amount = other ? amount : 0;
    }

    tItem.startDate = item.fields["Microsoft.VSTS.Scheduling.StartDate"];
    tItem.dueDate = item.fields["Microsoft.VSTS.Scheduling.DueDate"];
    tItem.iteration = item.fields["System.IterationPath"];
    tItem.assignedTo = name;
    tItem.type = taskType;
    tItem.state = state;
    tItem.orderId = item.fields["OSG.Order"];
    tItem.title = item.fields["System.Title"];

    if (isAmountExpected && amount == 0) {
      tItem.missing = 1;
    }
    // addAndRollUp(tItem, amount, proposed ? amount : 0, bug ? amount : 0, other ? amount : 0, 0);
  }

  overall--;
}

function rollUpValues(tItem, amount, remainingDays, proposed, bug) {
  tItem._amount += amount;
  tItem._remainingDays += remainingDays;
  tItem._proposed += proposed;
  tItem._bug += bug;

  for (var i = 0; i < tItem.backlinks.length; i++) {
    if (items[tItem.backlinks[i]]) {
      rollUpValues(items[tItem.backlinks[i]], amount, remainingDays, proposed, bug);
    }
  }
}

async function httpGetAsync2(callback, theUrl) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = async () => {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
      await callback(xmlHttp.responseText);
  }
  xmlHttp.open("GET", theUrl, true);
  xmlHttp.send(null);
}

async function httpPostAsync2(callback, theUrl, data) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = async () => {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
      await callback(xmlHttp.responseText);
  }
  xmlHttp.open("POST", theUrl, true);
  xmlHttp.setRequestHeader("Content-type", "application/json");
  xmlHttp.send(JSON.stringify(data));
}

function createTimeGraphs(event) {
  var startDate = new Date(Date.parse('2022-10-24'));
  var endDate = new Date(Date.parse('2022-12-24'));

  var set = [];
  var keys = Object.keys(people);
  var lastDate = startDate;
  var maxDays = 0;
  for (var ip = 0; ip < keys.length; ip++) {
    var person = people[keys[ip]];

    var pItems = items.filter(i => i._startDate >= startDate && i._dueDate <= endDate && i.assignedTo.id === person.id && i.links.length === 0).sort((a, b) => a._startDate - b._startDate);
    var ikeys = Object.keys(pItems);
    var totalDays = 0;
    for (var ii = 0; ii < ikeys.length; ii++) {
      totalDays += pItems[ikeys[ii]].remainingDays;
    }

    set.push({ person: person, items: pItems, totalDays: totalDays });
    if (pItems.length > 0 && pItems[pItems.length - 1]._dueDate > lastDate) {
      lastDate = pItems[pItems.length - 1]._dueDate;
    }

    if (maxDays < totalDays) {
      maxDays = totalDays;
    }
  }

  var sb = '<div class="people">';
  for (var ix = 0; ix < set.length; ix++) {
    var setitem = set[ix];
    var pItems = setitem.items;
    var ikeys = Object.keys(pItems);
    var currentDays = 0;
    var currentIteration = ''
    var currentIterationIndex = -1;
    sb += '<div class="person-group">';
    sb += '<div class="person-name">' + setitem.person.displayName + '</div>';
    sb += '</div><div class="person-group">';
    for (var ii = 0; ii < ikeys.length; ii++) {
      var pItem = pItems[ikeys[ii]];
      pItem._percentStart = currentDays / maxDays;
      pItem._percentLen = pItem.remainingDays / maxDays;
      pItem._percentEnd = (currentDays + pItem.remainingDays) / maxDays;

      if (pItem.iteration !== currentIteration) {
        currentIteration = pItem.iteration;
        currentIterationIndex++;
      }

      pItem._percentLine = currentIterationIndex;
      sb += '<span class="person-cell" style="width:' + (pItem._percentLen * 100) + '%;"></span>';
    }
    sb += '</div>';
  }
  sb += '</div>';

  var content = document.getElementsByClassName('vss-PivotBar--content')[0];
  content.setAttribute('class', 'vss-PivotBar--content x-hide');
  loadFile(chrome.runtime.getURL('timeline.html'), _ => afterLoadGraph(sb));
}

function afterLoadGraph(sb) {
  var grid = document.getElementById('content');
  grid.innerHTML = sb;
}

async function loadInitialTimelineData() {
  try {
    console.log('loading in timeline');
    urlBase2 = document.URL.substring(0, document.URL.indexOf('_'));
    var data = await chrome.storage.sync.get(['adoxData']);
    adox = data.adoxData;
    epicQueryId = data.adoxData.epicQueryId;
    console.log('loaded:' + epicQueryId);
    epicSort = data.adoxData.epicSort ?? 'duedate';
    loadData();
  } catch (e) {
    console.error(e);
  }
}

loadInitialTimelineData();
