//author: jimgale@microsoft.com
//rev: 1.0 2017-08-25
//rev: 2.0 2022-10-08
//rev: 2.1 2023-02-27

import { ExtractTeam, getIterationsX } from "../api";

//purpose: highlights 'Proposed' tasks in yellow on top of the green/red tfs capacities.
//requires: a query id that matches the current sprint's workitems (or at least ones you want to count).
// (flat list of work items with correct Iteration Path, correct Area Path, and Work Item Type='Task')

//this script reads that named query and highlights Proposed capacities on the current backlog.
//previous backlogs may incorrectly reflect current Proposed capacities.

///-///

// @ts-ignore: valid import
import mainWorld from "../is-new-ado-main-world?script&module";

const script = document.createElement("script");
script.src = chrome.runtime.getURL(mainWorld);
script.type = "module";
script.addEventListener("load", () => {
    console.log("script loaded");
});
script.addEventListener("error", (err) => {
    console.log("script error");
    console.error(err);
});

console.log("starting script");
document.head.append(script);

var isNewAdoHub = false;
var initialized = false;
document.addEventListener('getIsNewAdoHub', function (e: any) {
  isNewAdoHub = e.detail;
  initialized = true;
});

export class Proposed {
  private _tfs_counts: any[] = [];
  private ic_currentLength = 0;
  private ic_time = 4000;
  private ic_timeCheck = 4000;
  private biglist = null;
  private urlBase = '';
  private tableitem: any = null;
  private iterations: any[] = [];
  private overall2 = 0;
  private adox: any = null;

  constructor() {
    this.loadInitialData().then(() => this.init());
  }

  public start() {
    this.ic_checkForChanges();
    console.log('startedx');
  }
    
  private async loadInitialData() {
    try {
      this.urlBase = document.URL.substring(0, document.URL.indexOf('_'));
      var data = await chrome.storage.sync.get(['adoxData']);
      this.adox = data.adoxData;
      if (typeof this.adox.isProposed != 'boolean') {
        this.adox.isProposed = true;
      }

    } catch {
    }
  }
  
  private async init() {
    const team = ExtractTeam(this.adox);
    await getIterationsX.call(this, this.urlBase + team, (data:any) => this.getIterationData(data) )
  }

  private getIterationData(list: any) {
    const listobj = JSON.parse(list);
    for (var i = 0; i < listobj.value.length; i++) {
      const item = listobj.value[i];
      if (item.attributes.timeFrame != 'past') {
        this.iterations.push(item);
      }
    }
  
    this.overall2--;
  }

  private zeroCounts() {
    this._tfs_counts = [];
  }
  
  private updateCounts() {
    this.getData();
  }
  
  private getCountOf(name: any) {
    for (var j = 0; j < this._tfs_counts.length; j++) {
      if (this._tfs_counts[j].name === name) {
        return this._tfs_counts[j];
      }
    }
  
    return this.createNewTableItem(name);
  }
  
  private ic_checkForChanges() {
    if (!this.adox.isProposed) {
      setTimeout(() => this.ic_checkForChanges(), this.ic_time);
      return;
    }

    this.updateCounts();
    setTimeout(() => this.ic_checkForChanges(), this.ic_time);
  
    // Table represents all elements on the sidebar that encompass the capacity of a person.
    var table = isNewAdoHub ?
      document.querySelectorAll("td > .bolt-list-cell-content > div:has(div.work-details-progress-bar-container)") :
      document.querySelectorAll(".grouped-progress-control > div > div");

    if (table.length > 0) {
      for (var i = 0; i < table.length; i++) {
        var item = table[i];
        // For each element, grab the name of the person.
        var nameitem = isNewAdoHub ? 
          item.querySelector("div > div > div") :
          item.querySelector(".identity-picker-resolved-name");

        this.updateBars(nameitem, item)
      }
    }
  
    table = document.querySelectorAll(".display-text");
    if (table.length > 0) {
      for (var i = 0; i < table.length; i++) {
        const item = table[i].parentNode as Element;
        const nameitem = table[i];
        this.updateBars(nameitem, item)
      }
    }
  }
  
