import React, { useEffect, useState } from 'react';

type AdoConfigData = {
    queryId: string
    colors: string[]
    email: string
    organization: string
    project: string
    team: string
}

const baseConfig: AdoConfigData = {
    queryId:"",
    colors: [
        '#ccFFcc',
        '#FFFFcc',
        '#FFcccc',
        '#ccccFF',
        '#ccFFFF'
    ],
    email: "",
    organization: "microsoft",
    project: "Edge",
    team: ""
}

const Highlight = (): JSX.Element => {
    const [adoxData, setAdoxData] = useState<AdoConfigData>(baseConfig);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(null);

    const saveConfig = async () => {
        await chrome.storage.sync.set({ adoxData });
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

    const onQueryChanged = (queryId: string) => {
        var newData = { ...adoxData };
        newData.queryId = queryId;
        setAdoxData(newData);
    }

    const onEmailChanged = (email: string) => {
        var newData = { ...adoxData };
        newData.email = email;
        setAdoxData(newData);
    }

    const onOrganizationChanged = (organization: string) => {
        var newData = { ...adoxData };
        newData.organization = organization;
        setAdoxData(newData);
    }

    const onProjectChanged = (project: string) => {
        var newData = { ...adoxData };
        newData.project = project;
        setAdoxData(newData);
    }

    const onTeamChanged = (team: string) => {
        var newData = { ...adoxData };
        newData.team = team;
        setAdoxData(newData);
    }


    // Load colors from storage
    useEffect(() => {
        chrome.storage.sync.get(['adoxData'])
            .then(data => {
                setAdoxData({ ...baseConfig, ...data.adoxData });
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
        <form className="space-y-8 divide-y divide-gray-200">
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

                        <div >
                            <label htmlFor="queryId" className="block text-sm font-medium text-gray-700">
                                Query ID
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="queryId"
                                    id="queryId"
                                    autoComplete="email"
                                    value={adoxData.queryId}
                                    onChange={(e) => { onQueryChanged(e.target.value) }}
                                    className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                                />
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
                                Project
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="project"
                                    id="project"
                                    value={adoxData.project}
                                    onChange={(e) => { onProjectChanged(e.target.value) }}
                                    className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                                />
                            </div>
                        </div>

                        <div >
                            <label htmlFor="team" className="block text-sm font-medium text-gray-700">
                                Team
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="team"
                                    id="team"
                                    value={adoxData.team}
                                    onChange={(e) => { onTeamChanged(e.target.value) }}
                                    className="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <div className="pt-5">
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
                            onClick={() => saveConfig().then(() => window.close())}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}

export default Highlight