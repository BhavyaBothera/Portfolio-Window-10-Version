export function animateSkillsBars() {
    const bars = document.querySelectorAll('#win-skills .skill-bar-fill');
    bars.forEach((bar, idx) => {
        const targetWidth = bar.getAttribute('style')?.match(/width:\s*([\d.]+%)/)?.[1] || '80%';
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.transition = 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
            bar.style.width = targetWidth;
        }, idx * 60 + 100);
    });
}
