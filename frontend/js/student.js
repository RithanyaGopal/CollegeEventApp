const API_URL = "http://localhost:5000";

// Check authentication
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

if (!token || !user || user.role !== "student") {
    window.location.href = "login.html";
}

// Display user name
document.getElementById("student-name").textContent = user.name;

// Load events
async function loadEvents() {
    console.log('Loading events...');
    console.log('API URL:', API_URL);
    console.log('Token:', token ? 'Present' : 'Missing');

    try {
        const response = await fetch(`${API_URL}/api/events`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Events API response status:', response.status);

        if (!response.ok) {
            console.error('Failed to load events:', response.statusText);
            const container = document.getElementById("events-container");
            container.innerHTML = '<p class="error">Failed to load events. Please try again.</p>';
            return;
        }

        const events = await response.json();
        console.log('Events loaded:', events);

        const container = document.getElementById("events-container");

        if (events.length === 0) {
            container.innerHTML =
                '<p class="no-events">No upcoming events available.</p>';
            return;
        }

        // Get my registrations
        const regResponse = await fetch(
            `${API_URL}/api/registrations/my-registrations`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        console.log('My registrations response status:', regResponse.status);

        let registrations = [];
        if (regResponse.ok) {
            registrations = await regResponse.json();
            console.log('My registrations:', registrations);
        } else {
            console.error('Failed to load registrations:', regResponse.statusText);
        }

        const registeredEventIds = registrations.map(r => r.event._id);
        console.log('Registered event IDs:', registeredEventIds);

        container.innerHTML = events.map(event => {
            const date = new Date(event.date).toLocaleDateString();
            const isRegistered = registeredEventIds.includes(event._id);
            const isFull = event.currentParticipants >= event.maxParticipants;

            console.log(`Event ${event._id}: registered=${isRegistered}, full=${isFull}, participants=${event.currentParticipants}/${event.maxParticipants}`);

            return `
                <div class="event-card">
                    <h3>${event.title}</h3>
                    <p>📅 ${date} at ${event.time}</p>
                    <p>📍 ${event.venue}</p>
                    <p>${event.description}</p>
                    <p>👥 ${event.currentParticipants}/${event.maxParticipants} registered</p>

                    ${
                        isRegistered
                            ? `<button class="btn-register" disabled>Already Registered</button>`
                            : event.currentParticipants < event.maxParticipants
                                ? `<button class="btn-register" onclick="openRegistrationModal('${event._id}')" data-event-id="${event._id}">Register Now</button>`
                                : `<button class="btn-register" disabled>Event Full</button>`
                    }
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error(error);
        document.getElementById("events-container").innerHTML =
            '<p class="error">Error loading events</p>';
    }
}

// Load My Registrations
async function loadMyRegistrations() {
    try {
        const response = await fetch(
            `${API_URL}/api/registrations/my-registrations`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const registrations = await response.json();
        const container = document.getElementById("registrations-container");

        if (registrations.length === 0) {
            container.innerHTML =
                "<p>You haven't registered for any events yet.</p>";
            return;
        }

        container.innerHTML = registrations.map(reg => {
            const event = reg.event;

            return `
                <div class="registration-item">
                    <h3>${event.title}</h3>
                    <p>📅 ${new Date(event.date).toLocaleDateString()} at ${event.time}</p>
                    <p>📍 ${event.venue}</p>
                    <p>Status: ${reg.status}</p>

                    ${
                        reg.status === "registered"
                            ? `<button onclick="cancelRegistration('${reg._id}')">Cancel</button>`
                            : ""
                    }
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error(error);
        document.getElementById("registrations-container").innerHTML =
            '<p class="error">Error loading registrations</p>';
    }
}

// Open modal
function openRegistrationModal(eventId) {
    console.log('Opening registration modal for event:', eventId);
    console.log('User object:', user);

    if (!user) {
        console.error('User not found! Redirecting to login.');
        window.location.href = "login.html";
        return;
    }

    const modal = document.getElementById("registration-modal");
    if (!modal) {
        console.error('Registration modal element not found!');
        return;
    }

    const eventIdInput = document.getElementById("event-id");
    const fullNameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("email");
    const departmentInput = document.getElementById("department");

    if (!eventIdInput || !fullNameInput || !emailInput || !departmentInput) {
        console.error('Some form elements not found!');
        return;
    }

    eventIdInput.value = eventId;
    fullNameInput.value = user.name || "";
    emailInput.value = user.email || "";
    departmentInput.value = user.department || ""; // This will be empty, but that's OK

    modal.style.display = "flex";
    console.log('Modal opened successfully');
}

// Close modal
document.querySelector(".close").addEventListener("click", () => {
    document.getElementById("registration-modal").style.display = "none";
});

// Close modal when clicking outside
document.getElementById("registration-modal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("registration-modal")) {
        document.getElementById("registration-modal").style.display = "none";
    }
});

// Submit registration form
document.getElementById("registration-form").addEventListener("submit", async e => {
    e.preventDefault();
    console.log('Form submitted');

    const formData = {
        eventId: document.getElementById("event-id").value,
        fullName: document.getElementById("fullName").value,
        email: document.getElementById("email").value,
        studentId: document.getElementById("studentId").value,
        department: document.getElementById("department").value,
        year: document.getElementById("year").value,
        semester: document.getElementById("semester").value,
        phoneNumber: document.getElementById("phoneNumber").value
    };

    console.log('Form data:', formData);

    try {
        console.log('Sending registration request...');
        const response = await fetch(`${API_URL}/api/registrations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {
            alert("Registration successful");
            document.getElementById("registration-form").reset();
            document.getElementById("registration-modal").style.display = "none";

            loadEvents();
            loadMyRegistrations();
        } else {
            alert(data.message || "Registration failed");
        }

    } catch (error) {
        console.error('Registration error:', error);
        alert("Error registering");
    }
});

// Cancel registration
async function cancelRegistration(registrationId) {
    if (!confirm("Cancel this registration?")) return;

    try {
        const response = await fetch(
            `${API_URL}/api/registrations/${registrationId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (response.ok) {
            alert(data.message || "Cancelled");
            loadEvents();
            loadMyRegistrations();
        } else {
            alert(data.message || "Failed");
        }

    } catch (error) {
        console.error(error);
        alert("Error cancelling");
    }
}

// Tabs
function showTab(tabName) {
    document.querySelectorAll(".tab-btn").forEach(btn =>
        btn.classList.remove("active")
    );

    document.querySelectorAll(".tab-content").forEach(tab =>
        tab.classList.remove("active")
    );

    if (tabName === "events") {
        document.querySelectorAll(".tab-btn")[0].classList.add("active");
        document.getElementById("events-tab").classList.add("active");
    } else {
        document.querySelectorAll(".tab-btn")[1].classList.add("active");
        document.getElementById("registrations-tab").classList.add("active");
        loadMyRegistrations();
    }
}

// Logout
document.getElementById("logout").addEventListener("click", e => {
    e.preventDefault();

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "index.html";
});

// Initial load
loadEvents();