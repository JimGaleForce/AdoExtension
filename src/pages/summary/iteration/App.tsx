import { useEffect, useState } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import MDEditor from "@uiw/react-md-editor";
import logoPath from "../../../assets/icons/128.png";
import { IterationSummary } from "../../../models/adoSummary";
import { markdownTable } from 'markdown-table';
import { useSearchParams } from "react-router-dom";
import { GenerateIterationSummaryAction } from "../../../models/actions";
import { WorkItemType } from "../../../models/adoApi";
import dayjs from "dayjs";
import { ItemRelation, ItemsRelation } from "../../../models/adoSummary/item";


const getIcon = (workItemType: string): string => {
  switch (workItemType) {
    case 'Key Result':
    case 'Epic':
      return '📈';
    case 'Scenario':
      return '👑';
    case 'Deliverable':
      return '🏆';
    case 'Task':
      return '✔️';
    case 'Bug':
      return '🐜';
  }
  return "";
}

const shouldAdd = (user: string, item: ItemRelation, summary: IterationSummary): boolean => {
  // If not related to user, don't add
  if (item.assignedTo.indexOf(user) === -1) {
    return false;
  }

  // If task/bug, add
  if (item.type === "Task" || item.type === "Bug") {
    return true;
  }

  // Else, recursively check children to see if task/bug exists and is related to user
  if (item.children !== undefined) {
    for (const key in item.children) {
      const child = item.children[key];
      const childItem = summary.topDownMap[child.workItemType]![child.id];
      if (shouldAdd(user, childItem, summary)) {
        return true;
      }
    }
  }

  return false;
}

const parseWorkItemTypeForUser = (user: string, items: ItemsRelation, summary: IterationSummary, indentation: number = 0): string[][] => {
  let table: string[][] = [];
  if (items === undefined) {
    return table;
  }

  let prefix = "";
  for (let i = 0; i < indentation; i++) {
    prefix += "---- ";
  }

  // Iterate through all items passed through
  for (const key in items) {
    const item = items[key];

    if (!shouldAdd(user, item, summary)) {
      continue;
    }

    let row: string[] = [];
    // Add the work item ID and title
    row.push(`[${key}](https://microsoft.visualstudio.com/Edge/_workitems/edit/${key})`, `${prefix} ${getIcon(item.type)} ${item.title}`);

    if (key in summary.workItems) {
      // Add the status if it exists
      const { tags, state } = summary.workItems[key];
      let status = ""

      if (tags.moved?.intoIteration) {
        status += "⬅️";
      }

      if (tags.completedBy?.uniqueName === user) {
        status += "✅";
      } else if (tags.completedBy !== undefined) {
        status += "☑️";
      } else {

        switch (state) {
          case "Proposed":
            status += "🟡";
            break;
          case "Committed":
          case "Active":
            status += "🔵";
            break;
          case "Started":
            status += "🟢"
            break;
          case "Closed":
          case "Resolved":
          case "Completed":
            status += "✅";
            break;
          case "Cut":
            status += "✂️";
            break;
          default:
            status += "🔴";
        }
      }

      if (tags.moved?.outOfIteration) {
        status += "➡️";
      }

      row.push(status);
    }

    table.push(row);

    // If there's any children of this item, recursively add it to the table as well
    if (item.children !== undefined) {

      // Items to recursively parse
      let childrenItems: ItemsRelation = {};

      // Add all children to the table where the user is assigned to
      item.children.forEach(child => {
        if (summary.topDownMap[child.workItemType]![child.id].assignedTo.indexOf(user) === -1) return;
        childrenItems[child.id] = summary.topDownMap[child.workItemType]![child.id];
      });

      // Recursively parse items
      table.push(...parseWorkItemTypeForUser(user, childrenItems, summary, indentation + 1));
    }
  }

  return table;
};

