console.log("Email Extension - Loaded content script.+");

function createAIButton() {
    const button = document.createElement('div');
    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3';
    button.style.marginRight = '8px';
    button.innerHTML = 'AI Assist';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Generate email with AI');
    return button;
}

function findComposeToolbar() {
    const selectors = [
        '.btC',
        '.aDh',
        '[role="dialog"]',
        '.gU.Up'
    ];
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
            console.log("Compose toolbar found using selector:", selector);
            return toolbar;
        }
        return null;
    }
}
function getEmailBody() {
    const selectors = [
        '.h7',
        '.a3s.aiL',
        'gamil_quote',
        '[role="presentation"]'
    ];
    for (const selector of selectors) {
        const emailBody = document.querySelector(selector);
        if (emailBody) return emailBody.innerText.trim();
        return '';
    }
}

function injectButton() {
    const existingButton = document.querySelector('.custom-ai-button');
    if (existingButton) existingButton.remove();

    const toolbar = findComposeToolbar();
    if (!toolbar) return;

    const button = createAIButton();
    button.classList.add('custom-ai-button');

    button.addEventListener('click', async () => {
        try {
            button.innerHTML = 'Generating...';
            button.disabled = true;

            const emailContent = getEmailBody();
            const response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailContent: emailContent,
                    tone: 'professional',
                })
            })

            if(!response.ok) throw new Error('API request failed');

            const generatedResponse = await response.text();
            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');
            if(composeBox) {
                composeBox.focus();
                document.execCommand('insertText', false, generatedResponse);
            } else {
                console.error('Compose box not found');
            }   
        } catch (error) {

            console.error('Error generating email:', error);
        } finally {
            button.innerHTML = 'AI Assist';
            button.disabled = false;
        }
});

    toolbar.insertBefore(button, toolbar.firstChild);
}

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches('.aDh, .btC, [role="dialog"]') || node.querySelector('.aDh, .btC, [role="dialog"]'))
        );

        if (hasComposeElements) {
            console.log("Compose Window has been detected!");
            setTimeout(injectButton, 500);
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });