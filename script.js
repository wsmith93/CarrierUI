document.addEventListener("DOMContentLoaded", () => {
    const inputField = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");
    const emojiButton = document.getElementById("emojiButton");
    const emojiPickerContainer = document.getElementById("emojiPickerContainer");
    const messagesContainer = document.getElementById("messages-container");
    const channelList = document.getElementById("channelList");
    const chatHeader = document.getElementById("chatHeader");

    let chatEmojiPickerVisible = false;

    emojiButton.addEventListener("click", (event) => {
        event.stopPropagation();

        if (emojiPickerContainer.style.display === "none") {
            closeAllEmojiPickers();

            emojiPickerContainer.innerHTML = "";
            const picker = new EmojiMart.Picker({
                set: "apple",
                onEmojiSelect: (emoji) => {
                    inputField.value += emoji.native;
                    emojiPickerContainer.style.display = "none";
                }
            });

            emojiPickerContainer.appendChild(picker);
            emojiPickerContainer.style.display = "block";
        } else {
            emojiPickerContainer.style.display = "none";
        }
    });

    const channels = {
        general: [
            { username: "Alice", avatar: "avatars/alice.png", text: "hi all", time: "10:00 AM", reactions: {} }
        ],
        random: [
            { username: "Bob", avatar: "avatars/bob.png", text: "birds are cool", time: "10:05 AM", reactions: {} },
            { username: "Charlie", avatar: "avatars/charlie.png", text: "i guess so", time: "10:07 AM", reactions: {} }
        ],
        tech: [
            { username: "Charlie", avatar: "avatars/charlie.png", text: "my PSU blew up...", time: "10:10 AM", reactions: {} },
            { username: "Alice", avatar: "avatars/alice.png", text: "RIP!", time: "10:12 AM", reactions: {} }
        ]
    };

    function loadChannel(channel) {
        messagesContainer.innerHTML = "";
        chatHeader.textContent = `# ${channel}`;
        channels[channel].forEach(message => addMessageToChat(message));
    }

    channelList.addEventListener("click", (event) => {
        if (event.target.classList.contains("channel")) {
            document.querySelectorAll(".channel").forEach(ch => ch.classList.remove("active"));
            event.target.classList.add("active");
            loadChannel(event.target.dataset.channel);
        }
    });

    function sendMessage() {
        const messageText = inputField.value.trim();
        if (messageText === "") return;

        const activeChannel = document.querySelector(".channel.active")?.dataset.channel;
        if (!activeChannel) {
            console.error("No active channel selected.");
            return;
        }

        const messageData = {
            username: "You",
            avatar: "avatars/user.png",
            text: messageText,
            time: new Date().toLocaleTimeString(),
            reactions: {}
        };

        channels[activeChannel].push(messageData);
        addMessageToChat(messageData);
        inputField.value = "";
    }

    function addMessageToChat(message) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message");

        // Create avatar
        const avatar = document.createElement("div");
        avatar.classList.add("avatar");
        avatar.style.backgroundImage = `url('${message.avatar}')`;

        // Create message content
        const messageContent = document.createElement("div");
        messageContent.classList.add("message-content");
        messageContent.innerHTML = `
            <span class="username">${message.username}</span>
            <p>${message.text}</p>
            <span class="time">${message.time}</span>
            <div class="reactions"></div>
        `;

        const reactionContainer = document.createElement("div");
        reactionContainer.classList.add("reaction-container");

        const reactionButton = document.createElement("button");
        reactionButton.classList.add("reaction-button");
        reactionButton.textContent = "😀";

        reactionContainer.appendChild(reactionButton);

        messageElement.appendChild(avatar);
        messageElement.appendChild(messageContent);
        messageElement.appendChild(reactionContainer);

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        reactionButton.addEventListener("click", (event) => {
            event.stopPropagation();
            showReactionPicker(messageContent.querySelector(".reactions"), message, reactionButton);
        });

        updateReactionsUI(messageContent.querySelector(".reactions"), message.reactions);
    }

    function showReactionPicker(reactionsContainer, message, button) {
        document.querySelectorAll(".reaction-picker").forEach(el => el.remove());

        const pickerContainer = document.createElement("div");
        pickerContainer.classList.add("emoji-picker", "reaction-picker");

        pickerContainer.style.position = "absolute";
        pickerContainer.style.top = `${button.offsetTop + 30}px`;
        pickerContainer.style.left = `${button.offsetLeft}px`;

        const reactionPicker = new EmojiMart.Picker({
            set: "apple",
            onEmojiSelect: (emoji) => {
                addReaction(reactionsContainer, message, emoji.native);
                pickerContainer.remove();
            }
        });

        pickerContainer.appendChild(reactionPicker);
        button.parentNode.appendChild(pickerContainer);
    }

    function addReaction(reactionsContainer, message, emoji) {
        if (!message.reactions[emoji]) {
            message.reactions[emoji] = 1;
        } else {
            message.reactions[emoji]++;
        }

        updateReactionsUI(reactionsContainer, message.reactions);
    }

    function updateReactionsUI(reactionsContainer, reactions) {
        reactionsContainer.innerHTML = "";

        for (const [emoji, count] of Object.entries(reactions)) {
            const reactionElement = document.createElement("span");
            reactionElement.classList.add("reaction");
            reactionElement.innerText = `${emoji} ${count}`;
            reactionsContainer.appendChild(reactionElement);
        }
    }

    function closeAllEmojiPickers() {
        document.querySelectorAll(".reaction-picker").forEach(el => el.remove());
    }

    function closeReactionPickers() {
        document.querySelectorAll(".reaction-picker").forEach(el => el.remove());
    }

    sendButton.addEventListener("click", sendMessage);
    inputField.addEventListener("keypress", (event) => {
        if (event.key === "Enter") sendMessage();
    });

    loadChannel("general");
});
