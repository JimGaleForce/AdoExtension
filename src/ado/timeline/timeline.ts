import { ExtractProject, ExtractTeam } from "../api";

export class Timeline {
    private items: any[] = [];
    private epicSort = 'listedorder';
    private urlBase2: any;
    private adox: any = null;

    private header: any[] = [];
    private idIndex = -1;
    private startDateIndex = -1;
    private dueDateIndex = -1;
    private acceptedDateIndex = -1;
    private remainingDaysIndex = -1;
    private orderIndex = -1;
    private isPopulated = false;
    private isGoodView = true;
    private popTick = 0;
    private acceptedDateColumn: any = null;
    private people: any[] = [];
    private aDateName: string = 'Activated Date';
    private tick3 = 0;
    private overall3 = 0;

    private overall = 0;
    private tick = 0;

    private overall2 = 0;
    private tick2 = 0;
    private iterations: any[] = [];

    public start() {
        this.loadInitialTimelineData();
    }

    private getQuery(): string {
        const projectPath = this.adox.projectPath.replace(/\//g,'\\');
        const team = ExtractTeam(this.adox as any);
        const project = ExtractProject(this.adox as any);
        const query = "SELECT [OSG.Rank], [System.Id], [System.WorkItemType], [System.Title], [System.State], [System.IterationPath], [Microsoft.VSTS.Common.CustomString07], [OSG.RemainingDays], [Microsoft.VSTS.Scheduling.StartDate], [Microsoft.VSTS.Common.ActivatedDate], [Microsoft.VSTS.Scheduling.DueDate], [System.Parent], [System.AssignedTo] FROM workitemLinks WHERE ([Source].[System.WorkItemType] IN ('Scenario') AND [Source].[System.AreaPath] UNDER '"+projectPath+"' AND [Source].[System.IterationPath] UNDER '"+project+"' AND [Source].[System.State] IN ('Proposed', 'Committed', 'Started')) AND ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward') AND ([Target].[System.WorkItemType] IN ('Scenario') AND [Target].[System.Id] > 0 AND [Target].[System.IterationPath] UNDER '"+project+"' AND [Target].[System.State] IN ('Proposed', 'Committed', 'Started') OR ([Target].[System.WorkItemType] IN ('Impediment', 'Scenario') AND [Target].[System.State] IN ('Proposed', 'Committed', 'Started')) OR ([Target].[System.WorkItemType] IN ('Task Group', 'Deliverable') AND [Target].[System.State] IN ('Proposed', 'Committed', 'Started')) OR ([Target].[System.WorkItemType] IN ('Task', 'Bug') AND [Target].[System.State] IN ('Proposed', 'Active', 'Committed', 'Started', 'Resolved'))) ORDER BY [OSG.Order] MODE (Recursive)";
        return query;
    }
 
    private async loadData() {
        if (this.adox === null || this.adox.projectPath.length === 0) {
            console.log('no projectPath found');
            return;
        }

        const query = this.getQuery();

        var urlFull = this.urlBase2 + "_apis/wit/wiql?api-version=6.0";
        await this.httpPostAsync2((d: any)=>this.loadKRquery(d), urlFull, { query: query });
    }

    private newtitem(id: string): any {
        return {
            id: id, links: [], backlinks: [], remainingDays: 0,
            proposed: 0, bug: 0, other: 0, _remainingDays: 0,
            _proposed: 0, _bug: 0, _other: 0, amount: 0, _amount: 0,
            missing: 0, type: null, state: null, order: 0, orderId: 0
        };
    }

    private async loadKRquery(data: any) {
        var json = JSON.parse(data);
        var ids = "";

        var list = json.workItemRelations ? json.workItemRelations : json.workItems;

        var len = list.length; // Math.min(10, list.length);
        var count = 0;
        var flipCount = 0;
        for (var i = 0; i < len; i++) {
            var listitem = list[i];

            if (listitem.source != null) {
                let item = this.items[listitem.source.id] as any;
                if (typeof item === 'undefined') {
                    item = this.newtitem(listitem.source.id);
                    item.order = count;
                    ids += (ids.length > 0 ? "," : "") + listitem.source.id;
                    count++;
                    flipCount++;
                    this.items[listitem.source.id] = item;
                }

                if (listitem.target != null) {
                    item.links.push(listitem.target.id);
                }
            }

            if (listitem.target != null) {
                var item = this.items[listitem.target.id];
                if (typeof item === 'undefined') {
                    item = this.newtitem(listitem.target.id);
                    item.order = count;
                    ids += (ids.length > 0 ? "," : "") + listitem.target.id;
                    count++;
                    flipCount++;
                    this.items[listitem.target.id] = item;
                }

                if (listitem.source != null) {
                    item.backlinks.push(listitem.source.id);
                }
            }

            // todo: get id info per 100 items
            if (flipCount >= 100 || (flipCount > 0 && i == len - 1)) {
                this.overall++;
                await this.httpGetAsync2.call(this,this.getKRDataCreateTable, this.urlBase2 + "_apis/wit/workitems?ids=" + ids +
                    "&fields=System.Id,System.State,System.AssignedTo,OSG.RemainingDays,System.IterationLevel3," +
                    "System.IterationPath,System.Title," +
                    "System.WorkItemType,Microsoft.VSTS.CMMI.TaskType,Microsoft.VSTS.Scheduling.StartDate," +
                    "Microsoft.VSTS.Scheduling.DueDate,Microsoft.VSTS.Scheduling.OriginalEstimate," +
                    "OSG.RemainingDevDays,Microsoft.VSTS.Common.StackRank,Microsoft.VSTS.Common.BacklogPriority&api-version=6.0");
                ids = "";
                flipCount = 0;
            }

        }

        this.tick = window.setInterval(()=>this.checkOverall(), 100);
    }

    private checkOverall() {
        if (this.overall > 0) {
            return;
        }

        window.clearInterval(this.tick);
        this.rollUp();

        this.overall2++;
        this.getIterations();
        this.tick2 = window.setInterval(()=>this.checkOverall2(), 100);
    }

    private async checkOverall2() {
        if (this.overall2 > 0) {
            return;
        }

        window.clearInterval(this.tick2);

        // overall3 = iterations.length;
        // for (var i = 0; i < iterations.length; i++) {
        //   const iter = iterations[i];
        //   var url = 'https://microsoft.visualstudio.com/Edge/cea6b33d-07fa-4fc1-80ce-901febc2047b/_apis/work/teamsettings/iterations/' + iterations[i].id + '/capacities?api-version=6.0';
        //   await httpGetAsync2(data => getCapacityData(data, iter), url);
        // }

        this.tick3 = window.setInterval(()=>this.checkOverall3(), 100);
    }

    private checkOverall3() {
        if (this.overall3 > 0) {
            return;
        }

        window.clearInterval(this.tick3);

        this.schedule();
        this.addTabPage();
    }

    private addTabPage() {
        var pivotBar = document.getElementsByClassName('vss-HubHeader')[0];
        if (typeof pivotBar === 'undefined') {
            return;
        }

        // var tab = document.createElement('span');
        // tab.innerHTML = '<button id="newpage-btn">Graph Timeline</button>';
        // pivotBar.appendChild(tab);
        // window.setTimeout(() => {
        //     (document.getElementById('newpage-btn') as any).addEventListener('click', (e: any) => this.createTimeGraphs(e)); //newpage
        // }, 250);
    }

    private newpage(_: any) {
        var content = document.getElementsByClassName('vss-PivotBar--content')[0];
        content.setAttribute('class', 'vss-PivotBar--content x-hide');
        this.loadFile(chrome.runtime.getURL('timeline.html'), this.afterLoadNew);
    }

    private loadFile(filename: string, callback: any) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', filename, true);
        xhr.onreadystatechange = () => {
            if (xhr.readyState !== 4) return;
            if (xhr.status !== 200) return; // or whatever error handling you want
            var parent = document.getElementsByClassName('vss-PivotBar')[0];
            var tab = document.createElement('span');
            tab.innerHTML = xhr.responseText;
            parent.appendChild(tab);
            callback();
        };
        xhr.send();
    }

