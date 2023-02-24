import { GetCurrentIteration } from "../ado/api"

export type AdoConfigData = {
    queryId: string
    scenarioQueryId: string
    colors: string[]
    email: string
    organization: string
    project: string
    team: string
}

export const baseConfig: AdoConfigData = {
    queryId:"",
    scenarioQueryId: "",
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
    await chrome.runtime.sendMessage('adox-colors-updated', async _ => { });
}

export function isEmpty(text: string): boolean {
    return text == null || text.match(/^\s*$/) !== null;
}

export async function isValidConfig(): Promise<boolean> {
    try {
        const config = await loadConfig()
        if (
            isEmpty(config.email) ||
            isEmpty(config.organization) ||
            isEmpty(config.project) ||
            isEmpty(config.team)
        ) {
            return false;
        }
        
        // This will throw if unable to get current iteration
        GetCurrentIteration(config)
    } catch {
        return false
    }
    return true;
}
