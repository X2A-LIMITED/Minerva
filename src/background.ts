chrome.action.onClicked.addListener(async tab => {
    void tab;
});

chrome.runtime.onMessage.addListener(async (message, sender) => {
    if (message.action !== 'setIcon' || !sender?.tab?.id) {
        return;
    }

    const iconPath = message.icon;

    chrome.action
        .setIcon({
            tabId: sender.tab.id,
            path: {
                16: iconPath,
                48: iconPath.replace('-16', '-48'),
                128: iconPath.replace('-16', '-128'),
            },
        })
        .catch(err => console.error('Failed to set icon:', err));
});
