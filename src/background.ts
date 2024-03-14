import renumberBacklog from "./actions/renumberBacklog";
import { GetIterationFromURL } from "./ado/api";
import { SummaryForDateRange, SummaryForIteration } from "./ado/summary";
import { isBGAction } from "./models/actions";
import { isValidConfig, initializeConfig, loadConfig } from "./models/adoConfig";

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
    } else {
      alert('Invalid ADO Power Tools Config');
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
      url: `src/pages/summary/iteration/index.html?team=${message.iteration.team}&iteration=${iteration.id}`
    });
      break;
    case 'GenerateIterationSummary':
      let iterationSummary = await SummaryForIteration(message.team, message.iterationId)
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab?.id, { summary: iterationSummary })
      }
      break;
    case 'GenerateDateRangeSummary':
      let dateRangeSummary = await SummaryForDateRange(message.from, message.to, message.teamReport)
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab?.id, { summary: dateRangeSummary })
    }
      break;
    case 'RenumberBacklog':
      chrome.notifications.create("renumber-start", {
        iconUrl: "src/assets/icons/128.png",
        message: "Starting renumbering...",
        title: "Renumbering backlog",
        type: "basic"
      }, undefined);
      let renumberResult = await renumberBacklog();
      if (renumberResult) {
        chrome.notifications.create("renumber-end", {
          iconUrl: "src/assets/icons/128.png",
          message: "Renumbering completed!",
          title: "Renumbering backlog",
          type: "basic"
        }, undefined);
      } else {
        chrome.notifications.create("renumber-end", {
          iconUrl: "src/assets/icons/128.png",
          message: "Error renumbering backlog!",
          title: "Renumbering backlog",
          type: "basic"
        }, undefined);
      }
  }
});

initializeConfig();