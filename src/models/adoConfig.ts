export type AdoConfigData = {
    queryId: string
    colors: string[]
    email: string
    organization: string
    project: string
    team: string
}

export const baseConfig: AdoConfigData = {
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

export const loadConfig: () => Promise<AdoConfigData> = () => {
    return new Promise<AdoConfigData>(async (resolve) => {
        const data = await chrome.storage.sync.get(['adoxData']);
        const config = data.adoxData ?? {};
        resolve({...baseConfig, ...config});
    })
}

export const saveConfig = async (config: AdoConfigData) => {
    await chrome.storage.sync.set({ adoxData: config });
}
