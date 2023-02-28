import { useEffect, useState } from 'react';
import { AdoConfigData, baseConfig, loadConfig, saveConfig } from '../models/adoConfig';


const Config = (): JSX.Element => {
    const [adoxData, setAdoxData] = useState<AdoConfigData>(baseConfig);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(null);

    const save = async () => {
        await saveConfig(adoxData)
        console.log("Saved config");
    }

    const resetConfig = async () => {
        setAdoxData(baseConfig);
        console.log("Config reset");
    }

    const onColorChanged = (index: number, color: string) => {
        var newData = { ...adoxData };
        newData.colors[index] = color;
        setAdoxData(newData);
    }

    const onSearchTextChanged = (searchText: string) => {
        var newData = { ...adoxData };
        newData.searchText = searchText;
        setAdoxData(newData);
    }

    const onEmailChanged = (email: string) => {
        var newData = { ...adoxData };
        newData.email = email;
        setAdoxData(newData);
    }

    const onToggleChange = (checked: boolean, what: string) => {
        var newData = { ...adoxData };
        debugger;
        if (what === 'highlight') {
            newData.isHighlight = checked;
            adoxData.isHighlight = newData.isHighlight;
        } else if (what === 'proposed') {
            newData.isProposed = checked;
            adoxData.isProposed = newData.isProposed;
        } else if (what === 'timeline') {
            newData.isTimeline = checked;
            adoxData.isTimeline = newData.isTimeline;
        }

        setAdoxData(newData);
    }

    const onOrganizationChanged = (organization: string) => {
        var newData = { ...adoxData };
        newData.organization = organization;
        setAdoxData(newData);
    }

    const onProjectChanged = (projectPath: string) => {
        var newData = { ...adoxData };
        newData.projectPath = projectPath;
        setAdoxData(newData);
    }

    // Load colors from storage
    useEffect(() => {
        loadConfig()
            .then(data => {
                setAdoxData(data);
                setLoaded(true);
            })
            .catch(error => {
                setError(error);
            })
    }, [])

    if (error) {
        return (
            <div>
                Error loading data
            </div>
        )
    }

    if (!loaded) {
        return (
            <div>
                Loading...
            </div>
        )
    }

    return (
        <form className="space-y-2 divide-y divide-gray-200">
            <div className="space-y-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Colors
                            </label>
                            <div>
                                <div id="adox-colors" className="flex">
                                    <input
                                        type="color"
                                        onChange={(e) => onColorChanged(0, e.target.value)}
                                        value={adoxData.colors[0]}
                                        className='w-16px h-20px border-none p-0'
                                    />
                                    <input
                                        type="color"
                                        onChange={(e) => onColorChanged(1, e.target.value)}
                                        value={adoxData.colors[1]}
                                        className='w-16px h-20px border-none p-0'
                                    />
                                    <input
                                        type="color"
                                        onChange={(e) => onColorChanged(2, e.target.value)}
                                        value={adoxData.colors[2]}
                                        className='w-16px h-20px border-none p-0'
                                    />
                                    <input
                                        type="color"
                                        onChange={(e) => onColorChanged(3, e.target.value)}
                                        value={adoxData.colors[3]}
                                        className='w-16px h-20px border-none p-0'
                                    />
                                    <input
                                        type="color"
                                        onChange={(e) => onColorChanged(4, e.target.value)}
                                        value={adoxData.colors[4]}
                                        className='w-16px h-20px border-none p-0'
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="searchText" className="block text-sm font-medium text-gray-700">
                                Default search text for highlighting
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="searchText"
                                    id="searchText"
                                    value={adoxData.searchText}
                                    onChange={(e) => { onSearchTextChanged(e.target.value) }}
                                    className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="epicSort" className="block text-sm font-medium text-gray-700">Timeline sort by:</label>
                            <div className="mt-1">
                                <select
                                    className="queryId block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                                    name="epicSort"
                                    id="epicSort"
                                >
                                    <option value="scenario">Scenario Title</option>
                                    <option value="duedate">Due Date</option>
                                    <option value="orderid">Order Id</option>
                                    <option value="listedorder">Sorted Order</option>
                                </select>
                            </div>
                        </div>

                        <div >
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="email"
                                    id="email"
                                    autoComplete="email"
                                    value={adoxData.email}
                                    onChange={(e) => { onEmailChanged(e.target.value) }}
                                    className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                                />
                            </div>
                        </div>

                        <div >
                            <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                                Organization
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="organization"
                                    id="organization"
                                    value={adoxData.organization}
                                    onChange={(e) => { onOrganizationChanged(e.target.value) }}
                                    className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                                />
                            </div>
                        </div>

                        <div >
                            <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                                Project to Team path
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="project"
                                    id="project"
                                    value={adoxData.projectPath}
                                    placeholder="Edge/Growth/Feedback and Diagnostics"
                                    onChange={(e) => { onProjectChanged(e.target.value) }}
                                    className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                                />
                            </div>
                        </div>


                        <div className='py-2 space-y-2'>
                            <div>
                                <input
                                    className="mt-[0.0rem] mr-2 h-3.5 w-8 appearance-none rounded-[0.4375rem] bg-[rgba(0,0,0,0.25)] outline-none before:pointer-events-none before:absolute before:h-3.5 before:w-3.5 before:rounded-full before:bg-transparent before:content-[''] after:absolute after:z-[2] after:-mt-[0.1875rem] after:h-5 after:w-5 after:rounded-full after:border-none after:bg-white after:shadow-[0_0px_3px_0_rgb(0_0_0_/_7%),_0_2px_2px_0_rgb(0_0_0_/_4%)] after:transition-[background-color_0.2s,transform_0.2s] after:content-[''] checked:bg-primary checked:after:absolute checked:after:z-[2] checked:after:-mt-[3px] checked:after:ml-[1.0625rem] checked:after:h-5 checked:after:w-5 checked:after:rounded-full checked:after:border-none checked:after:bg-primary checked:after:shadow-[0_3px_1px_-2px_rgba(0,0,0,0.2),_0_2px_2px_0_rgba(0,0,0,0.14),_0_1px_5px_0_rgba(0,0,0,0.12)] checked:after:transition-[background-color_0.2s,transform_0.2s] checked:after:content-[''] hover:cursor-pointer focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[3px_-1px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-5 focus:after:w-5 focus:after:rounded-full focus:after:content-[''] checked:focus:border-primary checked:focus:bg-primary checked:focus:before:ml-[1.0625rem] checked:focus:before:scale-100 checked:focus:before:shadow-[3px_-1px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] text-sm font-medium text-gray-700"
                                    type="checkbox"
                                    role="switch"
                                    onChange={(e) => onToggleChange((e.target as any).checked, 'highlight')}
                                    defaultChecked={adoxData.isHighlight}
                                    id="isHighlight" />
                                <label
                                    className="inline-block pl-[0.15rem] t-3 hover:cursor-pointer text-sm font-medium text-gray-700"
                                    htmlFor="isHighlight"
                                >Highlight</label>
                            </div>

                            <div>
                                <input
                                    className="mt-[0.0rem] mr-2 h-3.5 w-8 appearance-none rounded-[0.4375rem] bg-[rgba(0,0,0,0.25)] outline-none before:pointer-events-none before:absolute before:h-3.5 before:w-3.5 before:rounded-full before:bg-transparent before:content-[''] after:absolute after:z-[2] after:-mt-[0.1875rem] after:h-5 after:w-5 after:rounded-full after:border-none after:bg-white after:shadow-[0_0px_3px_0_rgb(0_0_0_/_7%),_0_2px_2px_0_rgb(0_0_0_/_4%)] after:transition-[background-color_0.2s,transform_0.2s] after:content-[''] checked:bg-primary checked:after:absolute checked:after:z-[2] checked:after:-mt-[3px] checked:after:ml-[1.0625rem] checked:after:h-5 checked:after:w-5 checked:after:rounded-full checked:after:border-none checked:after:bg-primary checked:after:shadow-[0_3px_1px_-2px_rgba(0,0,0,0.2),_0_2px_2px_0_rgba(0,0,0,0.14),_0_1px_5px_0_rgba(0,0,0,0.12)] checked:after:transition-[background-color_0.2s,transform_0.2s] checked:after:content-[''] hover:cursor-pointer focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[3px_-1px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-5 focus:after:w-5 focus:after:rounded-full focus:after:content-[''] checked:focus:border-primary checked:focus:bg-primary checked:focus:before:ml-[1.0625rem] checked:focus:before:scale-100 checked:focus:before:shadow-[3px_-1px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] text-sm font-medium text-gray-700"
                                    type="checkbox"
                                    role="switch"
                                    onChange={(e) => onToggleChange((e.target as any).checked, 'proposed')}
                                    defaultChecked={adoxData.isProposed}
                                    id="isProposed" />
                                <label
                                    className="inline-block pl-[0.15rem] hover:cursor-pointer text-sm font-medium text-gray-700"
                                    htmlFor="isProposed"
                                >Proposed</label>
                            </div>

                            <div>
                                <input
                                    className="mt-[0.0rem] mr-2 h-3.5 w-8 appearance-none rounded-[0.4375rem] bg-[rgba(0,0,0,0.25)] outline-none before:pointer-events-none before:absolute before:h-3.5 before:w-3.5 before:rounded-full before:bg-transparent before:content-[''] after:absolute after:z-[2] after:-mt-[0.1875rem] after:h-5 after:w-5 after:rounded-full after:border-none after:bg-white after:shadow-[0_0px_3px_0_rgb(0_0_0_/_7%),_0_2px_2px_0_rgb(0_0_0_/_4%)] after:transition-[background-color_0.2s,transform_0.2s] after:content-[''] checked:bg-primary checked:after:absolute checked:after:z-[2] checked:after:-mt-[3px] checked:after:ml-[1.0625rem] checked:after:h-5 checked:after:w-5 checked:after:rounded-full checked:after:border-none checked:after:bg-primary checked:after:shadow-[0_3px_1px_-2px_rgba(0,0,0,0.2),_0_2px_2px_0_rgba(0,0,0,0.14),_0_1px_5px_0_rgba(0,0,0,0.12)] checked:after:transition-[background-color_0.2s,transform_0.2s] checked:after:content-[''] hover:cursor-pointer focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[3px_-1px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-5 focus:after:w-5 focus:after:rounded-full focus:after:content-[''] checked:focus:border-primary checked:focus:bg-primary checked:focus:before:ml-[1.0625rem] checked:focus:before:scale-100 checked:focus:before:shadow-[3px_-1px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] text-sm font-medium text-gray-700"
                                    type="checkbox"
                                    role="switch"
                                    onChange={(e) => onToggleChange((e.target as any).checked, 'timeline')}
                                    defaultChecked={adoxData.isTimeline}
                                    id="isTimeline" />
                                <label
                                    className="inline-block pl-[0.15rem] hover:cursor-pointer text-sm font-medium text-gray-700"
                                    htmlFor="isTimeline"
                                >Timeline</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <div className="pt-3">
                    <div className="flex justify-end">
                        <button
                            type="button"
                            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            onClick={() => resetConfig()}
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            onClick={() => save().then(() => window.close())}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}

export default Config
