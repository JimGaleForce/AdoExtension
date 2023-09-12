import { GetItemsFromIteration, GetIterations } from "./ado/api";
import { SummaryForDateRange, SummaryForIteration } from "./ado/summary";
import { isBGAction } from "./models/actions";
import { loadConfig, isValidConfig, initializeConfig } from "./models/adoConfig";

var adoxChanged = true;

chrome.runtime.onMessage.addListener(
  async (message, sender, sendResponse) => {
    if (message === 'adox-colors-updated') {
      adoxChanged = true;
    }
    if (message === 'adox-check') {
      var was = adoxChanged;
      adoxChanged = false;
      await sendResponse(was);
    }
    return true;
  }
);

const loadIteration = async (iterationId: string) => {
  const config = await loadConfig();
  const itemsJson = await GetItemsFromIteration(config, iterationId);
  const currentItemIds = itemsJson.workItemRelations.map((item: any) => item.target.id);

  const data = await chrome.storage.sync.get([iterationId]);
  const pastItemIds = data[iterationId] ?? [];

  // Remove duplicate item ids and then store.
  chrome.storage.sync.set({[iterationId]:[...new Set(currentItemIds.concat(pastItemIds))]});
}


const loadLatestIteration = async () => {
  const config = await loadConfig();

  const iterationsJson = await GetIterations(config, true);
  const currentIterationId = iterationsJson.value[0].id;

  loadIteration(currentIterationId);
}

chrome.alarms.create(
  {
    periodInMinutes: 1440 // once every day
  }
)

chrome.alarms.onAlarm.addListener(
  async function(alarm) {
    await loadLatestIteration();
  }
)

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

  if (!isBGAction(message)) {
    return;
  }

  const validConfig = await isValidConfig();

  if (validConfig === false) {
    if (sender.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, { error: 'Invalid ADO Power Tools Config' })
    }
    return;
  }

  switch (message.action) {
    case 'OpenIterationSummary':
    const validConfig = await isValidConfig();

    if (validConfig === false) {
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, { error: 'Invalid ADO Power Tools Config' })
      } 
      return;
    }

    await chrome.tabs.create({
      active: true,
      url: `src/pages/summary/index.html?iteration=${message.iteration.id}`
    });
      break;
    case 'GenerateIterationSummary':
      await loadIteration(message.iterationId);

      let summary = await SummaryForIteration(message.iterationId)
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab?.id, { summary })
      }
      break;
  }
});

initializeConfig()
  .then(() => SummaryForDateRange(new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 * 2), new Date()));
  // .then(() => loadLatestIteration());