    private getPerson(name: string) {
        var keys: any = Object.keys(this.people);
        for (var i = 0; i < keys.length; i++) {
            if (this.people[keys[i]].displayName === name) {
                return this.people[keys[i]].id;
            }
        }

        return null;
    }

    private afterLoadNew() {
        var grid: any = document.getElementById('tl-body');

        var id = this.getPerson('Jim Gale');

        //var id = people.filter(p => p.displayName === 'Jim Gale')[0].id;
        var sb = '';
        var xitems = this.items.filter(i => i.links.length === 0 && i.assignedTo.id === id).sort((a, b) => a._startDate - b._startDate).map(
            item => {
                sb += '<tr class="trow"><td class="tcell">' + item._startDate.toDateString() + '</td><td class="tcell">' + item._endDate.toDateString() + '</td><td class="tcell">' + Math.round(100 * item._remainingDays) / 100 + '</td><td class="tcell">' + item.title + '</td></tr>';
            }
        )

        grid.innerHTML = sb;
    }

    private nextWorkDate(date: any, days: number) {
        while (date.getDay() % 6 === 0) {
            date = new Date(date.getTime() + 24 * 60 * 60 * 1000);
        }

        date = new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

        while (date.getDay() % 6 === 0) {
            date = new Date(date.getTime() + 24 * 60 * 60 * 1000);
        }

        return date;
    }

