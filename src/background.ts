import { GetIterationFromURL } from "./ado/api";
import { SummaryForIteration } from "./ado/summary";
import { isBGAction } from "./models/actions";
import { isValidConfig, initializeConfig } from "./models/adoConfig";

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

    // Get iteration
    const iteration = await GetIterationFromURL(message.iteration);

    if (iteration === undefined) {
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, { error: 'Unable to get iteration information' })
      } 
      return;
    }

    await chrome.tabs.create({
      active: true,
      url: `src/pages/summary/index.html?team=${message.iteration.team}&iteration=${iteration.id}`
    });
      break;
    case 'GenerateIterationSummary':
      let summary = await SummaryForIteration(message.team, message.iterationId)
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab?.id, { summary })
      }
      break;
  }
});

initializeConfig();