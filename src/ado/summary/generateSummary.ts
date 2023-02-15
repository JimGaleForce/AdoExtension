// Generates a proper ADO Summary for a given iteration 
export default function GenerateADOSummary(iterationId: string, workItems: string[]) {
    // For each item:
    // - Get state of item as it was during the start of the specified iteration 
    // - Get history of item, looking only at the changes during the sprint
    // - Figure out if item is of relevance to us in any capacity
    // - Tag item with any metadata 
    // - Save item to output if relevant
    // 
    // After this, output a markdown of all output items

    // First - get data about specified iteration (start date / end date)
    
}