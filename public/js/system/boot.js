/**
 * Boot Screen Controller
 */

export function initBootScreen() {
    const bootScreen = document.getElementById('boot-screen');
    if (!bootScreen) return;

    setTimeout(() => {
        bootScreen.classList.add('fade-out');
        setTimeout(() => {
            bootScreen.remove();
        }, 800);
    }, 2000);
}
