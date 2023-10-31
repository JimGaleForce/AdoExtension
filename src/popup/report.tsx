import { useState } from 'react';

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

const Report = (): JSX.Element => {
    const [from, setFrom] = useState<string>();
    const [to, setTo] = useState<string>();
    const [teamReport, setTeamReport] = useState<boolean>();

    const createReport = async () => {
        await chrome.tabs.create({
            active: true,
            url: `src/pages/summary/daterange/index.html?from=${from}&to=${to}&teamReport=${teamReport}`
          });
    }

    return (
        <form className="mt-2 space-y-4 divide-y divide-gray-200">
            <div className="space-y-4">
                <div className="space-y-4">
                    <div className="space-y-4">
                        <div >
                            <label htmlFor="from" className="block text-sm font-medium text-gray-700">
                                From
                            </label>
                            <div className="mt-1">
                                <input
                                    type="date"
                                    name="from"
                                    id="from"
                                    value={from}
                                    onChange={(e) => setFrom((e.target.value))}
                                    className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                                />
                            </div>
                        </div>
                        <div >
                            <label htmlFor="from" className="block text-sm font-medium text-gray-700">
                                To
                            </label>
                            <div className="mt-1">
                                <input
                                    type="date"
                                    name="to"
                                    id="to"
                                    value={to}
                                    onChange={(e) => setTo((e.target.value))}
                                    className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                                />
                            </div>
                        </div>
                            <div>
                                <input
                                    className="mr-2 h-3.5 w-8 appearance-none rounded-[0.4375rem] bg-[rgba(0,0,0,0.25)] outline-none before:pointer-events-none before:absolute before:h-3.5 before:w-3.5 before:rounded-full before:bg-transparent before:content-[''] after:absolute after:z-[2] after:-mt-[0.1875rem] after:h-5 after:w-5 after:rounded-full after:border-none after:bg-white after:shadow-[0_0px_3px_0_rgb(0_0_0_/_7%),_0_2px_2px_0_rgb(0_0_0_/_4%)] after:transition-[background-color_0.2s,transform_0.2s] after:content-[''] checked:bg-primary checked:after:absolute checked:after:z-[2] checked:after:-mt-[3px] checked:after:ml-[1.0625rem] checked:after:h-5 checked:after:w-5 checked:after:rounded-full checked:after:border-none checked:after:bg-primary checked:after:shadow-[0_3px_1px_-2px_rgba(0,0,0,0.2),_0_2px_2px_0_rgba(0,0,0,0.14),_0_1px_5px_0_rgba(0,0,0,0.12)] checked:after:transition-[background-color_0.2s,transform_0.2s] checked:after:content-[''] hover:cursor-pointer focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[3px_-1px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-5 focus:after:w-5 focus:after:rounded-full focus:after:content-[''] checked:focus:border-primary checked:focus:bg-primary checked:focus:before:ml-[1.0625rem] checked:focus:before:scale-100 checked:focus:before:shadow-[3px_-1px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] text-sm font-medium text-gray-700"
                                    type="checkbox"
                                    role="switch"
                                    checked={teamReport}
                                    onChange={(e) => setTeamReport(e.target.checked)}
                                    id="teamReport" />
                                <label
                                    className="inline-block pl-[0.15rem] hover:cursor-pointer text-sm font-medium text-gray-700"
                                    htmlFor="teamReport"
                                >Team Report</label>
                            </div>
                    </div>
                </div>
            </div>
            <div>
                <div className="pt-3">
                    <div className="flex justify-end">
                        {/* <button
                            type="button"
                            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            // onClick={() => resetConfig()}
                        >
                            Reset
                        </button> */}
                        <button
                            type="submit"
                            className={classNames(!from || !to ? "cursor-not-allowed bg-gray-500 hover:bg-gray-600" : "bg-blue-600 hover:bg-blue-700",
                            "ml-3 inline-flex justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2")}
                            onClick={() => createReport().then(() => window.close())}
                            disabled={!from || !to}
                        >
                            Create Report
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}

export default Report
