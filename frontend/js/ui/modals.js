export function openModal(id) { document.getElementById(id).classList.remove('hidden'); document.getElementById(id).classList.add('show'); }
export function closeModal(id) { document.getElementById(id).classList.remove('show'); document.getElementById(id).classList.add('hidden'); }
export function initModals() {
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('show');
            e.target.closest('.modal').classList.add('hidden');
        });
    });
}
