import { playSound } from '../core/audio.js';

export function animateExperienceTimeline() {
    const items = document.querySelectorAll('#win-experience .exp-timeline-item:not(.hidden)');
    items.forEach((item, idx) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(15px)';
        item.style.transition = 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, idx * 100 + 80);
    });
}

export function initExperienceTimeline() {
    document.querySelectorAll('#win-experience .exp-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#win-experience .exp-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.expFilter;
            const items = document.querySelectorAll('#win-experience .exp-timeline-item');

            items.forEach(item => {
                const category = item.dataset.category;
                if (filter === 'all' || category === filter) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });

            animateExperienceTimeline();
            playSound('click');
        });
    });
}
