document.addEventListener("DOMContentLoaded", () => {
    // ELEMENT SELECTION
    const inputField = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");
    const emojiButton = document.getElementById("emojiButton");
    const emojiPickerContainer = document.getElementById("emojiPickerContainer");
    const messagesContainer = document.getElementById("messages-container");
    const channelList = document.getElementById("channelList");
    const chatHeader = document.getElementById("chatHeader");
    const fileInput = document.getElementById("fileInput");
    const attachFileButton = document.getElementById("attachFileButton");

    let activePicker = null; // Tracks the currently open picker

    // TEXT INPUT EMOJI PICKER
    emojiButton.addEventListener("click", (event) => {
        event.stopPropagation();
        if (activePicker) {
            activePicker.remove();
            activePicker = null;
            if (activePicker === emojiPickerContainer) return;
        }

        const pickerContainer = document.createElement("div");
        pickerContainer.classList.add("emoji-picker");
        pickerContainer.style.position = "absolute";
        pickerContainer.style.bottom = "60px";
        pickerContainer.style.left = `${emojiButton.offsetLeft}px`;
        pickerContainer.style.zIndex = "100";

        const picker = new EmojiMart.Picker({
            set: "apple",
            onEmojiSelect: (emoji) => {
                inputField.value += emoji.native;
                pickerContainer.remove();
                activePicker = null;
            }
        });

        pickerContainer.appendChild(picker);
        document.body.appendChild(pickerContainer);
        activePicker = pickerContainer;
    });

    // FILE UPLOAD HANDLING
    attachFileButton.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) showFilePreview(fileInput.files[0]);
    });

    const filePreviewContainer = document.createElement("div");
    filePreviewContainer.classList.add("file-preview");
    document.querySelector(".input-area").insertBefore(filePreviewContainer, inputField);

    function showFilePreview(file) {
        filePreviewContainer.innerHTML = "";
        const previewElement = document.createElement("div");
        previewElement.classList.add("file-preview-item");

        if (file.type.startsWith("image/")) {
            const img = document.createElement("img");
            img.src = URL.createObjectURL(file);
            img.classList.add("file-preview-img");
            previewElement.appendChild(img);
        } else {
            const fileName = document.createElement("span");
            fileName.textContent = file.name;
            previewElement.appendChild(fileName);
        }

        const removeButton = document.createElement("button");
        removeButton.textContent = "✖";
        removeButton.classList.add("remove-file-button");
        removeButton.addEventListener("click", () => {
            fileInput.value = "";
            filePreviewContainer.innerHTML = "";
        });

        previewElement.appendChild(removeButton);
        filePreviewContainer.appendChild(previewElement);
    }

    // CHANNEL DATA
    const channels = {
        general: [{ username: "Alice", avatar: "img/avatars/alice.png", text: "hi all", time: "10:00 AM", reactions: {}, file: null }],
        random: [
            { username: "Bob", avatar: "img/avatars/bob.png", text: "birds are cool", time: "10:05 AM", reactions: {}, file: null },
            { username: "Charlie", avatar: "img/avatars/charlie.png", text: "i guess so", time: "10:07 AM", reactions: {}, file: null }
        ],
        tech: [
            { username: "Charlie", avatar: "img/avatars/charlie.png", text: "my PSU blew up...", time: "10:10 AM", reactions: {}, file: null },
            { username: "Alice", avatar: "img/avatars/alice.png", text: "RIP!", time: "10:12 AM", reactions: {}, file: null }
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

    // SEND MESSAGE FUNCTIONALITY
    function sendMessage() {
        const messageText = inputField.value.trim();
        const file = fileInput.files.length > 0 ? fileInput.files[0] : null;

        if (!messageText && !file) return;

        const activeChannel = document.querySelector(".channel.active")?.dataset.channel;
        if (!activeChannel) {
            console.error("No active channel selected.");
            return;
        }

        const messageData = {
            username: "You",
            avatar: "img/avatars/user.png",
            text: messageText,
            time: new Date().toLocaleTimeString(),
            reactions: {},
            file: file ? { name: file.name, type: file.type, url: URL.createObjectURL(file) } : null
        };

        channels[activeChannel].push(messageData);
        addMessageToChat(messageData);

        inputField.value = "";
        fileInput.value = "";
        filePreviewContainer.innerHTML = "";
    }

    function addMessageToChat(message) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message");

        const avatar = document.createElement("div");
        avatar.classList.add("avatar");
        avatar.style.backgroundImage = `url('${message.avatar}')`;

        const messageContent = document.createElement("div");
        messageContent.classList.add("message-content");
        messageContent.innerHTML = `
            <span class="username">${message.username}</span>
            <p>${message.text}</p>
            ${message.file ? displayFile(message.file) : ""}
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

    function displayFile(file) {
        return file.type.startsWith("image/")
            ? `<img src="${file.url}" class="chat-image" alt="Uploaded Image">`
            : `<a href="${file.url}" target="_blank" class="chat-file">${file.name}</a>`;
    }

    // REACTION FUNCTIONALITY
    function showReactionPicker(reactionsContainer, message, button) {
        closeAllPickers();

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
                activePicker = null;
            }
        });

        pickerContainer.appendChild(reactionPicker);
        button.parentNode.appendChild(pickerContainer);
        activePicker = pickerContainer;
    }

    function addReaction(reactionsContainer, message, emoji) {
        message.reactions[emoji] = (message.reactions[emoji] || 0) + 1;
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

    function closeAllPickers() {
        if (activePicker) activePicker.remove();
        activePicker = null;
        document.querySelectorAll(".reaction-picker").forEach(el => el.remove());
    }

    sendButton.addEventListener("click", sendMessage);
    inputField.addEventListener("keypress", (event) => {
        if (event.key === "Enter") sendMessage();
    });

    loadChannel("general");
});