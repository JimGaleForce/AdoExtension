import { useEffect, useState } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import MDEditor from "@uiw/react-md-editor";
import logoPath from "../../assets/icons/128.png";
import { IterationSummary } from "../../models/adoSummary";


function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

function formatWorkItem(itemId: string, title: string) {
  let url = `(https://microsoft.visualstudio.com/Edge/_workitems/edit/${itemId})`;
  return `[${title}](${url})`
}

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
    let summaryText = `# Sprint summary for ${summary.iteration.name}`
    let completedText = '## Completed:'
    let movedInText = `## Added and/or moved in:`
    let movedOffText = `## Moved off:`
    let movedOutText = `## Moved out:`

    for (let item of summary.workItems) {
      let formattedString = formatWorkItem(item.id.toString(), item.title);

      if (item.tags.completedByMe) {
        completedText = completedText.concat(`\n- ${formattedString}`);
      }
      if (item.tags.reassigned?.toMe || item.tags.moved?.intoIteration) {
        movedInText = movedInText.concat(`\n- ${formattedString}`);
      }
      if (item.tags.reassigned?.fromMe) {
        movedOffText = movedOffText.concat(`\n- ${formattedString}`);
      }
      if (item.tags.moved?.outOfIteration) {
        movedOutText = movedOutText.concat(`\n- ${formattedString}`);
      }
    }

    summaryText = summaryText
      .concat('\n\n')
      .concat(completedText)
      .concat('\n\n')
      .concat(movedInText)
      .concat('\n\n')
      .concat(movedOffText)
      .concat('\n\n')
      .concat(movedOutText);

    setValue(summaryText);
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
                height={500}
                value={value}
                onChange={(val) => val && setValue(val)}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default App;
