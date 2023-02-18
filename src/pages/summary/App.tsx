import { useEffect, useState } from "react";

import { Disclosure } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import MDEditor from "@uiw/react-md-editor";

import logoPath from "../../assets/icons/128.png";
import { IterationSummary } from "../../models/adoSummary";

const navigation = [
  { name: "Summary", href: "#", current: true },
  { name: "Settings", href: "#", current: false },
];

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
    console.log("Got response");
    console.log(request);
    const summary = request.summary as IterationSummary;
    let summaryText = `# Sprint summary for ${summary.iteration.name}`
    let completedText = summaryText.concat(`## Completed:`)
    let movedInText = summaryText.concat(`## Added and/or moved in:`)
    let movedOffText = summaryText.concat(`## Moved off:`)
    let movedOutText = summaryText.concat(`## Moved out:`)

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
          <Disclosure as="nav" className="bg-gray-800">
            {({ open }) => (
              <>
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
                        <div className="hidden md:block">
                          <div className="ml-10 flex items-baseline space-x-4">
                            {navigation.map((item) => (
                              <a
                                key={item.name}
                                href={item.href}
                                className={classNames(
                                  item.current
                                    ? "bg-gray-900 text-white"
                                    : "text-gray-300 hover:bg-gray-700 hover:text-white",
                                  "px-3 py-2 rounded-md text-sm font-medium"
                                )}
                                aria-current={item.current ? "page" : undefined}
                              >
                                {item.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="hidden md:block">
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
                      <div className="-mr-2 flex md:hidden">
                        {/* Mobile menu button */}
                        <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                          <span className="sr-only">Open main menu</span>
                          {open ? (
                            <XMarkIcon
                              className="block h-6 w-6"
                              aria-hidden="true"
                            />
                          ) : (
                            <Bars3Icon
                              className="block h-6 w-6"
                              aria-hidden="true"
                            />
                          )}
                        </Disclosure.Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Disclosure.Panel className="border-b border-gray-700 md:hidden">
                  <div className="space-y-1 px-2 py-3 sm:px-3">
                    {navigation.map((item) => (
                      <Disclosure.Button
                        key={item.name}
                        as="a"
                        href={item.href}
                        className={classNames(
                          item.current
                            ? "bg-gray-900 text-white"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white",
                          "block px-3 py-2 rounded-md text-base font-medium"
                        )}
                        aria-current={item.current ? "page" : undefined}
                      >
                        {item.name}
                      </Disclosure.Button>
                    ))}
                  </div>
                  <div className="border-t border-gray-700 pt-4 pb-3">
                    <div className="flex items-center px-5">
                      <div className="ml-3">
                        <div className="text-base font-medium leading-none text-white">
                          Iteration
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 px-2">
                      {navigation.map((item) => (
                        <Disclosure.Button
                          key={item.name}
                          as="a"
                          href={item.href}
                          className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                        >
                          {item.name}
                        </Disclosure.Button>
                      ))}
                    </div>
                  </div>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
          <header className="py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Dashboard
              </h1>
            </div>
          </header>
        </div>

        <main className="-mt-32">
          <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
            <div className="container min-h-12" data-color-mode="light">
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
