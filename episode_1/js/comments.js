document.addEventListener('DOMContentLoaded', () => {
    // Load comments for all frames
    loadAllComments();
    
    // Set up form submission for all comment forms
    document.querySelectorAll('.comment-form').forEach(form => {
        form.addEventListener('submit', handleCommentSubmit);
    });
    
    // Listen for frame changes to show/hide relevant comments
    document.addEventListener('frameChanged', (e) => {
        if (e.detail && e.detail.frameId) {
            showRelevantComments(e.detail.frameId);
        }
    });
});

async function loadAllComments() {
    try {
        const response = await fetch('/api/comments');
        if (!response.ok) throw new Error('Failed to fetch comments');
        
        const comments = await response.json();
        
        // Store comments in a global variable for quick access
        window.allFrameComments = comments;
        
        // Display comments for current frame if available
        const currentFrameId = getCurrentFrameId();
        if (currentFrameId) {
            showRelevantComments(currentFrameId);
        }
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

function getCurrentFrameId() {
    const activeFrame = document.querySelector('.frame.active');
    return activeFrame ? activeFrame.id : null;
}

function showRelevantComments(frameId) {
    // Hide all comment sections first
    document.querySelectorAll('.comment-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show only the comment section for the current frame
    const commentSection = document.getElementById(`comment-section-${frameId}`);
    if (commentSection) {
        commentSection.style.display = 'block';
        
        // Display comments for this frame
        if (window.allFrameComments && window.allFrameComments[frameId]) {
            displayComments(frameId, window.allFrameComments[frameId]);
        } else {
            displayComments(frameId, []);
        }
    }
}

function displayComments(frameId, comments) {
    const container = document.getElementById(`comments-${frameId}`);
    if (!container) return;
    
    // Clear loading text
    container.innerHTML = '';
    
    if (comments && comments.length > 0) {
        comments.forEach(comment => {
            const commentEl = document.createElement('div');
            commentEl.className = 'comment';
            commentEl.innerHTML = `
                <p>${escapeHTML(comment.text)}</p>
                <small>${new Date(comment.timestamp).toLocaleString()}</small>
            `;
            container.appendChild(commentEl);
        });
    } else {
        container.innerHTML = '<p class="no-comments">No comments yet.</p>';
    }
}

async function handleCommentSubmit(event) {
    event.preventDefault();
    
    // Get form and frame ID
    const form = event.target;
    const frameId = form.id.replace('comment-form-', '');
    const textarea = form.querySelector('textarea');
    const comment = textarea.value.trim();
    
    if (!comment) return;
    
    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                frameId,
                text: comment,
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) throw new Error('Failed to post comment');
        
        const newComment = await response.json();
        
        // Add the new comment to the display
        const container = document.getElementById(`comments-${frameId}`);
        
        // Remove "no comments" message if it exists
        const noComments = container.querySelector('.no-comments');
        if (noComments) container.removeChild(noComments);
        
        const commentEl = document.createElement('div');
        commentEl.className = 'comment';
        commentEl.innerHTML = `
            <p>${escapeHTML(newComment.text)}</p>
            <small>${new Date(newComment.timestamp).toLocaleString()}</small>
        `;
        container.appendChild(commentEl);
        
        // Update the global comments object
        if (!window.allFrameComments) window.allFrameComments = {};
        if (!window.allFrameComments[frameId]) window.allFrameComments[frameId] = [];
        window.allFrameComments[frameId].push(newComment);
        
        // Clear the textarea
        textarea.value = '';
    } catch (error) {
        console.error('Error posting comment:', error);
        alert('Failed to post comment. Please try again.');
    }
}

// Helper function to prevent XSS
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
} 