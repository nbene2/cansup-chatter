const report = `
Section 1: By the Numbers
3 speakers: Dr Smith
Section 2: Word Chart
| Word | Frequency | Context |
|---|---|---|
| cancer | 5 | discussing diagnosis |
| treatment | 3 | next steps |
Section 3: Conversation summary
1 conditions
`;

function parseWordChart(report) {
    const startMarker = "Section 2: Word"; // Loose match to catch "Word chart" or "Word Chart"
    const endMarker = "Section 3";

    const startIndex = report.indexOf(startMarker);
    if (startIndex === -1) return [];

    const endIndex = report.indexOf(endMarker, startIndex);
    const chartSection = report.slice(startIndex, endIndex === -1 ? undefined : endIndex);

    const lines = chartSection.split('\n');
    const data = [];

    // Very basic markdown table parser
    for (const line of lines) {
        if (line.includes('|')) {
            // Remove leading/trailing pipes and split
            const row = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
            if (row.length >= 2 && !line.includes('---')) { // Skip separator lines
                data.push(row);
            }
        }
    }

    return data;
}

console.log(parseWordChart(report));
