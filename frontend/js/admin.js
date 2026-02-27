// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'admin') {
    window.location.href = 'login.html';
}

// Display admin name
document.getElementById('admin-name').textContent = user.name;

// Load all events
async function loadEvents() {
    try {
        const response = await fetch('http://localhost:5000/api/events/all', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const events = await response.json();
        
        // Update statistics
        document.getElementById('total-events').textContent = events.length;
        document.getElementById('upcoming-events').textContent = 
            events.filter(e => e.status === 'upcoming').length;
        
        const totalRegistrations = events.reduce((sum, event) => sum + event.currentParticipants, 0);
        document.getElementById('total-registrations').textContent = totalRegistrations;

        // Display events in events tab (View All Events)
        const container = document.getElementById('events-container');
        if (events.length === 0) {
            container.innerHTML = `
                <div class="no-events-container">
                    <i class="fas fa-calendar-times no-events-icon"></i>
                    <h3>No Events Found</h3>
                    <p>Start by adding your first event in the Manage Events tab.</p>
                </div>
            `;
        } else {
            container.innerHTML = events.map(event => {
                const date = new Date(event.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                return `
                    <div class="event-card">
                        <div class="event-card-header" style="background: var(--gradient-1); padding: 1rem; border-radius: 10px 10px 0 0; margin: -1.5rem -1.5rem 1rem -1.5rem;">
                            <h3 style="color: white; margin: 0;">${event.title}</h3>
                        </div>
                        <p class="event-date"><i class="fas fa-calendar"></i> ${date} at ${event.time}</p>
                        <p class="event-venue"><i class="fas fa-map-marker-alt"></i> ${event.venue}</p>
                        <p class="event-description">${event.description.substring(0, 150)}...</p>
                        <div class="participants-info" style="margin: 1rem 0;">
                            <div class="participants-stats">
                                <span><i class="fas fa-users"></i> Participants</span>
                                <span>${event.currentParticipants}/${event.maxParticipants}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(event.currentParticipants/event.maxParticipants*100)}%"></div>
                            </div>
                        </div>
                        <p class="event-status">
                            Status: 
                            <span class="event-status-badge ${event.status}" style="display: inline-block; padding: 0.2rem 1rem; border-radius: 20px; background: ${getStatusColor(event.status)}; color: white;">
                                ${event.status}
                            </span>
                        </p>
                    </div>
                `;
            }).join('');
        }

        // Display events in manage tab with modern design
        const manageContainer = document.getElementById('manage-events-container');
        if (events.length === 0) {
            manageContainer.innerHTML = `
                <div class="no-events-container">
                    <i class="fas fa-calendar-plus no-events-icon"></i>
                    <h3>No Events Yet</h3>
                    <p>Click the "Add New Event" button to create your first event.</p>
                </div>
            `;
        } else {
            manageContainer.innerHTML = events.map((event, index) => {
                const date = new Date(event.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                const participantsPercentage = ((event.currentParticipants / event.maxParticipants) * 100).toFixed(1);
                
                return `
                    <div class="manage-event-card" style="animation: slideIn 0.5s ease ${index * 0.1}s forwards;">
                        <div class="event-card-header">
                            <h3>${event.title}</h3>
                            <span class="event-status-badge ${event.status}">${event.status}</span>
                        </div>
                        
                        <div class="event-card-body">
                            <div class="event-detail-item">
                                <i class="fas fa-calendar-alt"></i>
                                <span class="detail-label">Date & Time:</span>
                                <span class="detail-value">${date} at ${event.time}</span>
                            </div>
                            
                            <div class="event-detail-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span class="detail-label">Venue:</span>
                                <span class="detail-value">${event.venue}</span>
                            </div>
                            
                            <div class="event-detail-item">
                                <i class="fas fa-building"></i>
                                <span class="detail-label">Department:</span>
                                <span class="detail-value">${event.department}</span>
                            </div>
                            
                            <div class="event-detail-item">
                                <i class="fas fa-user-tie"></i>
                                <span class="detail-label">Organizer:</span>
                                <span class="detail-value">${event.organizer}</span>
                            </div>
                            
                            <div class="event-description-box">
                                <p><i class="fas fa-align-left"></i> ${event.description.substring(0, 120)}...</p>
                            </div>
                            
                            <div class="participants-info">
                                <div class="participants-stats">
                                    <span><i class="fas fa-users"></i> Participants</span>
                                    <span>${event.currentParticipants}/${event.maxParticipants} (${participantsPercentage}%)</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${participantsPercentage}%"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="event-card-footer">
                            <button class="event-action-btn btn-edit-event" onclick="openEditEventModal('${event._id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="event-action-btn btn-view-event" onclick="viewEventRegistrations('${event._id}')">
                                <i class="fas fa-eye"></i> View Registrations
                            </button>
                            <button class="event-action-btn btn-delete-event" onclick="deleteEvent('${event._id}')">
                                <i class="fas fa-trash-alt"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading events:', error);
        showNotification('Error loading events. Please try again.', 'error');
    }
}

// Helper function to get status color
function getStatusColor(status) {
    const colors = {
        'upcoming': '#4CAF50',
        'ongoing': '#FF9800',
        'completed': '#9C27B0',
        'cancelled': '#f44336'
    };
    return colors[status] || '#6c757d';
}

// View event registrations
async function viewEventRegistrations(eventId) {
    try {
        const response = await fetch(`http://localhost:5000/api/registrations/event/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const registrations = await response.json();
        
        if (registrations.length === 0) {
            showNotification('No registrations for this event yet.', 'info');
            return;
        }
        
        // Create a modal to show registrations
        const registrationsModal = document.createElement('div');
        registrationsModal.className = 'modal';
        registrationsModal.style.display = 'flex';
        
        registrationsModal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                <h2><i class="fas fa-users"></i> Event Registrations</h2>
                <div style="overflow-x: auto; margin-top: 1.5rem;">
                    <table class="registrations-table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Student ID</th>
                                <th>Department</th>
                                <th>Year</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${registrations.map(reg => `
                                <tr>
                                    <td>${reg.fullName}</td>
                                    <td>${reg.studentId}</td>
                                    <td>${reg.department}</td>
                                    <td>${reg.year}</td>
                                    <td><span class="registration-status status-${reg.status}">${reg.status}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        document.body.appendChild(registrationsModal);
        
        // Close modal when clicking outside
        registrationsModal.addEventListener('click', (e) => {
            if (e.target === registrationsModal) {
                registrationsModal.remove();
            }
        });
        
    } catch (error) {
        console.error('Error loading registrations:', error);
        showNotification('Error loading registrations.', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 0.8rem;
        animation: slideInRight 0.3s ease;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Open modal to add new event
function openAddEventModal() {
    document.getElementById('modal-title').textContent = 'Add New Event';
    document.getElementById('event-form').reset();
    document.getElementById('event-id').value = '';
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    document.getElementById('status').value = 'upcoming';
    
    document.getElementById('event-modal').style.display = 'flex';
}

// Open modal to edit event
async function openEditEventModal(eventId) {
    try {
        const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const event = await response.json();
        
        document.getElementById('modal-title').textContent = 'Edit Event';
        document.getElementById('event-id').value = event._id;
        document.getElementById('title').value = event.title;
        document.getElementById('description').value = event.description;
        document.getElementById('date').value = event.date.split('T')[0];
        document.getElementById('time').value = event.time;
        document.getElementById('venue').value = event.venue;
        document.getElementById('department').value = event.department;
        document.getElementById('organizer').value = event.organizer;
        document.getElementById('maxParticipants').value = event.maxParticipants;
        document.getElementById('status').value = event.status;
        
        document.getElementById('event-modal').style.display = 'flex';
    } catch (error) {
        console.error('Error loading event details:', error);
        showNotification('Error loading event details', 'error');
    }
}

// Handle event form submission
document.getElementById('event-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const eventId = document.getElementById('event-id').value;
    const formData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        venue: document.getElementById('venue').value,
        department: document.getElementById('department').value,
        organizer: document.getElementById('organizer').value,
        maxParticipants: parseInt(document.getElementById('maxParticipants').value),
        status: document.getElementById('status').value
    };
    
    // Validate form data
    if (!formData.title || !formData.description || !formData.date || !formData.time || !formData.venue || !formData.department || !formData.organizer || !formData.maxParticipants) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    const url = eventId 
        ? `http://localhost:5000/api/events/${eventId}`
        : 'http://localhost:5000/api/events';
    
    const method = eventId ? 'PUT' : 'POST';
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification(eventId ? 'Event updated successfully!' : 'Event created successfully!', 'success');
            document.getElementById('event-modal').style.display = 'none';
            loadEvents();
        } else {
            const data = await response.json();
            showNotification(data.message || 'Operation failed', 'error');
        }
    } catch (error) {
        console.error('Error saving event:', error);
        showNotification('Error saving event', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Delete event
async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showNotification('Event deleted successfully', 'success');
            loadEvents();
        } else {
            const data = await response.json();
            showNotification(data.message || 'Failed to delete event', 'error');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        showNotification('Error deleting event', 'error');
    }
}

// Close modal
document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('event-modal').style.display = 'none';
    });
});

// Tab switching with animation
function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(btn => {
        btn.classList.remove('active');
        btn.style.transform = 'scale(1)';
    });
    
    contents.forEach(content => {
        content.classList.remove('active');
        content.style.opacity = '0';
        content.style.transform = 'translateY(20px)';
    });
    
    setTimeout(() => {
        if (tabName === 'events') {
            tabs[0].classList.add('active');
            document.getElementById('events-tab').classList.add('active');
        } else if (tabName === 'manage') {
            tabs[1].classList.add('active');
            document.getElementById('manage-tab').classList.add('active');
        } else {
            tabs[2].classList.add('active');
            document.getElementById('stats-tab').classList.add('active');
        }
        
        const activeContent = document.querySelector('.tab-content.active');
        activeContent.style.opacity = '1';
        activeContent.style.transform = 'translateY(0)';
        activeContent.style.transition = 'all 0.5s ease';
    }, 50);
    
    // Add bounce effect to active tab
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        activeTab.style.transform = 'scale(1.05)';
    }
}

// Logout with confirmation
document.getElementById('logout').addEventListener('click', (e) => {
    e.preventDefault();
    
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('event-modal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Add keyboard support (Escape to close modal)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('event-modal').style.display = 'none';
    }
});

// Add animation styles dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .event-card {
        position: relative;
        overflow: hidden;
    }
    
    .event-card::after {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        opacity: 0;
        transition: opacity 0.5s ease;
        pointer-events: none;
    }
    
    .event-card:hover::after {
        opacity: 1;
        animation: rotate 10s linear infinite;
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        animation: slideInRight 0.3s ease;
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Initial load
loadEvents();

// Refresh events every 30 seconds (optional)
setInterval(loadEvents, 30000);