    // private getTopPri(item) {
    //   if (item.backlinks.length > 0) {
    //     item = items[item.backlinks[0]];
    //     var ord = getTopPri(item);
    //     item._order = ord;
    //   }

    //   return item.order;
    // }

    private getScenarioTitleFromEpic(a: any, prevTitle: any): string {
        if (a.backlinks.length === 0) {
            return prevTitle;
        }
        return this.getScenarioTitleFromEpic(this.items[a.backlinks[0]], a.title);
    }

    private getScenarioTitle(a: any): string {
        if (a.backlinks.length === 0) {
            return a.title;
        }
        return this.getScenarioTitle(this.items[a.backlinks[0]]);
    }

    private scenarioOrder(a: any, b: any) {
        debugger;
        var aTitle = this.getScenarioTitle(a) ?? '';
        var bTitle = this.getScenarioTitle(b) ?? '';
        var result = aTitle.localeCompare(bTitle);

        // console.log(result + '=' + aTitle + ',' + bTitle);

        return result;
    }

    private schedule() {
        // assign due dates per iteration's end times for each item (MIN of parent's due dates or self)
        var workItems = this.items.filter(i => i.links.length === 0);
        var maxDate = new Date('2050-01-01');
        this.items.map(i => {

            if (i.id === 40465838) {
                console.log(i.dueDate);
            }

            var minDate = this.getMinDate(i, null);
            i._dueDate = new Date(minDate === null ? maxDate : minDate);
            //i._order = getTopPri(i);
        });

        // sort all items by due date
        var minDate = this.nextWorkDate(new Date(), 0);
        var xitems = this.items.filter(i => i.links.length === 0);
        switch (this.epicSort) {
            case 'duedate':
                xitems = xitems.sort((a, b) => a._dueDate - b._dueDate);
                break;
            case 'scenario':
                xitems = xitems.sort((a, b) => this.scenarioOrder(a, b));
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
            if (typeof this.people[id] === 'undefined') {
                this.people[id] = assignedTo;
                this.people[id]._date = new Date(minDate);
            }

            item._startDate = new Date(this.people[id]._date);
            var date = this.nextWorkDate(new Date(this.people[id]._date), item.remainingDays / 0.8);
            item._endDate = new Date(date);
            this.people[id]._date = date;

            // roll up MAX due dates to parents
            this.rollUpMax(item, new Date(date), new Date(item._startDate))
        });

        // next - scroll through all rows, find id, and populate columns with new date data. colorize.
        this.popTick = window.setInterval(()=>this.populate(), 2000);

