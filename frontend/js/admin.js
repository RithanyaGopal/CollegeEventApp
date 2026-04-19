const API_URL = "https://collegeeventapp-1.onrender.com";

// Check authentication
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

if (!token || !user || user.role !== "admin") {
    window.location.href = "login.html";
}

// Display admin name
document.getElementById("admin-name").textContent = user.name;

// Load all events
async function loadEvents() {
    try {
        const response = await fetch(`${API_URL}/api/events/all`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const events = await response.json();

        document.getElementById("total-events").textContent = events.length;
        document.getElementById("upcoming-events").textContent =
            events.filter(e => e.status === "upcoming").length;

        const totalRegistrations = events.reduce(
            (sum, event) => sum + event.currentParticipants,
            0
        );

        document.getElementById("total-registrations").textContent =
            totalRegistrations;

        const container = document.getElementById("events-container");

        if (events.length === 0) {
            container.innerHTML = "<p>No Events Found</p>";
        } else {
            container.innerHTML = events.map(event => `
                <div class="event-card">
                    <h3>${event.title}</h3>
                    <p>${event.description}</p>
                    <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${event.time}</p>
                    <p><strong>Venue:</strong> ${event.venue}</p>
                    <p><strong>Status:</strong> ${event.status}</p>
                    <p><strong>Participants:</strong> ${event.currentParticipants}/${event.maxParticipants}</p>

                    <button onclick="openEditEventModal('${event._id}')">Edit</button>
                    <button onclick="deleteEvent('${event._id}')">Delete</button>
                    <button onclick="viewEventRegistrations('${event._id}')">View Registrations</button>
                </div>
            `).join("");
        }

    } catch (error) {
        console.error(error);
        showNotification("Error loading events", "error");
    }
}

// View registrations
async function viewEventRegistrations(eventId) {
    try {
        const response = await fetch(
            `${API_URL}/api/registrations/event/${eventId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const registrations = await response.json();

        alert(`Total Registrations: ${registrations.length}`);

    } catch (error) {
        console.error(error);
        showNotification("Error loading registrations", "error");
    }
}

// Add Event Modal
function openAddEventModal() {
    document.getElementById("event-form").reset();
    document.getElementById("event-id").value = "";
    document.getElementById("modal-title").textContent = "Add Event";
    document.getElementById("event-modal").style.display = "block";
}

// Edit Event Modal
async function openEditEventModal(eventId) {
    try {
        const response = await fetch(`${API_URL}/api/events/${eventId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const event = await response.json();

        document.getElementById("modal-title").textContent = "Edit Event";
        document.getElementById("event-id").value = event._id;
        document.getElementById("title").value = event.title;
        document.getElementById("description").value = event.description;
        document.getElementById("date").value = event.date.split("T")[0];
        document.getElementById("time").value = event.time;
        document.getElementById("venue").value = event.venue;
        document.getElementById("department").value = event.department;
        document.getElementById("organizer").value = event.organizer;
        document.getElementById("maxParticipants").value =
            event.maxParticipants;
        document.getElementById("status").value = event.status;

        document.getElementById("event-modal").style.display = "block";

    } catch (error) {
        console.error(error);
        showNotification("Error loading event details", "error");
    }
}

// Save Event
document.getElementById("event-form").addEventListener("submit", async e => {
    e.preventDefault();

    const eventId = document.getElementById("event-id").value;

    const formData = {
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        date: document.getElementById("date").value,
        time: document.getElementById("time").value,
        venue: document.getElementById("venue").value,
        department: document.getElementById("department").value,
        organizer: document.getElementById("organizer").value,
        maxParticipants: parseInt(
            document.getElementById("maxParticipants").value
        ),
        status: document.getElementById("status").value
    };

    const url = eventId
        ? `${API_URL}/api/events/${eventId}`
        : `${API_URL}/api/events`;

    const method = eventId ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            showNotification(data.message || "Saved successfully", "success");
            document.getElementById("event-modal").style.display = "none";
            loadEvents();
        } else {
            showNotification(data.message || "Failed", "error");
        }

    } catch (error) {
        console.error(error);
        showNotification("Error saving event", "error");
    }
});

// Delete Event
async function deleteEvent(eventId) {
    if (!confirm("Are you sure to delete this event?")) return;

    try {
        const response = await fetch(`${API_URL}/api/events/${eventId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showNotification(data.message || "Deleted", "success");
            loadEvents();
        } else {
            showNotification(data.message || "Delete failed", "error");
        }

    } catch (error) {
        console.error(error);
        showNotification("Error deleting event", "error");
    }
}

// Notification
function showNotification(message, type = "info") {
    alert(message);
}

// Logout
document.getElementById("logout").addEventListener("click", e => {
    e.preventDefault();

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "index.html";
});

// Close modal
document.querySelectorAll(".close").forEach(btn => {
    btn.addEventListener("click", () => {
        document.getElementById("event-modal").style.display = "none";
    });
});

// Initial Load
loadEvents();

// Tab switching functionality
function showTab(tabName, event) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
    });

    // Show the selected tab content
    const activeTab = document.getElementById(tabName + '-tab');
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // Add active class to the clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    }
}