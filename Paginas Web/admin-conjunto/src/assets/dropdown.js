// Dropdown menu functionality
document.addEventListener('DOMContentLoaded', () => {
  const showMenu = (toggleId, navId) => {
    const toggle = document.getElementById(toggleId),
      nav = document.getElementById(navId);

    toggle?.addEventListener('click', () => {
      nav?.classList.toggle('show-menu');
      toggle?.classList.toggle('show-icon');
    });
  };

  showMenu('nav-toggle', 'nav-menu');

  // Dropdown functionality
  const dropdownItems = document.querySelectorAll('.dropdown__item');

  dropdownItems.forEach((item) => {
    const dropdownButton = item.querySelector('.dropdown-nav__link');

    dropdownButton?.addEventListener('click', () => {
      const showDropdown = document.querySelector('.show-dropdown');

      if (showDropdown && showDropdown !== item) {
        showDropdown.classList.remove('show-dropdown');
      }

      item.classList.toggle('show-dropdown');
    });
  });
});
