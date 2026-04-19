// Debug utility
const debugLog = (msg) => {
    console.log(msg);
};

const API_URL = "http://localhost:5000";

debugLog('✓ Admin script loaded');

// Check authentication
const token = localStorage.getItem("token");
debugLog('Token: ' + (token ? 'present' : 'MISSING'));

const userStr = localStorage.getItem("user");

let user = null;
try {
    user = JSON.parse(userStr);
} catch (e) {
    console.error('Error parsing stored user:', e);
}

if (!token || !user || user.role !== "admin") {
    debugLog('ERROR: Not authenticated as admin');
    console.error('Not authenticated as admin');
    window.location.href = "login.html";
}

debugLog('✓ Admin authenticated');

// Display admin name
const adminNameEl = document.getElementById("admin-name");
if (adminNameEl && user) {
    adminNameEl.textContent = user.name;
    debugLog('Admin name set to: ' + user.name);
}

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

// Load all events
async function loadEvents() {
    debugLog('🔄 Loading admin events...');
    console.log('Loading admin events...');
    try {
        const response = await fetch(`${API_URL}/api/events/all`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        debugLog('API Response: ' + response.status);
        console.log('Admin events API response status:', response.status);

        if (!response.ok) {
            console.error('Failed to load admin events, status:', response.status);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            document.getElementById("events-container").innerHTML = `<p>Error loading events: ${response.status} - ${errorText}</p>`;
            return;
        }

        const events = await response.json();
        console.log('Admin events loaded:', events);

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
            document.getElementById("manage-events-container").innerHTML = "<p>No Events Found</p>";
        } else {
            const allEventCards = events.map(event => `
                <div class="event-card">
                    <h3>${event.title}</h3>
                    <p>${event.description}</p>
                    <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${event.time}</p>
                    <p><strong>Venue:</strong> ${event.venue}</p>
                    <p><strong>Status:</strong> ${event.status}</p>
                    <p><strong>Participants:</strong> ${event.currentParticipants}/${event.maxParticipants}</p>

                    <button class="btn btn-primary" data-action="view-registrations" data-event-id="${event._id}">View Registrations</button>
                </div>
            `).join("");

        const manageEventCards = events.map(event => `
                <div class="event-card">
                    <h3>${event.title}</h3>
                    <p>${event.description}</p>
                    <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${event.time}</p>
                    <p><strong>Venue:</strong> ${event.venue}</p>
                    <p><strong>Status:</strong> ${event.status}</p>
                    <p><strong>Participants:</strong> ${event.currentParticipants}/${event.maxParticipants}</p>

                    <button class="btn-edit" data-action="edit-event" data-event-id="${event._id}">Edit</button>
                    <button class="btn-delete" data-action="delete-event" data-event-id="${event._id}">Delete</button>
                    <button class="btn btn-primary" data-action="view-registrations" data-event-id="${event._id}">View Registrations</button>
                </div>
            `).join("");

            container.innerHTML = allEventCards;
            document.getElementById("manage-events-container").innerHTML = manageEventCards;
            debugLog('✓ Events rendered');
            attachAdminEventHandlers();
        }

    } catch (error) {
        console.error(error);
        document.getElementById("events-container").innerHTML = "<p>Error loading events</p>";
        document.getElementById("manage-events-container").innerHTML = "<p>Error loading events</p>";
    }
}

function attachAdminEventHandlers() {
    debugLog('🔧 Attaching event handlers via delegation...');
    
    // Event delegation on events container
    const eventsContainer = document.getElementById("events-container");
    if (eventsContainer) {
        eventsContainer.addEventListener('click', (e) => {
            const actionTarget = e.target.closest('[data-action]');
            debugLog('📍 CLICK in events-container on: ' + e.target.tagName + ' [' + e.target.className + '] | actionTarget: ' + (actionTarget ? actionTarget.tagName + ' [' + actionTarget.className + ']' : 'none'));
            
            if (actionTarget && eventsContainer.contains(actionTarget)) {
                const action = actionTarget.dataset.action;
                const eventId = actionTarget.dataset.eventId;

                if (action === 'view-registrations') {
                    e.preventDefault();
                    e.stopPropagation();
                    debugLog('✅ View registrations: ' + eventId);
                    viewEventRegistrations(eventId);
                }
            }
        });
        debugLog('✓ Events container listener attached');
    }

    // Event delegation on manage events container
    const manageContainer = document.getElementById("manage-events-container");
    if (manageContainer) {
        manageContainer.addEventListener('click', (e) => {
            const actionTarget = e.target.closest('[data-action]');
            debugLog('📍 CLICK in manage-container on: ' + e.target.tagName + ' [' + e.target.className + '] | actionTarget: ' + (actionTarget ? actionTarget.tagName + ' [' + actionTarget.className + ']' : 'none'));
            
            if (actionTarget && manageContainer.contains(actionTarget)) {
                const action = actionTarget.dataset.action;
                const eventId = actionTarget.dataset.eventId;
                
                if (action === 'view-registrations') {
                    e.preventDefault();
                    e.stopPropagation();
                    debugLog('✅ View registrations: ' + eventId);
                    viewEventRegistrations(eventId);
                } else if (action === 'edit-event') {
                    e.preventDefault();
                    e.stopPropagation();
                    openEditEventModal(eventId);
                } else if (action === 'delete-event') {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteEvent(eventId);
                }
            }
        });
        debugLog('✓ Manage container listener attached');
    }
}

