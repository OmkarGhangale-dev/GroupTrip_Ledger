import React, { useState, useRef, useEffect } from "react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Available models on this Groq account in priority order
const MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-20b",
];

const QUICK_PROMPTS = [
  { icon: "🏛️", text: "Top tourist spots" },
  { icon: "🗓️", text: "Create full day-by-day plan" },
  { icon: "🍽️", text: "Best local food & restaurants" },
  { icon: "🏨", text: "Top places to stay" },
  { icon: "🌄", text: "Adventure & hidden gems" },
  { icon: "🚗", text: "Travel tips & budget guide" },
];

function buildSystemPrompt(trip, itinerary) {
  const destination = trip?.destination || trip?.name || "the destination";
  const startDate = trip?.start_date
    ? new Date(trip.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "TBD";
  const endDate = trip?.end_date
    ? new Date(trip.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "TBD";

  let dayScheduleInfo = "";
  if (trip?.start_date && trip?.end_date) {
    const s = new Date(trip.start_date);
    const e = new Date(trip.end_date);
    let d = 1;
    const days = [];
    const cur = new Date(s);
    while (cur <= e && d <= 30) {
      days.push(`Day ${d}: ${cur.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}`);
      cur.setDate(cur.getDate() + 1);
      d++;
    }
    dayScheduleInfo = `Trip Schedule Days:\n` + days.join("\n");
  }

  const existingItems = itinerary && itinerary.length > 0
    ? itinerary.map(i => `- ${i.title} (${i.item_type || "ACTIVITY"}) on ${i.date || "unscheduled"}`).join("\n")
    : "No items scheduled yet.";

  return `You are TravelBot 🌍, an expert, enthusiastic AI travel planner and local tour guide for GroupTrip Ledger.
You have comprehensive knowledge of global travel, and deep expertise in Indian destinations (Uttarakhand, Himachal, Goa, Rajasthan, Kerala, Kashmir, etc.) and worldwide landmarks.

TRIP CONTEXT:
- Destination: ${destination}
- Travel Dates: ${startDate} to ${endDate}
${dayScheduleInfo ? `\n${dayScheduleInfo}\n` : ""}
- Group Size: ${trip?.participant_count || "multiple"} travelers
- Budget: ${trip?.budget ? "₹" + trip.budget : "Moderate"}

CURRENT ITINERARY:
${existingItems}

INTERACTIVE PLACE TAG FORMAT:
Whenever you suggest places, activities, food spots, or hotels that the user can visit, include a special place tag on its own line:
[PLACE: Place Name | Day 1 (or Day 2, Day 3, etc.) | ACTIVITY/MEAL/ACCOMMODATION/TRANSPORT | Brief highlight or tip]

Example:
Here are the top attractions for your trip:
[PLACE: Laxman Jhula & Beatles Ashram | Day 1 | ACTIVITY | Spiritual hub, suspension bridge, and iconic ashram]
[PLACE: Chotiwala Restaurant | Day 1 | MEAL | Famous heritage eatery for authentic North Indian thali]
[PLACE: Neer Garh Waterfall | Day 2 | ACTIVITY | Scenic 3-tier cascade with swimming pools and trek]

RULES:
1. When asked for suggestions or itinerary, organize recommendations clearly day by day (Day 1, Day 2...).
2. Keep your text engaging, well-formatted, and full of emojis and practical tips (timings, costs, best time).
3. Do not repeat places already in the current itinerary unless relevant.
4. Always provide 2-5 [PLACE: ...] tags when recommending places so the user can add them to their itinerary with one click.`;
}

// Helper to extract [PLACE: Name | Day | Type | Desc] tags
function parsePlacesFromMessage(content) {
  const regex = /\[PLACE:\s*([^|\]]+)\s*\|\s*([^|\]]+)\s*\|\s*([^|\]]+)\s*\|\s*([^\]]+)\]/gi;
  const places = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    places.push({
      fullMatch: match[0],
      name: match[1].trim(),
      dayStr: match[2].trim(),
      type: match[3].trim().toUpperCase(),
      notes: match[4].trim(),
    });
  }
  const cleanContent = content.replace(regex, "").trim();
  return { cleanContent, places };
}

