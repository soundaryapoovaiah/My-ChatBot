const promptInput = document.querySelector("#prompt");
const submitBtn = document.querySelector("#submit");
const chatContainer = document.querySelector(".chat-container");
const imageBtn = document.querySelector("#image");
const image = document.querySelector("#image img");
const imageInput = document.querySelector("#image input");

// NOTE: This works technically, but do NOT keep API keys in frontend code for production.
const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY_HERE";

let user = {
  message: null,
  file: null,
};

function createChatBox(html, classes) {
  const div = document.createElement("div");
  div.innerHTML = html;
  div.classList.add(classes);
  return div;
}

async function generateResponse(aiChatBox) {
  const text = aiChatBox.querySelector(".AI-chat-area");

  try {
    const parts = [{ text: user.message }];

    if (user.file && user.file.data) {
      parts.push({
        inline_data: {
          mime_type: user.file.mime_type,
          data: user.file.data,
        },
      });
    }

    const requestBody = {
      contents: [
        {
          parts: parts,
        },
      ],
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || "Request failed");
    }

    const apiResponse =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I could not generate a response.";

    text.innerHTML = apiResponse
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .trim();
  } catch (error) {
    console.error("Gemini API error:", error);
    text.innerHTML = `Sorry, something went wrong: ${error.message}`;
  } finally {
    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: "smooth",
    });

    image.src = "img.svg";
    image.classList.remove("choose");
    user.file = null;
  }
}

function handleChatResponse(userMessage) {
  if (!userMessage.trim()) return;

  user.message = userMessage;

  const userHtml = `
    <div class="user-chat-area">
      ${user.message}
      ${user.file && user.file.data ? "<img src='data:" + user.file.mime_type + ";base64," + user.file.data + "' class='chooseimg' />" : ""}
    </div>
    <img src="girl.png" alt="user" id="userImage" width="50">
  `;

  promptInput.value = "";

  const userChatBox = createChatBox(userHtml, "user-chat-box");
  chatContainer.appendChild(userChatBox);

  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: "smooth",
  });

  setTimeout(() => {
    const aiHtml = `
      <img src="ai.png" alt="ai" id="aiImage" width="50">
      <div class="AI-chat-area">
        <img src="loading.webp" alt="loading" class="load" width="50px">
      </div>
    `;

    const aiChatBox = createChatBox(aiHtml, "AI-chat-box");
    chatContainer.appendChild(aiChatBox);
    generateResponse(aiChatBox);
  }, 600);
}

promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleChatResponse(promptInput.value);
  }
});

submitBtn.addEventListener("click", () => {
  handleChatResponse(promptInput.value);
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64String = e.target.result.split(",")[1];
    user.file = {
      mime_type: file.type,
      data: base64String,
    };

    image.src = `data:${user.file.mime_type};base64,${user.file.data}`;
    image.classList.add("choose");
  };

  reader.readAsDataURL(file);
});

imageBtn.addEventListener("click", () => {
  imageInput.click();
});
