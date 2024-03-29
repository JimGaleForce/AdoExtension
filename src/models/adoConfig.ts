import { GetCurrentIteration } from "../ado/api"

export type AdoConfigData = {
    configInitialized: boolean,
    searchText: string
    colors: string[]
    email: string
    organization: string
    projectPath: string;
    isHighlight: boolean;
    isProposed: boolean;
    isTimeline: boolean;    
}

export const baseConfig: AdoConfigData = {
    configInitialized: false,
    searchText: "Completed|Resolved|Closed,Proposed|Consider,Committed|Active|Bug Understood,Started|Under Development",
    colors: [
        '#ccFFcc',
        '#FFFFcc',
        '#FFcccc',
        '#ccccFF',
        '#ccFFFF'
    ],
    email: "",
    organization: "microsoft",
    projectPath: "Edge/Growth/Feedback and Diagnostics",
    isHighlight: true,
    isProposed: true,
    isTimeline: true
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
            isEmpty(config.projectPath)
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

// We want to ensure that there is a valid set of configuration options
// saved in the extension. Partly due to interopability issues with native JS
// files that are unable to utilize the `loadConfig` method. 
export async function initializeConfig(): Promise<void> {
    const config = await loadConfig();
    if (config.configInitialized !== true) {
        saveConfig({...config, configInitialized: true});
    }
}
