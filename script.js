/* Most of this functionality is a placeholder, just to have some kind of prototype UI, with static and arbitrary variables that we'll hopefully replace with dynamic variables. */

document.addEventListener("DOMContentLoaded", () => {
    const inputField = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");
    const emojiButton = document.getElementById("emojiButton");
    const emojiPickerContainer = document.getElementById("emojiPickerContainer");
    const messagesContainer = document.getElementById("messages-container");
    const channelList = document.getElementById("channelList");
    const chatHeader = document.getElementById("chatHeader");
	
	const picker = new EmojiMart.Picker({
		set: "apple",
		onEmojiSelect: (emoji) => {
			inputField.value += emoji.native; // Append emoji to input field
			emojiPickerContainer.style.display = "none"; // Hide after selection
		}
	});
	emojiPickerContainer.appendChild(picker);


    const channels = {
        general: [
        	{ username: "Alice", avatar: "avatars/alice.png", text: "hi all", time: "10:00 AM" }
        ],
        random: [
            	{ username: "Bob", avatar: "avatars/bob.png", text: "birds are cool", time: "10:05 AM" }
		{ username: "Charlie", avatar: "avatars/charlie.png", text: "i guess so", time: "10:07 AM" }
        ],
        tech: [
            	{ username: "Charlie", avatar: "avatars/charlie.png", text: "my PSU blew up...", time: "10:10 AM" }
		{ username: "Alice", avatar: "avatars/alice.png", text: "RIP!", time: "10:12 AM" }
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

        const activeChannel = document.querySelector(".channel.active").dataset.channel;
        const messageData = {
            username: "You",
            avatar: "avatars/user.png",
            text: messageText,
            time: new Date().toLocaleTimeString(),
        };

        channels[activeChannel].push(messageData);
        addMessageToChat(messageData);
        inputField.value = "";
    }

    function addMessageToChat(message) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message");
        messageElement.innerHTML = `
            <div class="avatar" style="background-image: url('${message.avatar}');"></div>
            <div class="message-content">
                <span class="username">${message.username}</span>
                <p>${message.text}</p>
                <span class="time">${message.time}</span>
            </div>
        `;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    sendButton.addEventListener("click", sendMessage);
    inputField.addEventListener("keypress", (event) => {
        if (event.key === "Enter") sendMessage();
    });
	
	emojiButton.addEventListener("click", () => {
		emojiPickerContainer.style.display = emojiPickerContainer.style.display === "none" ? "block" : "none";
	});

    loadChannel("general");
});