const parseUser = (user: string, summary: IterationSummary): string | null => {
  let overallTable: string[][] = []

  overallTable.push(['Work Item', 'Title', 'Status']);

  // Parse the epics in relation to this user
  if (summary.topDownMap.Epic !== undefined && Object.keys(summary.topDownMap.Epic).length > 0) {
    overallTable.push(...parseWorkItemTypeForUser(user, summary.topDownMap['Epic'], summary));
  }

  if (summary.topDownMap["Key Result"] !== undefined && Object.keys(summary.topDownMap["Key Result"]).length > 0) {
    overallTable.push(...parseWorkItemTypeForUser(user, summary.topDownMap['Key Result'], summary));
  }

  // Put all the scenarios that weren't captured in the epics
  if (summary.topDownMap["Scenario"] !== undefined && Object.keys(summary.topDownMap["Scenario"]).length > 0) {
    let parentlessItems = Object.keys(summary.topDownMap["Scenario"]).filter(key => summary.topDownMap["Scenario"]![key].parent === undefined && summary.topDownMap["Scenario"]![key].assignedTo.indexOf(user) !== -1);
    if (parentlessItems.length > 0) {
      let parentlessItemsMap: ItemsRelation = {};
      parentlessItems.forEach(key => {
        parentlessItemsMap[key] = summary.topDownMap["Scenario"]![key];
      });
      overallTable.push(["", "[Parentless]"]);
      overallTable.push(...parseWorkItemTypeForUser(user, parentlessItemsMap, summary, 1));
    }
  }

  // Put all the deliverables that weren't captured in the epics
  if (summary.topDownMap["Deliverable"] !== undefined && Object.keys(summary.topDownMap["Deliverable"]).length > 0) {
    let parentlessItems = Object.keys(summary.topDownMap["Deliverable"]).filter(key => summary.topDownMap["Deliverable"]![key].parent === undefined && summary.topDownMap["Deliverable"]![key].assignedTo.indexOf(user) !== -1);
    if (parentlessItems.length > 0) {
      let parentlessItemsMap: ItemsRelation = {};
      parentlessItems.forEach(key => {
        parentlessItemsMap[key] = summary.topDownMap["Deliverable"]![key];
      });
      overallTable.push(["", "[Parentless]"]);
      overallTable.push(...parseWorkItemTypeForUser(user, parentlessItemsMap, summary, 2));
    }
  }

  // Put all the tasks that weren't captured in the epics
  if (summary.topDownMap["Task"] !== undefined && Object.keys(summary.topDownMap["Task"]).length > 0) {
    let parentlessItems = Object.keys(summary.topDownMap["Task"]).filter(key => summary.topDownMap["Task"]![key].parent === undefined && summary.topDownMap["Task"]![key].assignedTo.indexOf(user) !== -1);
    if (parentlessItems.length > 0) {
      let parentlessItemsMap: ItemsRelation = {};
      parentlessItems.forEach(key => {
        parentlessItemsMap[key] = summary.topDownMap["Task"]![key];
      });
      console.log("Task", user, parentlessItems, parentlessItemsMap);
      overallTable.push(["", "[Parentless]"]);
      overallTable.push(...parseWorkItemTypeForUser(user, parentlessItemsMap, summary, 3));
    }
  }

  // Put all the tasks that weren't captured in the epics
  if (summary.topDownMap["Bug"] !== undefined && Object.keys(summary.topDownMap["Bug"]).length > 0) {
    let parentlessItems = Object.keys(summary.topDownMap["Bug"]).filter(key => summary.topDownMap["Bug"]![key].parent === undefined && summary.topDownMap["Bug"]![key].assignedTo.indexOf(user) !== -1);
    if (parentlessItems.length > 0) {
      let parentlessItemsMap: ItemsRelation = {};
      parentlessItems.forEach(key => {
        parentlessItemsMap[key] = summary.topDownMap["Bug"]![key];
      });
      console.log("Bug", user, parentlessItemsMap);
      overallTable.push(["", "[Parentless]"]);
      overallTable.push(...parseWorkItemTypeForUser(user, parentlessItemsMap, summary, 3));
    }
  }

  if (overallTable.length === 1) {
    return null;
  }

  return markdownTable(overallTable, {
    padding: false,
    alignDelimiters: false
  });
}