        //debugger;
    }


    private populate() {
        if (this.isPopulated || !this.isGoodView) {
            window.clearInterval(this.popTick);
            return;
        }

        var headerElem = document.getElementsByClassName('grid-header-column');

        if (headerElem.length === 0) {
            return;
        }

        if (this.header.length === 0) {
            for (var i = 0; i < headerElem.length; i++) {
                this.header.push(headerElem[i].textContent);
            }

            this.idIndex = this.header.indexOf('ID');
            this.startDateIndex = this.header.indexOf('Start Date');
            this.dueDateIndex = this.header.indexOf('Due Date');
            this.acceptedDateIndex = this.header.indexOf(this.aDateName);
            this.remainingDaysIndex = this.header.indexOf('Remaining Days');
            this.orderIndex = this.header.indexOf('Order');
        }

        this.acceptedDateColumn = headerElem[this.acceptedDateIndex];

        if (this.acceptedDateIndex == -1 || this.remainingDaysIndex == -1 || this.startDateIndex == -1 || this.dueDateIndex == -1) {
            this.isGoodView = false;
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
            const id: any = cols[this.idIndex].textContent;
            var item = this.items[id];
            if (typeof item === 'undefined') {
                continue;
            }

            var isFuture = item._dueDate.getYear() + 1900 > 2047;
            this.createChildItem(cols[this.startDateIndex], item._startDate.getYear() + 1900 > 2047 ? 'FUTURE' : item._startDate.toDateString(), item._dueDate < item._startDate ? 'date-overdue' : 'date-under', item.links.length === 0);
            this.createChildItem(cols[this.dueDateIndex], item._dueDate.getYear() + 1900 > 2047 ? 'FUTURE' : item._dueDate.toDateString(), '', item.links.length === 0);
            this.createChildItem(cols[this.acceptedDateIndex], item._endDate.getYear() + 1900 > 2047 ? 'FUTURE' : item._endDate.toDateString(), item._dueDate < item._endDate ? 'date-overdue' : 'date-under', item.links.length === 0);
            this.createChildItem(cols[this.remainingDaysIndex], (Math.round(100 * item._remainingDays) / 100).toString(), item._remainingDays == 0 && !isFuture ? 'days-zero' : 'days-nonzero', item.links.length === 0);

            if (this.orderIndex > -1) {
                cols[this.orderIndex].textContent = item.order;
            }
        }

        var titleElem = this.acceptedDateColumn.getElementsByClassName('title')[0];
        titleElem.textContent = 'End Date';
    }
    // isPopulated = true;

    private createChildItem(elem: Element, str: string, classx: string, isWorkItem: boolean) {
        var div = document.createElement('div');

        classx += isWorkItem ? ' workitem' : ' owner';

        div.setAttribute('class', classx);
        div.textContent = str;
        elem.innerHTML = '';
        elem.appendChild(div);
    }

    private rollUpMax(item: any, date: Date, startDate: Date) {
        if (item.backlinks.length > 0) {
            for (var i = 0; i < item.backlinks.length; i++) {
                var bi = this.items[item.backlinks[i]];
                if (typeof bi._endDate === 'undefined' || bi._endDate < date) {
                    bi._endDate = date;
                }

                if (typeof bi._startDate === 'undefined' || bi._startDate > startDate) {
                    bi._startDate = startDate;
                }

                this.rollUpMax(bi, date, startDate);
            }
        }
    }

    private getMinDate(item: any, minDate: Date | null) {
        var iterationPath = item.iteration;
        var iteration = this.iterations.filter(ix => ix.path === iterationPath)[0];
        if (typeof iteration != 'undefined' && iteration.attributes.finishDate != null) {
            var date = new Date(Date.parse(iteration.attributes.finishDate));
            if (minDate === null || minDate > date) {
                // console.log('changed ' + minDate + ' to ' + date);
                minDate = date;
            }
        }

        for (var i = 0; i < item.backlinks.length; i++) {
            minDate = this.getMinDate(this.items[item.backlinks[i]], minDate);
        }

        return minDate;
    }

    private getCapacityData(data: any, iteration: any) {
        const listobj = JSON.parse(data);
        iteration.people = listobj.value;
        this.overall3--;
    }

    private async getIterations() {
        if (this.iterations.length === 0) {
            const team = ExtractTeam(this.adox as any);
            const url = this.urlBase2 + team + "/_apis/work/teamsettings/iterations?$expand=workItems&api-version=6.1-preview.1";
            await this.httpGetAsync2(this.getIterationData, url);
            //https://microsoft.visualstudio.com/Edge/Feedback%20and%20Diagnostics/_apis/work/teamsettings/iterations?$expand=workItems&api-version=6.1-preview.1
        }
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

    //  ids = ids.substr(0, ids.length - 1);

    //  httpGetAsync(getDataCreateTable, urlBase + "/_apis/wit/workitems?ids=" + ids + "&fields=System.State,System.AssignedTo,OSG.RemainingDays,System.IterationLevel3,System.WorkItemType,Microsoft.VSTS.CMMI.TaskType&api-version=6.0");
    //}

    //https://microsoft.visualstudio.com/Edge/cea6b33d-07fa-4fc1-80ce-901febc2047b/_apis/work/teamsettings/iterations/d932bdd2-25a3-476a-bca3-8d1b3f09974a/capacities?api-version=6.0

    private rollUp() {
        var keys: any[] = Object.keys(this.items);
        for (var i = 0; i < keys.length; i++) {
            var item = this.items[keys[i]];
            if (item.remainingDays > 0) {
                this.rollUpValues(item, item.amount, item.remainingDays, item.proposed, item.bug);
            }
        }
    }

    private httpGet2(theUrl: any) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", theUrl, false);
        xmlHttp.send(null);
        return xmlHttp.responseText;
    }

    // private executeWiqlQuery(query, organization, project, pat) {
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

    private getKRDataCreateTable(list: any) {
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

            var tItem = this.items[id];
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

        this.overall--;
    }

    private rollUpValues(tItem: any, amount: number, remainingDays: number, proposed: number, bug: number) {
        tItem._amount += amount;
        tItem._remainingDays += remainingDays;
        tItem._proposed += proposed;
        tItem._bug += bug;

        for (var i = 0; i < tItem.backlinks.length; i++) {
            if (this.items[tItem.backlinks[i]]) {
                this.rollUpValues(this.items[tItem.backlinks[i]], amount, remainingDays, proposed, bug);
            }
        }
    }

    private async httpGetAsync2(callback: { (list: any): void; (arg0: string): any; }, theUrl: string | URL) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = async () => {
          if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            await callback.call(this,xmlHttp.responseText);
          }
        }
        xmlHttp.open("GET", theUrl, true);
        xmlHttp.send(null);
      }

    private async httpPostAsync2(callback: { (data: any): void; (arg0: string): any; }, theUrl: string | URL, data: { query: string; }) {
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

    private createTimeGraphs(event: any) {
        var startDate = new Date(Date.parse('2022-10-24'));
        var endDate = new Date(Date.parse('2022-12-24'));

        var set = [];
        var keys: any[] = Object.keys(this.people);
        var lastDate = startDate;
        var maxDays = 0;
        for (var ip = 0; ip < keys.length; ip++) {
            var person = this.people[keys[ip]];

            var pItems = this.items.filter(i => i._startDate >= startDate && i._dueDate <= endDate && i.assignedTo.id === person.id && i.links.length === 0).sort((a, b) => a._startDate - b._startDate);
            var ikeys: any[] = Object.keys(pItems);
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
            var ikeys: any[] = Object.keys(pItems);
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
        this.loadFile(chrome.runtime.getURL('timeline.html'), (_:any) => this.afterLoadGraph(sb));
    }

    private afterLoadGraph(sb: any) {
        var grid: any = document.getElementById('content');
        grid.innerHTML = sb;
    }

    private async loadInitialTimelineData() {
        try {
            console.log('loading in timeline');
            this.urlBase2 = document.URL.substring(0, document.URL.indexOf('_'));
            var data = await chrome.storage.sync.get(['adoxData']);
            this.adox = data.adoxData;
            this.epicSort = data.adoxData.epicSort ?? 'duedate';
            this.loadData();
        } catch (e) {
            console.error(e);
        }
    }
}


//loadInitialTimelineData();
