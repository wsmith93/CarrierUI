document.addEventListener("DOMContentLoaded", () => {
    const inputField = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");
    const emojiButton = document.getElementById("emojiButton");
    const messagesContainer = document.getElementById("messages-container");
    const channelList = document.getElementById("channelList");
    const chatHeader = document.getElementById("chatHeader");
    const fileInput = document.getElementById("fileInput");
    const attachFileButton = document.getElementById("attachFileButton");
    const emojiPickerContainer = document.createElement("div");
    document.body.appendChild(emojiPickerContainer);

	/** Very basic backend integration using WebSockets. The rest of the functionality is basically a lot of event listeners. The script uses DOM storage at the moment. **/

    let activePicker = null;
    let currentChannel = "general";
    const API_URL = "http://localhost:3000/api"; /** Placeholder of course! **/
    const messageCache = {};

    /** Restore Missing File Preview Container */
    const filePreviewContainer = document.createElement("div");
    filePreviewContainer.classList.add("file-preview");
    document.querySelector(".input-area").insertBefore(filePreviewContainer, inputField);

    /** Fetch and Load Channels */
    async function fetchChannels() {
        try {
            const response = await fetch(`${API_URL}/channels`);
            const channelsData = await response.json();
            channelList.innerHTML = "";

            channelsData.forEach(channel => {
                const channelElement = document.createElement("li");
                channelElement.classList.add("channel");
                channelElement.dataset.channel = channel.id;
                channelElement.textContent = `# ${channel.name}`;
                if (channel.id === "general") channelElement.classList.add("active");
                channelList.appendChild(channelElement);
            });

            loadChannel("general");
        } catch (error) {
            console.error("Error fetching channels:", error);
        }
    }

    /** Fetch Messages for Selected Channel */
    async function fetchMessages(channel) {
        if (messageCache[channel]) {
            messagesContainer.innerHTML = ""; 
            messageCache[channel].forEach(msg => addMessageToChat(msg));
            return;
        }

        try {
            const response = await fetch(`${API_URL}/messages?channel=${channel}`);
            const messages = await response.json();
            messagesContainer.innerHTML = ""; 
            messages.forEach(msg => addMessageToChat(msg));
            messageCache[channel] = messages;
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    }

    /** Load Selected Channel */
    function loadChannel(channel) {
        if (currentChannel === channel) return;
        currentChannel = channel;
        chatHeader.textContent = `# ${channel}`;
        messagesContainer.innerHTML = "";
        fetchMessages(channel);
    }

    channelList.addEventListener("click", (event) => {
        if (event.target.classList.contains("channel")) {
            document.querySelectorAll(".channel").forEach(ch => ch.classList.remove("active"));
            event.target.classList.add("active");
            loadChannel(event.target.dataset.channel);
        }
    });

    /** Send Message */
    async function sendMessage() {
		const messageText = inputField.value.trim();
		const file = fileInput.files.length > 0 ? fileInput.files[0] : null;

		if (!messageText && !file) return;

		const activeChannel = currentChannel;
		if (!activeChannel) return;

		const formData = new FormData();
		formData.append("channel", activeChannel);
		formData.append("username", "You");
		formData.append("avatar", "img/avatars/user.png");
		formData.append("text", messageText);
		formData.append("time", new Date().toLocaleTimeString());
		if (file) formData.append("file", file);

		const tempMessage = {
			id: Date.now(),
			username: "You",
			avatar: "img/avatars/user.png",
			text: messageText,
			time: new Date().toLocaleTimeString(),
			reactions: {},
			file: file ? { name: file.name, type: file.type, url: URL.createObjectURL(file) } : null
		};

		addMessageToChat(tempMessage);

		if (!messageCache[activeChannel]) messageCache[activeChannel] = [];
		messageCache[activeChannel].push(tempMessage);

		// **Instantly clear input and file preview**
		inputField.value = "";
		fileInput.value = "";
		filePreviewContainer.innerHTML = "";

		try {
			const response = await fetch(`${API_URL}/messages`, {
				method: "POST",
				body: formData
			});

			if (!response.ok) {
				console.error("Error sending message:", await response.text());
				return;
			}

			const newMessage = await response.json();
			console.log("Message sent:", newMessage);
		} catch (error) {
			console.error("Error sending message:", error);
		}
	}

    sendButton.addEventListener("click", sendMessage);
    inputField.addEventListener("keypress", (event) => {
        if (event.key === "Enter") sendMessage();
    });

    /** Add Message to Chat */
    function addMessageToChat(message) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message");

        const avatar = document.createElement("div");
        avatar.classList.add("avatar");
        avatar.style.backgroundImage = `url('${message.avatar}')`;

        const messageContent = document.createElement("div");
        messageContent.classList.add("message-content");
        messageContent.innerHTML = `
			<div class="message-header">
				<span class="username">${message.username}</span>
				<span class="time">${message.time}</span>
			</div>
			<p>${message.text}</p>
			${message.file ? displayFile(message.file) : ""}
			<div class="reactions"></div>
		`;

        const reactionContainer = document.createElement("div");
        reactionContainer.classList.add("reaction-container");

        const reactionButton = document.createElement("button");
        reactionButton.classList.add("reaction-button");
        reactionButton.textContent = "+😀";
        reactionButton.addEventListener("click", (event) => {
            event.stopPropagation();
            showReactionPicker(messageContent.querySelector(".reactions"), message, reactionButton);
        });

        reactionContainer.appendChild(reactionButton);
        messageElement.appendChild(avatar);
        messageElement.appendChild(messageContent);
        messageElement.appendChild(reactionContainer);

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function displayFile(file) {
        return file.type.startsWith("image/")
            ? `<img src="${file.url}" class="chat-image" alt="Uploaded Image">`
            : `<a href="${file.url}" target="_blank" class="chat-file">${file.name}</a>`;
    }

	/** Reaction Picker */
	function showReactionPicker(reactionsContainer, message, button) {
		closeAllPickers();

		const pickerContainer = document.createElement("div");
		pickerContainer.classList.add("emoji-picker", "reaction-picker");

		// Get the button position relative to the viewport
		const buttonRect = button.getBoundingClientRect();

		pickerContainer.style.position = "fixed"; // Fix position relative to viewport
		pickerContainer.style.top = `${buttonRect.top + window.scrollY + 30}px`; // Place it below the button
		pickerContainer.style.left = `${buttonRect.left + window.scrollX}px`; // Align horizontally

		const reactionPicker = new EmojiMart.Picker({
			set: "apple",
			onEmojiSelect: (emoji) => {
				addReaction(reactionsContainer, message, emoji.native);
				pickerContainer.remove();
				activePicker = null;
			}
		});

		pickerContainer.appendChild(reactionPicker);
		document.body.appendChild(pickerContainer);
		activePicker = pickerContainer;
	}

	/** Reaction Handling */
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
	}

    /** Restore Text Input Emoji Picker */
    emojiButton.addEventListener("click", (event) => {
        event.stopPropagation();

        if (activePicker) {
            activePicker.remove();
            activePicker = null;
            return;
        }

        const picker = new EmojiMart.Picker({
            set: "apple",
            onEmojiSelect: (emoji) => {
                inputField.value += emoji.native;
                emojiPickerContainer.remove();
                activePicker = null;
            }
        });

        emojiPickerContainer.innerHTML = "";
        emojiPickerContainer.appendChild(picker);
        emojiPickerContainer.style.position = "absolute";
        emojiPickerContainer.style.bottom = "60px";
        emojiPickerContainer.style.left = `${emojiButton.offsetLeft}px`;
        emojiPickerContainer.style.zIndex = "100";
        activePicker = emojiPickerContainer;
    });

    /** File Upload Preview */
    attachFileButton.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) showFilePreview(fileInput.files[0]);
    });

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

        filePreviewContainer.appendChild(previewElement);
    }

    /** Load Initial Data */
    fetchChannels();
    loadChannel("general");
});
