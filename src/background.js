// IMO AI Shopping Assistant - Background Script

console.log("IMO Extension: Background script loaded.");

// CONFIGURATION
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"; // REPLACE THIS WITH YOUR ACTUAL KEY
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Listen for the extension icon click
chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
        console.log("IMO Extension: Icon clicked. Sending message to tab", tab.id);
        chrome.tabs.sendMessage(tab.id, { action: "activate_imo_ui" }).catch((error) => {
            console.warn("IMO Extension: Could not send message to tab. Content script might not be loaded.", error);
            // Optional: Inject script if not loaded (requires 'scripting' permission)
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["src/content.js"]
            });
        });
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyze_content") {
        console.log("IMO Extension: Received analysis request.");

        // We must return true to indicate we will send a response asynchronously
        handleAnalysis(request.content).then(sendResponse);
        return true;
    }
});

async function handleAnalysis(content) {
    if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
        console.warn("IMO Extension: Gemini API Key is missing.");
        return { productName: null, error: "API Key missing" };
    }

    try {
        const prompt = `
        You are an AI shopping assistant. Extract the exact product name from the following web page content.
        Return ONLY the product name. Do not include "The product name is" or any other text.
        If you cannot find a product name, return "Unknown Product".

        Page Content:
        ${content}
        `;

        const response = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            const productName = data.candidates[0].content.parts[0].text.trim();
            console.log("IMO Extension: Gemini extracted product name:", productName);
            return { productName: productName };
        } else {
            console.error("IMO Extension: Unexpected Gemini response:", data);
            return { productName: null };
        }

    } catch (error) {
        console.error("IMO Extension: Error calling Gemini API:", error);
        return { productName: null, error: error.message };
    }
}