export default function AIChatBot({
  trip,
  itinerary,
  onAddToItinerary,
  onNavigateToMap,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hey there! 👋 I'm **TravelBot**, your AI travel planner!\n\nI'm ready to help you plan an amazing trip to **${trip?.destination || trip?.name || "your destination"}**:\n• 🗓️ Day-by-day complete schedule\n• 🏛️ Top attractions & scenic spots\n• 🍽️ Famous local eateries & cafes\n• 🏨 Best stays & accommodation\n• 💡 Travel tips & budget hacks\n\nHow can I help plan your trip today? 🌍`,
      timestamp: new Date(),
      places: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [addedPlacesMap, setAddedPlacesMap] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Compute trip dates list for day mapping
  const getTripDaysList = () => {
    if (!trip?.start_date || !trip?.end_date) return [];
    const list = [];
    let cur = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    let d = 1;
    while (cur <= end && d <= 30) {
      list.push({
        dayNum: d,
        dayStr: `Day ${d}`,
        dateISO: cur.toISOString().split("T")[0],
        formatted: cur.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
      });
      cur.setDate(cur.getDate() + 1);
      d++;
    }
    return list;
  };

  const tripDays = getTripDaysList();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Execute chat completion with fallback models
  const executeChatWithFallback = async (apiMessages) => {
    let lastError = null;
    for (const modelName of MODELS) {
      try {
        const response = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: apiMessages,
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return content;
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }
    throw lastError || new Error("All AI models failed to respond.");
  };

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    const userMsg = {
      role: "user",
      content: userText,
      timestamp: new Date(),
      places: [],
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(trip, itinerary);
      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...updatedMessages
          .slice(-8)
          .map((m) => ({ role: m.role, content: m.content })),
      ];

      const rawAssistantContent = await executeChatWithFallback(apiMessages);
      const { cleanContent, places } = parsePlacesFromMessage(rawAssistantContent);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: cleanContent || rawAssistantContent,
          places: places || [],
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error("ChatBot error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ Oops! I couldn't reach the AI server right now. Please verify your connection or try again in a moment.",
          timestamp: new Date(),
          isError: true,
          places: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Chat cleared! 🌟 What would you like to explore next for your trip?",
        timestamp: new Date(),
        places: [],
      },
    ]);
    setAddedPlacesMap({});
  };

  // Add place to itinerary directly from chat button
  const handleAddPlaceToItinerary = async (place, chosenDay = null) => {
    if (!onAddToItinerary) return;

    // Find date for the day
    const dayStr = chosenDay || place.dayStr || "";
    let targetDate = trip?.start_date ? trip.start_date.split("T")[0] : null;
    const matchNum = dayStr.match(/Day\s*(\d+)/i);
    if (matchNum && tripDays.length > 0) {
      const num = parseInt(matchNum[1], 10);
      const foundDay = tripDays.find((d) => d.dayNum === num);
      if (foundDay) {
        targetDate = foundDay.dateISO;
      }
    }

    const payload = {
      title: place.name,
      item_type: place.type || "ACTIVITY",
      date: targetDate,
      start_time: "09:30",
      end_time: "12:00",
      location: `${place.name}, ${trip?.destination || ""}`,
      notes: place.notes || "Added via TravelBot AI Recommendation",
    };

    try {
      await onAddToItinerary(payload);
      setAddedPlacesMap((prev) => ({
        ...prev,
        [place.name]: dayStr || "Scheduled",
      }));
    } catch (err) {
      console.error("Failed to add place from bot:", err);
    }
  };

  const formatMessage = (content) => {
    if (!content) return "";
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");
  };

  const formatTime = (ts) => {
    return ts.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) {
    return (
      <button
        className="chatbot-fab"
        onClick={() => setIsOpen(true)}
        title="Open TravelBot AI"
      >
        <span className="chatbot-fab-icon">🤖</span>
        <span className="chatbot-fab-badge">AI</span>
        <div className="chatbot-fab-pulse"></div>
      </button>
    );
  }

  return (
    <div
      className={`chatbot-container ${isMinimized ? "chatbot-minimized" : ""}`}
    >
      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-header-left">
          <div className="chatbot-avatar">
            <span>🤖</span>
            <span className="chatbot-online-dot"></span>
          </div>
          <div className="chatbot-header-info">
            <h4 className="chatbot-title">TravelBot AI</h4>
            <span className="chatbot-status">
              {loading ? "✍️ Generating recommendations..." : "● Online · Groq 120B"}
            </span>
          </div>
        </div>
        <div className="chatbot-header-actions">
          <button
            className="chatbot-action-btn"
            onClick={clearChat}
            title="Clear chat"
          >
            🗑️
          </button>
          <button
            className="chatbot-action-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? "⬆️" : "⬇️"}
          </button>
          <button
            className="chatbot-action-btn chatbot-close-btn"
            onClick={() => setIsOpen(false)}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Trip Context Banner */}
          {trip && (
            <div className="chatbot-context-banner">
              <span className="chatbot-context-icon">✈️</span>
              <span className="chatbot-context-text">
                <strong>{trip.name}</strong>
                {trip.destination && ` → ${trip.destination}`}
                {trip.start_date &&
                  ` · ${new Date(trip.start_date).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })}`}
                {trip.end_date &&
                  ` – ${new Date(trip.end_date).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })}`}
              </span>
            </div>
          )}

          {/* Messages Container */}
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chatbot-message ${
                  msg.role === "user"
                    ? "chatbot-message-user"
                    : "chatbot-message-bot"
                } ${msg.isError ? "chatbot-message-error" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="chatbot-msg-avatar">🤖</div>
                )}
                <div className="chatbot-msg-bubble">
                  <div
                    className="chatbot-msg-text"
                    dangerouslySetInnerHTML={{
                      __html: formatMessage(msg.content),
                    }}
                  />

                  {/* Interactive Recommended Place Cards */}
                  {msg.places && msg.places.length > 0 && (
                    <div className="chatbot-places-list">
                      <div className="chatbot-places-title">
                        📍 Recommended Places to Add:
                      </div>
                      {msg.places.map((place, pIdx) => {
                        const isAdded = addedPlacesMap[place.name];
                        return (
                          <div key={pIdx} className="chatbot-place-card">
                            <div className="chatbot-place-header">
                              <div className="chatbot-place-info">
                                <span className="chatbot-place-name">
                                  {place.name}
                                </span>
                                <div className="chatbot-place-meta">
                                  <span className="chatbot-place-tag">
                                    {place.dayStr}
                                  </span>
                                  <span className="chatbot-place-type">
                                    {place.type === "MEAL"
                                      ? "🍽️ Food"
                                      : place.type === "ACCOMMODATION"
                                      ? "🏨 Stay"
                                      : place.type === "TRANSPORT"
                                      ? "🚌 Transit"
                                      : "🏛️ Activity"}
                                  </span>
                                </div>
                              </div>

                              <div className="chatbot-place-actions">
                                {isAdded ? (
                                  <span className="chatbot-added-badge">
                                    ✅ Added to {isAdded}
                                  </span>
                                ) : (
                                  <button
                                    className="chatbot-add-itinerary-btn"
                                    onClick={() =>
                                      handleAddPlaceToItinerary(place)
                                    }
                                    title="Add to Itinerary"
                                  >
                                    ➕ Add to {place.dayStr || "Trip"}
                                  </button>
                                )}

                                {onNavigateToMap && (
                                  <button
                                    className="chatbot-map-locate-btn"
                                    onClick={() =>
                                      onNavigateToMap(place.name)
                                    }
                                    title="Locate on Map"
                                  >
                                    🗺️ Map
                                  </button>
                                )}
                              </div>
                            </div>
                            {place.notes && (
                              <div className="chatbot-place-notes">
                                {place.notes}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <span className="chatbot-msg-time">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                {msg.role === "user" && (
                  <div className="chatbot-msg-avatar user-avatar">👤</div>
                )}
              </div>
            ))}

            {loading && (
              <div className="chatbot-message chatbot-message-bot">
                <div className="chatbot-msg-avatar">🤖</div>
                <div className="chatbot-msg-bubble chatbot-typing-bubble">
                  <div className="chatbot-typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="chatbot-quick-prompts">
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                className="chatbot-quick-btn"
                onClick={() =>
                  sendMessage(
                    `${qp.text} in ${
                      trip?.destination || trip?.name || "our destination"
                    }`
                  )
                }
                disabled={loading}
              >
                {qp.icon} {qp.text}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="chatbot-input-area">
            <div className="chatbot-input-wrapper">
              <textarea
                ref={inputRef}
                className="chatbot-input"
                placeholder={`Ask about ${
                  trip?.destination || trip?.name || "your trip"
                }...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading}
              />
              <button
                className="chatbot-send-btn"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                title="Send message"
              >
                {loading ? "⏳" : "➤"}
              </button>
            </div>
            <p className="chatbot-input-hint">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
}
