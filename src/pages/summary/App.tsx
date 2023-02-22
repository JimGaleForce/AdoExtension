import { useEffect, useState } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import MDEditor from "@uiw/react-md-editor";
import logoPath from "../../assets/icons/128.png";
import { IterationSummary } from "../../models/adoSummary";
import { markdownTable } from 'markdown-table'
import dayjs from "dayjs";

const App = (): JSX.Element => {
  const [value, setValue] = useState("**Generating Summary...**");
  const onMessage = async (
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    if (!request.summary) {
      return;
    }
    console.log("Got summary");
    console.log(request);
    const summary = request.summary as IterationSummary;

    let overallTable: string[][] = [
      ['ID', 'Title', 'Completed', 'Moved In', 'Reassigned To', 'Reassigned Off',  'Punted']
    ]

    let completedTable: string[][] = [
      ['ID', 'Title', 'Moved In', 'Reassigned', 'Notes']
    ]

    let movedOutTable: string[][] = [
      ['ID', 'Title', 'Notes']
    ]

    for (let item of summary.workItems) {
      let overallRow: string[] = []
      let completedRow: string[] = []
      let movedOutRow: string[] = []

      // Work ID | Title | Type | Completed | Reassigned To | Reassigned From | Moved In | Moved Off
      overallRow.push(`[${item.id}](https://microsoft.visualstudio.com/Edge/_workitems/edit/${item.id})`)
      overallRow.push(item.title.substring(0, 70))
      // row.push("(type)")


      if (item.tags.completedByMe) {
        overallRow.push("X")
        completedRow.push(`[${item.id}](https://microsoft.visualstudio.com/Edge/_workitems/edit/${item.id})`)
        completedRow.push(item.title.substring(0, 70))        
        if (item.tags.moved?.intoIteration) {
          overallRow.push("X")
        } else {
          overallRow.push("")
        }
        if (item.tags.reassigned?.toMe || item.tags.reassigned?.fromMe) {
          completedRow.push("X");
        } else {
          completedRow.push("");
        }
      } else {
        overallRow.push("")
      }

      if (item.tags.moved?.intoIteration) {
        overallRow.push("X")
      } else {
        overallRow.push("")
      }

      if (item.tags.reassigned?.toMe) {
        overallRow.push("X")
      } else {
        overallRow.push("")
      }

      if (item.tags.reassigned?.fromMe) {
        overallRow.push("X")
      } else {
        overallRow.push("")
      }


      if (item.tags.moved?.outOfIteration) {
        overallRow.push("X")
        movedOutRow.push(`[${item.id}](https://microsoft.visualstudio.com/Edge/_workitems/edit/${item.id})`)
        movedOutRow.push(item.title.substring(0, 70))
        movedOutRow.push("");   
      } else {
        overallRow.push("")
      }

      overallTable.push(overallRow);
      if (completedRow.length > 0) {
        completedTable.push(completedRow);
      }
      if (movedOutRow.length > 0) {
        movedOutTable.push(movedOutRow);
      }
    }

    setValue(
`# Sprint summary for ${summary.iteration.name}

## Completed:
${markdownTable(completedTable)}

## Moved Out:
${markdownTable(movedOutTable)}

## Detailed Breakdown
${markdownTable(overallTable)}


#### Generated on ${dayjs().format(`MM/DD/YYYY, hh:mma`)}
`
    );
  };

  useEffect(() => {
    chrome.runtime.onMessage.addListener(onMessage);
  }, []);

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
