// IMO AI Shopping Assistant - Popup Script

document.addEventListener('DOMContentLoaded', () => {
    const aiShoppingBtn = document.getElementById('ai-shopping-btn');
    const termsLink = document.getElementById('terms-link');

    // Handle AI Shopping Results button click
    aiShoppingBtn.addEventListener('click', async () => {
        // Get the currently active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab.id) {
            try {
                // First, try to send message to trigger analyze_content
                await chrome.tabs.sendMessage(tab.id, { action: "activate_imo_ui" });
                console.log("IMO Extension: Popup triggered analyze_content action.");
            } catch (error) {
                console.warn("IMO Extension: Content script not ready. Injecting scripts...", error);
                try {
                    // Inject CSS and JS if not already present
                    await chrome.scripting.insertCSS({
                        target: { tabId: tab.id },
                        files: ["src/styles.css"]
                    });
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ["src/content.js"]
                    });

                    // Retry sending the message after injection
                    await chrome.tabs.sendMessage(tab.id, { action: "activate_imo_ui" });
                    console.log("IMO Extension: Scripts injected and action sent.");
                } catch (injectionError) {
                    console.error("IMO Extension: Script injection failed.", injectionError);
                    alert("Unable to analyze this page. Please try on a product page.");
                }
            }
        }

        // Close the popup after triggering the action
        window.close();
    });

    // Handle Terms & Conditions link
    termsLink.addEventListener('click', () => {
        chrome.tabs.create({
            url: "https://informedmarketopinions.com/terms-and-conditions"
        });
    });
});