// View registrations
async function viewEventRegistrations(eventId) {
    debugLog('👁️ View registrations clicked for event: ' + eventId);
    console.log('viewEventRegistrations called for event:', eventId);
    console.log('Current token:', token ? 'present' : 'missing');
    try {
        const url = `${API_URL}/api/registrations/event/${eventId}`;
        debugLog('Fetching: ' + url);
        console.log('Fetching from:', url);
        
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('registrations API status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API error response:', errorData);
            showNotification(errorData.message || "Error loading registrations", "error");
            return;
        }

        const registrations = await response.json();
        console.log('registrations data received:', registrations);
        console.log('Number of registrations:', registrations.length);
        
        const modal = document.getElementById("registrations-modal");
        const list = document.getElementById("registrations-list");

        console.log('Modal element:', modal);
        console.log('List element:', list);

        if (!modal || !list) {
            console.error('Modal or list element not found');
            showNotification("Registrations view is not available", "error");
            return;
        }

        if (registrations.length === 0) {
            list.innerHTML = '<p>No registrations yet for this event.</p>';
        } else {
            list.innerHTML = registrations
                .map(r => `
                    <div class="registration-card">
                        <p><strong>Name:</strong> ${r.fullName}</p>
                        <p><strong>Email:</strong> ${r.email}</p>
                        <p><strong>Student ID:</strong> ${r.studentId}</p>
                        <p><strong>Department:</strong> ${r.department}</p>
                        <p><strong>Year/Sem:</strong> ${r.year} / ${r.semester}</p>
                        <p><strong>Phone:</strong> ${r.phoneNumber}</p>
                    </div>
                `)
                .join('');
        }

        console.log('Modal display set to flex');
        modal.style.display = 'flex';
    } catch (error) {
        console.error('Error in viewEventRegistrations:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        showNotification("Error loading registrations", "error");
    }
}

// Add Event Modal
function openAddEventModal() {
    document.getElementById("event-form").reset();
    document.getElementById("event-id").value = "";
    document.getElementById("modal-title").textContent = "Add Event";
    document.getElementById("event-modal").style.display = "flex";
}

// Edit Event Modal
async function openEditEventModal(eventId) {
    console.log('Opening edit modal for event:', eventId);
    try {
        const response = await fetch(`${API_URL}/api/events/${eventId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Edit modal API response status:', response.status);

        if (!response.ok) {
            console.error('Failed to fetch event details');
            showNotification("Error loading event details", "error");
            return;
        }

        const event = await response.json();
        console.log('Event data:', event);

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

        document.getElementById("event-modal").style.display = "flex";
        console.log('Edit modal opened successfully');

    } catch (error) {
        console.error('Error in openEditEventModal:', error);
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
    console.log('Delete function called for event:', eventId);
    if (!confirm("Are you sure to delete this event?")) {
        console.log('Delete cancelled by user');
        return;
    }

    console.log('Proceeding with delete...');
    try {
        const response = await fetch(`${API_URL}/api/events/${eventId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Delete API response status:', response.status);
        const data = await response.json();
        console.log('Delete response data:', data);

        if (response.ok) {
            showNotification(data.message || "Deleted", "success");
            loadEvents();
        } else {
            showNotification(data.message || "Delete failed", "error");
        }

    } catch (error) {
        console.error('Error in deleteEvent:', error);
        showNotification("Error deleting event", "error");
    }
}

// Notification
function showNotification(message, type = "info") {
    const notification = document.getElementById('notification');
    if (!notification) {
        console.log(message);
        return;
    }

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Logout
document.getElementById("logout").addEventListener("click", e => {
    e.preventDefault();

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "index.html";
});

// Close modal buttons
document.querySelectorAll(".close").forEach(btn => {
    btn.addEventListener("click", () => {
        const modal = btn.closest('.modal');
        if (modal) {
            modal.style.display = "none";
        }
    });
});

// Close modal when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
});

// Make inline click handlers available globally
window.showTab = showTab;
window.openAddEventModal = openAddEventModal;
window.openEditEventModal = openEditEventModal;
window.deleteEvent = deleteEvent;
window.viewEventRegistrations = viewEventRegistrations;
window.showNotification = showNotification;

// Initial Load
debugLog('Starting initial load...');
loadEvents();
debugLog('Admin dashboard initialized');