// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'student') {
    window.location.href = 'login.html';
}

// Display user name
document.getElementById('student-name').textContent = user.name;

// Load events
async function loadEvents() {
    try {
        const response = await fetch('http://localhost:5000/api/events', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const events = await response.json();
        const container = document.getElementById('events-container');
        
        if (events.length === 0) {
            container.innerHTML = '<p class="no-events">No upcoming events available.</p>';
            return;
        }

        // Get user's registrations to check which events they're registered for
        const registrationsResponse = await fetch('http://localhost:5000/api/registrations/my-registrations', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const registrations = await registrationsResponse.json();
        const registeredEventIds = registrations.map(r => r.event._id);

        container.innerHTML = events.map(event => {
            const date = new Date(event.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const isRegistered = registeredEventIds.includes(event._id);

            return `
                <div class="event-card">
                    <h3>${event.title}</h3>
                    <p class="event-date">📅 ${date} at ${event.time}</p>
                    <p class="event-venue">📍 ${event.venue}</p>
                    <p class="event-description">${event.description.substring(0, 150)}...</p>
                    <p class="event-participants">👥 ${event.currentParticipants}/${event.maxParticipants} registered</p>
                    ${isRegistered 
                        ? '<button class="btn-register" disabled>Already Registered</button>'
                        : event.currentParticipants < event.maxParticipants
                            ? `<button class="btn-register" onclick="openRegistrationModal('${event._id}')">Register Now</button>`
                            : '<button class="btn-register" disabled>Event Full</button>'
                    }
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('events-container').innerHTML = '<p class="error">Error loading events</p>';
    }
}

// Load user's registrations
async function loadMyRegistrations() {
    try {
        const response = await fetch('http://localhost:5000/api/registrations/my-registrations', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const registrations = await response.json();
        const container = document.getElementById('registrations-container');
        
        if (registrations.length === 0) {
            container.innerHTML = '<p class="no-registrations">You haven\'t registered for any events yet.</p>';
            return;
        }

        container.innerHTML = registrations.map(reg => {
            const event = reg.event;
            const date = new Date(event.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const statusClass = `status-${reg.status}`;

            return `
                <div class="registration-item">
                    <div class="registration-info">
                        <h3>${event.title}</h3>
                        <p>📅 ${date} at ${event.time}</p>
                        <p>📍 ${event.venue}</p>
                        <p>Registered on: ${new Date(reg.registrationDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <span class="registration-status ${statusClass}">${reg.status}</span>
                        ${reg.status === 'registered' ? 
                            `<button class="btn-delete" onclick="cancelRegistration('${reg._id}')">Cancel</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading registrations:', error);
        document.getElementById('registrations-container').innerHTML = '<p class="error">Error loading registrations</p>';
    }
}

// Open registration modal
function openRegistrationModal(eventId) {
    const modal = document.getElementById('registration-modal');
    document.getElementById('event-id').value = eventId;
    
    // Pre-fill with user data if available
    document.getElementById('fullName').value = user.name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('department').value = user.department || '';
    
    modal.style.display = 'flex';
}

// Close modal
document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('registration-modal').style.display = 'none';
});

// Handle registration form submission
document.getElementById('registration-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        eventId: document.getElementById('event-id').value,
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        studentId: document.getElementById('studentId').value,
        department: document.getElementById('department').value,
        year: document.getElementById('year').value,
        semester: document.getElementById('semester').value,
        phoneNumber: document.getElementById('phoneNumber').value
    };
    
    try {
        const response = await fetch('http://localhost:5000/api/registrations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Registration successful!');
            document.getElementById('registration-modal').style.display = 'none';
            document.getElementById('registration-form').reset();
            loadEvents();
            loadMyRegistrations();
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Error registering for event');
    }
});

// Cancel registration
async function cancelRegistration(registrationId) {
    if (!confirm('Are you sure you want to cancel this registration?')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:5000/api/registrations/${registrationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('Registration cancelled successfully');
            loadEvents();
            loadMyRegistrations();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to cancel registration');
        }
    } catch (error) {
        console.error('Error cancelling registration:', error);
        alert('Error cancelling registration');
    }
}

// Tab switching
function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tabName === 'events') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('events-tab').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('registrations-tab').classList.add('active');
        loadMyRegistrations();
    }
}

// Logout
document.getElementById('logout').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
});

// Initial load
loadEvents();