import { Proposed } from "./proposed/proposed";
import { Timeline } from "./timeline/timeline";

const proposedInstance = new Proposed();
setTimeout(() => proposedInstance.start(), 2000);

const timelineInstance = new Timeline();
setTimeout(() => timelineInstance.start(), 2000);