const parseWorkItemTypeForTeam = (items: ItemsRelation, summary: IterationSummary, indentation: number = 0): string[][] => {
  let table: string[][] = [];
  if (items === undefined) {
    return table;
  }

  let prefix = "";
  for (let i = 0; i < indentation; i++) {
    prefix += "- ";
  }

  // Iterate through all items passed through
  for (const key in items) {
    const item = items[key];

    let row: string[] = [];
    row.push(item.type, key, `${prefix} ${item.title}`);

    if (key in summary.workItems) {
      // Add the status if it exists
      const { assignedTo, state } = summary.workItems[key];

      row.push(state, assignedTo.displayName);
    } else {
      row.push("", "");
    }
    table.push(row);

    // If there's any children of this item, recursively add it to the table as well
    if (item.children !== undefined) {

      // Items to recursively parse
      let childrenItems: ItemsRelation = {};

      // Add all children to the table where the user is assigned to
      item.children.forEach(child => {
        childrenItems[child.id] = summary.topDownMap[child.workItemType]![child.id];
      });

      // Recursively parse items
      table.push(...parseWorkItemTypeForTeam(childrenItems, summary, indentation + 1));
    }
  }

  return table;
}

const parseTeamSummary = (summary: IterationSummary): string => {
  let overallTable: string[][] = []

  overallTable.push(['Type', 'Work Item', 'Title', 'Status', 'Assigned To']);

  // Parse the epics in relation to this user
  if (summary.topDownMap.Epic !== undefined && Object.keys(summary.topDownMap.Epic).length > 0) {
    overallTable.push(...parseWorkItemTypeForTeam(summary.topDownMap['Epic'], summary));
  }

  if (summary.topDownMap["Key Result"] !== undefined && Object.keys(summary.topDownMap["Key Result"]).length > 0) {
    overallTable.push(...parseWorkItemTypeForTeam(summary.topDownMap['Key Result'], summary));
  }

  // Put all the scenarios that weren't captured in the epics
  if (summary.topDownMap["Scenario"] !== undefined && Object.keys(summary.topDownMap["Scenario"]).length > 0) {
    let parentlessItems = Object.keys(summary.topDownMap["Scenario"]).filter(key => summary.topDownMap["Scenario"]![key].parent === undefined);
    if (parentlessItems.length > 0) {
      let parentlessItemsMap: ItemsRelation = {};
      parentlessItems.forEach(key => {
        parentlessItemsMap[key] = summary.topDownMap["Scenario"]![key];
      });
      overallTable.push(["", "[Parentless]"]);
      overallTable.push(...parseWorkItemTypeForTeam(parentlessItemsMap, summary, 1));
    }
  }

  // Put all the deliverables that weren't captured in the epics
  if (summary.topDownMap["Deliverable"] !== undefined && Object.keys(summary.topDownMap["Deliverable"]).length > 0) {
    let parentlessItems = Object.keys(summary.topDownMap["Deliverable"]).filter(key => summary.topDownMap["Deliverable"]![key].parent === undefined);
    if (parentlessItems.length > 0) {
      let parentlessItemsMap: ItemsRelation = {};
      parentlessItems.forEach(key => {
        parentlessItemsMap[key] = summary.topDownMap["Deliverable"]![key];
      });
      overallTable.push(["", "[Parentless]"]);
      overallTable.push(...parseWorkItemTypeForTeam(parentlessItemsMap, summary, 2));
    }
  }

  // Put all the tasks that weren't captured in the epics
  if (summary.topDownMap["Task"] !== undefined && Object.keys(summary.topDownMap["Task"]).length > 0) {
    let parentlessItems = Object.keys(summary.topDownMap["Task"]).filter(key => summary.topDownMap["Task"]![key].parent === undefined);
    if (parentlessItems.length > 0) {
      let parentlessItemsMap: ItemsRelation = {};
      parentlessItems.forEach(key => {
        parentlessItemsMap[key] = summary.topDownMap["Task"]![key];
      });
      console.log("Task", parentlessItems, parentlessItemsMap);
      overallTable.push(["", "[Parentless]"]);
      overallTable.push(...parseWorkItemTypeForTeam(parentlessItemsMap, summary, 3));
    }
  }

  // Put all the tasks that weren't captured in the epics
  if (summary.topDownMap["Bug"] !== undefined && Object.keys(summary.topDownMap["Bug"]).length > 0) {
    let parentlessItems = Object.keys(summary.topDownMap["Bug"]).filter(key => summary.topDownMap["Bug"]![key].parent === undefined);
    if (parentlessItems.length > 0) {
      let parentlessItemsMap: ItemsRelation = {};
      parentlessItems.forEach(key => {
        parentlessItemsMap[key] = summary.topDownMap["Bug"]![key];
      });
      console.log("Bug", parentlessItemsMap);
      overallTable.push(["", "[Parentless]"]);
      overallTable.push(...parseWorkItemTypeForTeam(parentlessItemsMap, summary, 3));
    }
  }


  return markdownTable(overallTable, {
    padding: false,
    alignDelimiters: false
  });
};

