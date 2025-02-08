import { OpenCycleSummaryAction, OpenIterationSummaryAction } from "../models/actions";

// @ts-ignore: valid import
import mainWorld from "./content-script-main-world?script&module";

const script = document.createElement("script");
script.src = chrome.runtime.getURL(mainWorld);
script.type = "module";
script.addEventListener("load", () => {
    console.log("script loaded");
});
script.addEventListener("error", (err) => {
    console.log("script error");
    console.error(err);
});

console.log("starting script");
document.head.append(script);


document.addEventListener('getSummaryForCycle', function (e: any) {
    const cycle = e.detail;

    if (cycle) {
        const action: OpenCycleSummaryAction = {
            action: 'OpenCycleSummary',
            cycle
        }
        chrome.runtime.sendMessage(action , (resp) => {});
    }
});

document.addEventListener('getSummaryForIteration', function (e: any) {
    const iteration = e.detail;

    if (iteration) {
        const action: OpenIterationSummaryAction = {
            action: 'OpenIterationSummary',
            iteration
        }
        chrome.runtime.sendMessage(action , (resp) => {});
    }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.error) {
        console.error(message.error);
        alert(message.error);
    }
});