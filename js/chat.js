// Group Chat Engine for Registered Students & Teachers

const ChatEngine = {
    messages: INITIAL_CHAT_MESSAGES,

    renderMessages: function() {
        const studentBox = document.getElementById('chatMessagesBoxStudent');
        const teacherBox = document.getElementById('chatMessagesBoxTeacher');

        [studentBox, teacherBox].forEach(container => {
            if (!container) return;

            container.innerHTML = '';
            this.messages.forEach(msg => {
                const div = document.createElement('div');
                const isTeacher = msg.role === 'teacher';
                div.style.cssText = `margin-bottom: 12px; padding: 10px 14px; border-radius: 12px; max-width: 88%; ${isTeacher ? 'background: rgba(0, 242, 254, 0.12); border: 1px solid rgba(0, 242, 254, 0.3); margin-right: auto;' : 'background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08); margin-left: auto;'}`;

                div.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <strong style="font-size: 0.82rem; color: ${isTeacher ? 'var(--primary-cyan)' : 'var(--text-primary)'};">${msg.sender}</strong>
                        <span style="font-size: 0.7rem; color: var(--text-muted);">${msg.time}</span>
                    </div>
                    <div style="font-size: 0.88rem; color: var(--text-primary); line-height: 1.4;">${msg.text}</div>
                `;
                container.appendChild(div);
            });

            container.scrollTop = container.scrollHeight;
        });
    },

    sendMessage: function(text) {
        if (!text || !text.trim()) return;

        const user = AuthEngine.currentUser;
        const senderName = user ? (user.role === 'teacher' ? user.name : `${user.name} (${user.data.enrollNo})`) : "Anonymous Student";
        const role = user ? user.role : "student";
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        this.messages.push({
            sender: senderName,
            role: role,
            text: text.trim(),
            time: time
        });

        this.renderMessages();
        App.showNotification("Message sent to Group Chat!", "info");
    }
};
