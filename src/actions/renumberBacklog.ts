import { ExtractProject, ExtractTeam, GetBacklogWorkItemsById, GetBatchItemDetails, UpdateWorkItem } from "../ado/api";
import { loadConfig } from "../models/adoConfig";

export default async function renumberBacklog(): Promise<boolean> {

    try {
        const config = await loadConfig();
        const project = ExtractProject(config);
        const team = ExtractTeam(config);
        // const backlogs = await GetBacklogs(config.organization, project, team);
        const backlogWorkItems = await GetBacklogWorkItemsById(config.organization, project, team,'OSG.ScenarioCategory');
        const workItemIds = backlogWorkItems.workItems.map((workItem) => String(workItem.target.id));
        console.log(workItemIds);
    
        let workItemDetails = await GetBatchItemDetails(config, workItemIds, ['System.Id', 'System.Title']);
        console.log(workItemDetails);
    
        let currentNumber = 1;
    
        for (const workItemId of workItemIds) {
            const workItem = workItemDetails.find((workItem) => String(workItem.id) === workItemId);
            if (!workItem) {
                console.error(`Could not find work item: ${workItemId}`);
                continue;
            }
            const title = workItem.fields['System.Title'];
            const workItemNumberPrefix = title.match(/^\[(\d{3})\] /);
            const sanitizedTitle = title.substring(workItemNumberPrefix ? workItemNumberPrefix[0].length : 0).trim();
    
            if (sanitizedTitle.startsWith('➖➖➖' || sanitizedTitle.startsWith('---'))) {
                // If matched, update title to sanitized title
                if (workItemNumberPrefix) {
                    console.log(`Removing ${workItemNumberPrefix[0]} from ${title}`);
                    await UpdateWorkItem(config, String(workItem.id), [{ op: 'replace', path: '/fields/System.Title', value: sanitizedTitle }]);
                }
                
                console.log(`Skipping ${title}`);
                continue;
            }
    
            if (workItemNumberPrefix) {
                const workItemNumber = Number(workItemNumberPrefix[1])
                if (workItemNumber != currentNumber) {
                    console.log(`Renumbering from ${workItemNumber} to ${currentNumber}: ${title}`);
                    await UpdateWorkItem(config, String(workItem.id), [{ op: 'replace', path: '/fields/System.Title', value: `[${currentNumber.toString().padStart(3, '0')}] ${sanitizedTitle}` }]);
                } else {
                    console.log(`Correct: ${title}`);
                }
            } else {
                console.log(`Adding number ${currentNumber} to ${title}`);
                await UpdateWorkItem(config, String(workItem.id), [{ op: 'replace', path: '/fields/System.Title', value: `[${currentNumber.toString().padStart(3, '0')}] ${sanitizedTitle}` }]);
            }
            currentNumber++;
        }
    
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}