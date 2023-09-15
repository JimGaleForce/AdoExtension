import { useEffect, useState } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import MDEditor from "@uiw/react-md-editor";
import logoPath from "../../assets/icons/128.png";
import { IterationSummary } from "../../models/adoSummary";
import { markdownTable } from 'markdown-table'
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";
import { GenerateIterationSummaryAction } from "../../models/actions";

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
    setSummary(request.summary as IterationSummary);
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
    setValue(`Done. Check console\n${summary?.workItems.length ?? 0} work items processed`);
//     let overallTable: string[][] = [
//       ['Type', 'ID', 'Title', 'Completed', 'Moved In', 'Reassigned To', 'Reassigned Off', 'Punted']
//     ]

//     let completedTable: string[][] = [
//       ['ID', 'Title', 'Moved In', 'Reassigned', 'Time Spent', 'Notes']
//     ]

//     let movedOutTable: string[][] = [
//       ['ID', 'Title', 'Time Spent', 'Time Added', 'Time Left', 'Notes']
//     ]

//     for (let item of summary.workItems) {
//       let overallRow: string[] = []
//       let completedRow: string[] = []
//       let movedOutRow: string[] = []
//       let title = item.title.length > 70 ? item.title.substring(0, 70).concat('...') : item.title;

//       // Type | Work ID | Title | Completed | Reassigned To | Reassigned From | Moved In | Moved Off
//       switch (item.tags.workItemType) {
//         case 'Task':
//           overallRow.push('✅');
//           break;
//         case 'Deliverable':
//           overallRow.push('🏆');
//           break;
//         case 'Bug':
//           overallRow.push('🐜');
//           break;
//         default:
//           overallRow.push(item.tags.workItemType ?? '');
//       }
//       overallRow.push(`[${item.id}](https://microsoft.visualstudio.com/Edge/_workitems/edit/${item.id})`)
//       overallRow.push(title);
//       // row.push("(type)")


//       if (item.tags.completedByMe) {
//         overallRow.push("X")
//         completedRow.push(`[${item.id}](https://microsoft.visualstudio.com/Edge/_workitems/edit/${item.id})`)
//         completedRow.push(title);
//         if (item.tags.moved?.intoIteration) {
//           completedRow.push("X")
//         } else {
//           completedRow.push("")
//         }
//         if (item.tags.reassigned?.toMe || item.tags.reassigned?.fromMe) {
//           completedRow.push("X");
//         } else {
//           completedRow.push("");
//         }
//         if (item.tags.capacity) {
//           completedRow.push(`${item.tags.capacity.timeRemoved}`);
//         }
//       } else {
//         overallRow.push("")
//       }

//       if (item.tags.moved?.intoIteration) {
//         overallRow.push("X")
//       } else {
//         overallRow.push("")
//       }

//       if (item.tags.reassigned?.toMe) {
//         overallRow.push("X")
//       } else {
//         overallRow.push("")
//       }

//       if (item.tags.reassigned?.fromMe) {
//         overallRow.push("X")
//       } else {
//         overallRow.push("")
//       }


//       if (item.tags.moved?.outOfIteration) {
//         overallRow.push("X")
//         movedOutRow.push(`[${item.id}](https://microsoft.visualstudio.com/Edge/_workitems/edit/${item.id})`)
//         movedOutRow.push(title)

//         if (item.tags.capacity) {
//           movedOutRow.push(`${item.tags.capacity.timeRemoved}`);
//           movedOutRow.push(`${item.tags.capacity.timeAdded}`);
//           movedOutRow.push(`${item.tags.capacity.timeLeft}`);
//         } else {
//           movedOutRow.push("?");
//           movedOutRow.push("?");
//           movedOutRow.push("?");
//         }
//         movedOutRow.push("");
//       } else {
//         overallRow.push("")
//       }

//       overallTable.push(overallRow);
//       if (completedRow.length > 0) {
//         completedTable.push(completedRow);
//       }
//       if (movedOutRow.length > 0) {
//         movedOutTable.push(movedOutRow);
//       }
//     }

//     setValue(
//       `# Sprint summary for ${summary.iteration.name}

// **Completed:**
// ${markdownTable(completedTable)}

// **Moved Out:**
// ${markdownTable(movedOutTable)}

// **Detailed Breakdown**
// ${markdownTable(overallTable)}


// #### Generated on ${dayjs().format(`MM/DD/YYYY, hh:mma`)}
// `
//     );
  }, [summary]);

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
                Summary
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
