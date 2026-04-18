const API_URL = "https://collegeeventapp-1.onrender.com";

// Check authentication
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

if (!token || !user || (user.role !== "faculty" && user.role !== "admin")) {
    window.location.href = "login.html";
}

// Display user name
document.getElementById("faculty-name").textContent = user.name;

// Load events
async function loadEvents() {
    try {
        const response = await fetch(`${API_URL}/api/events`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const events = await response.json();

        const container = document.getElementById("events-container");
        const eventSelect = document.getElementById("event-select");

        if (events.length === 0) {
            container.innerHTML =
                '<p class="no-events">No events available.</p>';
            eventSelect.innerHTML =
                '<option value="">No events available</option>';
            return;
        }

        container.innerHTML = events.map(event => `
            <div class="event-card">
                <h3>${event.title}</h3>
                <p>📅 ${new Date(event.date).toLocaleDateString()} at ${event.time}</p>
                <p>📍 ${event.venue}</p>
                <p>${event.description}</p>
                <p>👥 ${event.currentParticipants}/${event.maxParticipants} registered</p>
            </div>
        `).join("");

        eventSelect.innerHTML =
            '<option value="">Choose an event</option>' +
            events.map(event =>
                `<option value="${event._id}">${event.title}</option>`
            ).join("");

    } catch (error) {
        console.error(error);
        document.getElementById("events-container").innerHTML =
            '<p class="error">Error loading events</p>';
    }
}

// Load registrations
async function loadRegistrations() {
    const eventId = document.getElementById("event-select").value;
    const container = document.getElementById("registrations-container");

    if (!eventId) {
        container.innerHTML =
            "<p>Please select an event to view registrations.</p>";
        return;
    }

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

        if (registrations.length === 0) {
            container.innerHTML =
                "<p>No registrations for this event yet.</p>";
            return;
        }

        container.innerHTML = `
            <table class="registrations-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>ID</th>
                        <th>Department</th>
                        <th>Year</th>
                        <th>Semester</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${registrations.map(reg => `
                        <tr>
                            <td>${reg.fullName}</td>
                            <td>${reg.studentId}</td>
                            <td>${reg.department}</td>
                            <td>${reg.year}</td>
                            <td>${reg.semester}</td>
                            <td>${reg.email}</td>
                            <td>${reg.phoneNumber}</td>
                            <td>${new Date(reg.registrationDate).toLocaleDateString()}</td>
                            <td>
                                <select onchange="updateRegistrationStatus('${reg._id}', this.value)">
                                    <option value="registered" ${reg.status === "registered" ? "selected" : ""}>Registered</option>
                                    <option value="attended" ${reg.status === "attended" ? "selected" : ""}>Attended</option>
                                    <option value="cancelled" ${reg.status === "cancelled" ? "selected" : ""}>Cancelled</option>
                                </select>
                            </td>
                            <td>
                                <button onclick="deleteRegistration('${reg._id}')">Delete</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;

    } catch (error) {
        console.error(error);
        container.innerHTML =
            '<p class="error">Error loading registrations</p>';
    }
}

// Update registration status
async function updateRegistrationStatus(registrationId, status) {
    try {
        const response = await fetch(
            `${API_URL}/api/registrations/${registrationId}/status`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            }
        );

        const data = await response.json();

        if (response.ok) {
            alert(data.message || "Status updated");
        } else {
            alert(data.message || "Failed");
        }

    } catch (error) {
        console.error(error);
        alert("Error updating status");
    }
}

// Delete registration
async function deleteRegistration(registrationId) {
    if (!confirm("Are you sure to delete this registration?")) return;

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
            alert(data.message || "Deleted successfully");
            loadRegistrations();
            loadEvents();
        } else {
            alert(data.message || "Delete failed");
        }

    } catch (error) {
        console.error(error);
        alert("Error deleting registration");
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