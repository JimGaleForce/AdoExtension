import { GetItemsFromIteration, GetIterations } from "./ado/api";
import { SummaryForIteration } from "./ado/summary";
import { loadConfig } from "./models/adoConfig";

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

const loadLatestIteration = async () => {
  const config = await loadConfig();

  const iterationsJson = await GetIterations(config, true);
  const currentIterationId = iterationsJson.value[0].id;

  const itemsJson = await GetItemsFromIteration(config, currentIterationId);
  const currentItemIds = itemsJson.workItemRelations.map((item: any) => item.target.id);

  const data = await chrome.storage.sync.get([currentIterationId]);
  const pastItemIds = data[currentIterationId] ?? [];

  // Remove duplicate item ids and then store.
  chrome.storage.sync.set({[currentIterationId]:[...new Set(currentItemIds.concat(pastItemIds))]});
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
  const {action, iteration} = message;

  if (!action || !iteration) {
    return;
  }

  if (action === "iterationSummary") {
    const summaryTab = await chrome.tabs.create({
      active: true,
      url: 'src/pages/summary/index.html'
    });

    if (!summaryTab.id) { return; }

    await chrome.tabs.sendMessage(summaryTab.id, {
      generating: true,
      iteration: iteration
    })

    // let summary = await SummaryForIteration(iteration.id)

    await chrome.tabs.sendMessage(summaryTab.id, {
      summary: "test"
    })
  }
});

loadLatestIteration();
