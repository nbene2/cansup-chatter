import { processTranscript, TranscribeResult } from './lib/transcript-processor';

const mockData: TranscribeResult = {
    results: {
        items: [
            {
                speaker_label: "spk_0",
                type: "pronunciation",
                alternatives: [{ content: "Hello", confidence: "1.0" }]
            },
            {
                speaker_label: "spk_0",
                type: "pronunciation",
                alternatives: [{ content: "um", confidence: "1.0" }] // Filler to be removed
            },
            {
                type: "punctuation",
                alternatives: [{ content: ",", confidence: "1.0" }],
                speaker_label: "spk_0" // Sometimes punctuation has speaker_label, sometimes not, logic shouldn't crash
            },
            {
                speaker_label: "spk_0",
                type: "pronunciation",
                alternatives: [{ content: "world", confidence: "1.0" }]
            },
            {
                speaker_label: "spk_1",
                type: "pronunciation",
                alternatives: [{ content: "Hi", confidence: "1.0" }]
            },
            {
                speaker_label: "spk_1",
                type: "pronunciation",
                alternatives: [{ content: "there", confidence: "1.0" }]
            },
            {
                speaker_label: "spk_1",
                type: "pronunciation",
                alternatives: [{ content: "uh", confidence: "1.0" }] // Filler to be removed
            },
            {
                type: "punctuation",
                alternatives: [{ content: ".", confidence: "1.0" }],
                speaker_label: "spk_1"
            }
        ]
    }
};

const result = processTranscript(mockData);
console.log("Result:");
console.log(result);

// Expected:
// spk_0: Hello, world
// spk_1: Hi there.
const expected1 = "spk_0: Hello, world";
const expected2 = "spk_1: Hi there.";

if (result.includes(expected1) && result.includes(expected2) && !result.includes("um") && !result.includes("uh")) {
    console.log("VERIFICATION PASSED");
} else {
    console.log("VERIFICATION FAILED");
    console.log(`Expected to contain: "${expected1}" and "${expected2}" and NO "um"/"uh"`);
    process.exit(1);
}