const App = (): JSX.Element => {
  const [searchParams, _setSearchParams] = useSearchParams()
  const [team, setTeam] = useState<string>()
  const [iterationId, setIterationId] = useState<string>()
  const [summary, setSummary] = useState<IterationSummary>()
  const [value, setValue] = useState("**No iteration specified; Waiting...**");
  const [loaded, setLoaded] = useState<boolean>()
  const [generateRequestSent, setGenerateRequestSent] = useState<boolean>()


  const onMessage = async (
    request: any,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response?: any) => void
  ) => {
    if (!request.summary) {
      return;
    }
    console.log("Got summary");
    console.log(request);
    setSummary(request.summary);
  };

  useEffect(() => {
    if (loaded) {
      return;
    }

    chrome.runtime.onMessage.addListener(onMessage);
    setLoaded(true);
  }, [loaded]);

  useEffect(() => {
    let newIterationId = searchParams.get('iteration')
    if (iterationId !== newIterationId) {
      setIterationId(newIterationId ?? undefined);
      setGenerateRequestSent(false)
    }

    let newTeam = searchParams.get('team')
    if (team !== newTeam) {
      setTeam(newTeam ?? undefined);
      setGenerateRequestSent(false)
    }
  }, [team, iterationId, searchParams]);

  useEffect(() => {
    if (!team || team === null || !iterationId || iterationId === null || generateRequestSent) {
      return;
    }

    setValue(`**Generating summary...**`);
    setGenerateRequestSent(true);

    const action: GenerateIterationSummaryAction = {
      action: 'GenerateIterationSummary',
      iterationId: iterationId,
      team: team
    }
    chrome.runtime.sendMessage(action, (resp) => { });
  }, [team, iterationId, generateRequestSent]);

  useEffect(() => {
    if (!summary || !team) {
      return;
    }

    let allUsers = new Set<string>();

    for (const key in summary.topDownMap) {
      const workItemType = key as unknown as WorkItemType;

      if (summary.topDownMap[workItemType] === undefined) continue;
      const items: ItemsRelation = summary.topDownMap[workItemType]!

      for (const key in items) {
        const users = summary.topDownMap[workItemType]![key].assignedTo;

        users.forEach(user => {
          allUsers.add(user);
        })
      }
    }

    let finalReport: string = `# Sprint summary for ${summary.iteration.name} (${team})\n\n`;


    // finalReport += `## Team Summary\n\n${parseTeamSummary(summary)}\n\n`;

    console.log("Users: ", allUsers);
    for (const user of allUsers) {
      const userReport = parseUser(user, summary);
      if (userReport === null) {
        continue;
      }
      finalReport += `## ${user}\n${userReport}\n\n`;
    }

    finalReport += `\n\n#### Generated on ${dayjs().format(`MM/DD/YYYY, hh:mma`)}`;

    console.log("Final report: ", finalReport);

    setValue(finalReport);
  }, [summary, team]);

  return (
    <>
      <div className="min-h-full">
        <div className="bg-gray-800 pb-32">
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="border-b border-gray-700">
              <div className="flex h-16 items-center justify-between px-4 sm:px-0">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <img
                      className="h-8 w-8"
                      src={chrome.runtime.getURL(logoPath)}
                      alt="Your Company"
                    />
                  </div>
                  <div className="block">
                    <div className="ml-10 flex items-baseline space-x-4">
                      <h1 className="text-xl font-bold tracking-tight text-white">
                        ADO Power Tools
                      </h1>
                    </div>
                  </div>
                </div>
                <div className="md:block">
                  <div className="ml-4 flex items-center md:ml-6">
                    <button
                      type="button"
                      className="rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                    >
                      <span className="sr-only">View notifications</span>
                      <BellIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <header className="py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Iteration Summary
              </h1>
            </div>
          </header>
        </div>
        <main className="-mt-32">
          <div className="mx-auto px-4 pb-12">
            <div className="mx-auto max-w-7xl" data-color-mode="light">
              <MDEditor
                height={750}
                value={value}
                onChange={(val) => val && setValue(val)}
                preview='preview'
                previewOptions={{
                  linkTarget: '_blank'
                }}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default App;