  private updateBars(nameitem: Element | any | null, item: Element) {
    if (nameitem) {
      var name = nameitem.innerText;
      if (name) {
        // visual-progress-total is the black bar that represents the total capacity of a person.
        var current = isNewAdoHub ?
          item.querySelector(".work-details-total-mark") :
          item.querySelector(".visual-progress-total");

        if (current) {
          for (var j = 0; j < this._tfs_counts.length; j++) {
            var tfsitem = this._tfs_counts[j];
            if (tfsitem.name.indexOf(name) === 0) {
              var existingProposed = item.querySelector(".visual-progress-proposed") as Element;
              if (existingProposed && existingProposed.parentNode) {
                existingProposed.parentNode.removeChild(existingProposed);
              }
  
              var existingBugs = item.querySelector(".visual-progress-bugs");
              if (existingBugs && existingBugs.parentNode) {
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
  
              var existingUnder = isNewAdoHub ?
                item.querySelector(".under-capacity") :
                item.querySelector(".visual-progress-underallocated");

              if (existingUnder) {
                existingUnder.appendChild(existingProposed);
                existingUnder.appendChild(existingBugs);
              } else {
                var existingOver = isNewAdoHub ?
                  item.querySelector(".over-capacity") :
                  item.querySelector(".visual-progress-total.visual-progress-overallocated");

                if (existingOver && existingOver.parentNode) {
                  if (isNewAdoHub) {
                    existingOver.insertBefore(existingProposed, existingOver.firstChild);
                    existingOver.insertBefore(existingBugs, existingOver.firstChild);
                  } else {
                    existingOver.parentNode.insertBefore(existingProposed, existingOver);
                    existingOver.parentNode.insertBefore(existingBugs, existingOver)
                  }
                }
              }
  
              var existingMissing = item.querySelector(".progress-text-missing");
              if (existingMissing && existingMissing.parentNode) {
                existingMissing.parentNode.removeChild(existingMissing);
              }
  
              var container = isNewAdoHub ? item.querySelector("div:not([class]):not(:has(div))") : item.querySelector(".visual-progress-container");
              if (tfsitem.missing > 0) {
                existingMissing = document.createElement("div");
                existingMissing.setAttribute('class', 'progress-text-missing');
                existingMissing.textContent = '(' + tfsitem.missing + ' unestimated item' + (tfsitem.missing == 1 ? '' : 's') + ')';
                existingMissing.setAttribute('style', 'display: inline;');
  
                if (container && container.parentNode) {
                  container.parentNode.appendChild(existingMissing);
                }
              }
  
              if (container) {
                var completed = item.querySelector('.progress-completed-fullbar');
                if (completed && completed.parentNode) {
                  completed.parentNode.removeChild(completed);
                }
  
                completed = document.createElement("div");
                completed.setAttribute('class', 'progress-completed-fullbar');
                // completed.setAttribute('style', 'width: ' + 100 + "%; background-color: green; height: 18px; opacity: 0.75");
                if (container && container.parentNode) {
                  container.parentNode.appendChild(completed);
                }
  
                var fullyCompletedPercent = (tfsitem.fullyCompleted / tfsitem.costOrOriginal) * 100;
                var partiallyCompletedPercent = (tfsitem.partiallyCompleted / tfsitem.costOrOriginal) * 100;
  
                var fcpDiv = document.createElement("div");
                fcpDiv.setAttribute('class', 'progress-completed-full');
                fcpDiv.setAttribute('style', 'width: ' + fullyCompletedPercent + '%;');
                completed.appendChild(fcpDiv);
  
                var pcpDiv = document.createElement("div");
                pcpDiv.setAttribute('class', 'progress-completed-partial');
                pcpDiv.setAttribute('style', 'width: ' + partiallyCompletedPercent + '%;');
                completed.appendChild(pcpDiv);
  
                var cpText = item.querySelector('.progress-completed-text');
                if (cpText && cpText.parentNode) {
                  cpText.parentNode.removeChild(cpText);
                }
  
                cpText = document.createElement("div");
                cpText.setAttribute('class', 'progress-completed-text');
                var amtx = Math.round(100 * (tfsitem.fullyCompleted + tfsitem.partiallyCompleted)) / 100;
                cpText.textContent = '(' + (amtx) + ' completed of ' + Math.round(100 * tfsitem.costOrOriginal) / 100 + ' costed)';
                if (completed && completed.parentNode) {
                  completed.parentNode.appendChild(cpText);
                }
              }
  
              break;
            }
          }
        }
      }
    }
  }

  private httpGet(theUrl: string | URL) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, false);
    xmlHttp.send(null);
    return xmlHttp.responseText;
  }
  
  private async httpGetAsync(callback: { (list: any): void; (arg0: string): any; }, theUrl: string | URL) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = async () => {
      if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
        await callback.call(this,xmlHttp.responseText);
      }
    }
    xmlHttp.open("GET", theUrl, true);
    xmlHttp.send(null);
  }
  
  
  private getData() {
    this.getQueryId();
  }
  
  private async httpPostAsync(callback: { (data: any): void; (arg0: string): any; }, theUrl: string | URL, data: { query: string; }) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = async () => {
      if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
      {
        await callback.call(this,xmlHttp.responseText);
      }
    }
    xmlHttp.open("POST", theUrl, true);
    xmlHttp.setRequestHeader("Content-type", "application/json");
    xmlHttp.send(JSON.stringify(data));
  }
  
  
  private getQueryId() {
    if (!this.iterations || this.iterations.length === 0) {
      return;
    }

    const url = decodeURIComponent(document.URL);
    const currentIteration = this.iterations.filter(i=> url.indexOf(i.path.replace(/\\/g,'/')) !== -1);
    
    if (currentIteration.length === 0 ) {
      return;
    }

    // get current iteration data
    var pathTeam = this.adox.projectPath.replace(/\//g,'\\');
    var wiqlQuery = "SELECT [System.Id], [System.WorkItemType], [Microsoft.VSTS.Common.CustomString07], [System.Title], [System.State], [System.AssignedTo], [OSG.RemainingDays], [System.IterationLevel3], [Microsoft.VSTS.Common.CustomString08], [System.Parent], [System.TeamProject], [System.Tags], [OSG.Order], [System.AreaId], [System.IterationPath], [System.IterationId], [System.AreaPath], [Microsoft.VSTS.CMMI.TaskType] FROM workitemLinks WHERE (([Source].[System.WorkItemType] IN ('Task', 'Bug') AND [Source].[System.State] IN ('Proposed', 'Active', 'Committed', 'Started', 'Resolved', 'Completed', 'Closed')) OR ([Source].[System.WorkItemType] IN ('Task Group', 'Deliverable') AND [Source].[System.State] IN ('Proposed', 'Committed', 'Started', 'Completed'))) AND [Source].[System.IterationPath] UNDER 'Edge' AND [Source].[System.AreaPath] UNDER 'Edge\\Growth\\Feedback and Diagnostics' AND ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward') AND ((([Target].[System.WorkItemType] IN ('Task', 'Bug') AND [Target].[System.State] IN ('Proposed', 'Active', 'Committed', 'Started', 'Resolved', 'Completed', 'Closed')) OR ([Target].[System.WorkItemType] IN ('Task Group', 'Deliverable') AND [Target].[System.State] IN ('Proposed', 'Committed', 'Started', 'Completed'))) AND [Target].[System.IterationPath] "+
    "UNDER '"+currentIteration[0].path+"' AND [Target].[System.AreaPath] UNDER '"+pathTeam+"') ORDER BY [OSG.Order], [System.Id] MODE (Recursive, ReturnMatchingChildren)";
    // wiqlQuery = "SELECT TOP 100 [System.Id], [System.WorkItemType], [System.Title] FROM workitemLinks WHERE [System.State] = 'Active'";
  
    var urlFull = this.urlBase + "_apis/wit/wiql?api-version=6.0";
    this.httpPostAsync((d)=>this.getDataIds(d), urlFull, { query: wiqlQuery });
  }
  
  private getDataIds(data: string) {
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
  
    this.httpGetAsync(this.getDataCreateTable, this.urlBase + "_apis/wit/workitems?ids=" + ids +
      "&fields=System.State,System.AssignedTo,OSG.RemainingDays,OSG.Cost," +
      "System.IterationLevel3,Microsoft.VSTS.Scheduling.OriginalEstimate," +
      "System.WorkItemType,Microsoft.VSTS.CMMI.TaskType&api-version=6.0");
  }
  
  private createNewTableItem(name: any) {
    return {
      name: name, proposed: 0.0, amount: 0.0, bug: 0.0, missing: 0,
      partiallyCompleted: 0.0, fullyCompleted: 0.0, costOrOriginal: 0.0
    };
  }
  
  private getDataCreateTable(list: string) {
    const listobj = JSON.parse(list);
    this.biglist = listobj;
  
    //create table
    const table: string | any[] = [];
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
      const cost = item.fields["OSG.Cost"];
      const originalEstimate = item.fields["Microsoft.VSTS.Scheduling.OriginalEstimate"];
      const isCostable = workitemType === "Bug" || workitemType === "Task";
      const costOrOriginal = (!isNaN(cost) && cost > 0) ? cost : (!isNaN(originalEstimate) && originalEstimate > 0) ? originalEstimate : 0;
      const isCompleted = state === "Completed" || state === "Resolved";
      const isCompleting = state === "Started" || state === "Active";
      const bug = workitemType === "Bug";
      const isAmountExpected = state === "Proposed" || state === "Active" || state == "Committed" || state == "Started";
      const other = !proposed && !bug && state !== "Cut" && state !== "Closed" && state !== "Resolved";
      let amount = item.fields["OSG.RemainingDays"];
      if (isNaN(amount)) {
        amount = 0.0;
      }
  
      const reportedCost = isCostable ? costOrOriginal : 0;
  
      const amountPartiallyCompleted = isCostable && isCompleting ? costOrOriginal - amount : 0;
      const amountFullyCompleted = isCostable && isCompleted ? costOrOriginal : 0;
  
      this.addToTable(table, name.displayName, proposed, bug, other, isAmountExpected, amount, amountPartiallyCompleted, amountFullyCompleted, reportedCost);
      if (typeof taskType != 'undefined') {
        this.addToTable(table, taskType, proposed, bug, other, isAmountExpected, amount, amountPartiallyCompleted, amountFullyCompleted, reportedCost);
      }
      this.addToTable(table, 'Team', proposed, bug, other, isAmountExpected, amount, amountPartiallyCompleted, amountFullyCompleted, reportedCost);
    }
  
    //add to _tfs_counts
    for (var ii = 0; ii < table.length; ii++) {
      this.tableitem = null;
      for (var jj = 0; jj < this._tfs_counts.length; jj++) {
        if (this._tfs_counts[jj].name === table[ii].name) {
          this.tableitem = this._tfs_counts[jj];
          break;
        }
      }
  
      if (this.tableitem === null) {
        this.tableitem = this.createNewTableItem(table[ii].name);
        this._tfs_counts.push(this.tableitem);
      }
  
      this.tableitem.proposed = table[ii].proposed;
      this.tableitem.bug = table[ii].bug;
      this.tableitem.amount = table[ii].amount;
      this.tableitem.missing = table[ii].missing;
      this.tableitem.partiallyCompleted = table[ii].partiallyCompleted;
      this.tableitem.fullyCompleted = table[ii].fullyCompleted;
      this.tableitem.costOrOriginal = table[ii].costOrOriginal;
    }
  }
  
  private addToTable(table: any[], name: string, proposed: boolean, bug: boolean, other: boolean,
    isAmountExpected: boolean, amount: number, amountPartiallyCompleted: number, amountFullyCompleted: any, costOrOriginal: any) {
    var tableitem = null;
    for (var j = 0; j < table.length; j++) {
      if (table[j].name === name) {
        tableitem = table[j];
        break;
      }
    }
  
    if (tableitem === null) {
      tableitem = this.createNewTableItem(name);
      table.push(tableitem);
    }
  
    if (proposed) {
      table[j].proposed += amount;
    } else if (bug) {
      table[j].bug += amount;
    } else if (other) {
      table[j].amount += amount;
    }
  
    table[j].partiallyCompleted += amountPartiallyCompleted;
    table[j].fullyCompleted += amountFullyCompleted;
    table[j].costOrOriginal += costOrOriginal;
  
    if (isAmountExpected && amount == 0) {
      table[j].missing++;
    }
  }  
}
